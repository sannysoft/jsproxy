import * as http from 'http';
import * as colors from 'colors';
import * as stream from 'stream';
import { ProxyConfig, UserProxyConfig } from './types/proxy-config';
import TlsUtils from './tls/tls-utils';
import { createUpgradeHandler } from './mitmproxy/create-upgrade-handler';
import { createFakeServerCenter } from './mitmproxy/create-fake-server-center';
import { createConnectHandler } from './mitmproxy/create-connect-handler';
import { createRequestHandler } from './mitmproxy/create-request-handler';
import { caConfig } from './common/ca-config';
import { log, logError, setLoggerEnabled } from './common/logger';
import { makeErr } from './common/common-utils';
import { SslConnectInterceptorFn } from './types/functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './types/functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './types/functions/response-interceptor-fn';
import { ExternalProxyFn } from './types/functions/external-proxy-fn';

// eslint-disable-next-line import/no-default-export
export default class JsProxy {
  protected proxyConfig: ProxyConfig;

  private server: http.Server;

  public constructor(userProxyConfig: UserProxyConfig = {}) {
    this.proxyConfig = JsProxy.setDefaultsForConfig(userProxyConfig);
    this.server = new http.Server();

    setLoggerEnabled(this.proxyConfig.log);
  }

  public port(port: number): JsProxy {
    this.proxyConfig.port = port;
    return this;
  }

  public sslConnectInterceptor(value: SslConnectInterceptorFn): JsProxy {
    this.proxyConfig.sslConnectInterceptor = value;
    return this;
  }

  public requestInterceptor(value: RequestInterceptorFn): JsProxy {
    this.proxyConfig.requestInterceptor = value;
    return this;
  }

  public responseInterceptor(value: ResponseInterceptorFn): JsProxy {
    this.proxyConfig.responseInterceptor = value;
    return this;
  }

  public log(value: boolean): JsProxy {
    this.proxyConfig.log = value;
    return this;
  }

  public ca(caKeyPath: string, caCertPath: string): JsProxy {
    this.proxyConfig.caKeyPath = caKeyPath;
    this.proxyConfig.caCertPath = caCertPath;
    return this;
  }

  public externalProxy(value: string | ExternalProxyFn | undefined): JsProxy {
    this.proxyConfig.externalProxy = value;
    return this;
  }

  private static setDefaultsForConfig(userConfig: UserProxyConfig): ProxyConfig {
    let { caCertPath, caKeyPath } = userConfig;

    if (!userConfig.caCertPath || !userConfig.caKeyPath) {
      const rs = TlsUtils.initCA(caConfig.getDefaultCABasePath());
      caCertPath = rs.caCertPath;
      caKeyPath = rs.caKeyPath;

      if (rs.create) {
        log(`CA Cert saved in: ${caCertPath}`, colors.cyan);
        log(`CA private key saved in: ${caKeyPath}`, colors.cyan);
      }
    }

    return {
      port: userConfig.port || 6789,
      log: userConfig.log || true,
      sslConnectInterceptor: userConfig.sslConnectInterceptor || undefined,
      requestInterceptor: userConfig.requestInterceptor || undefined,
      responseInterceptor: userConfig.responseInterceptor || undefined,

      getCertSocketTimeout: userConfig.getCertSocketTimeout || 10000,

      externalProxy: userConfig.externalProxy || undefined,

      caCertPath: caCertPath ?? makeErr('No caCertPath'),
      caKeyPath: caKeyPath ?? makeErr('No caKeyPath'),
    };
  }

  public run(): void {
    // Don't reject unauthorized
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const requestHandler = createRequestHandler(this.proxyConfig);
    const upgradeHandler = createUpgradeHandler();
    const fakeServersCenter = createFakeServerCenter(
      this.proxyConfig,
      requestHandler,
      upgradeHandler,
    );

    const connectHandler = createConnectHandler(
      this.proxyConfig.sslConnectInterceptor,
      fakeServersCenter,
    );

    this.server.listen(this.proxyConfig.port, () => {
      log(`jsproxy port: ${this.proxyConfig.port}`, colors.green);

      this.server.on('error', (e: Error) => {
        logError(e);
      });

      this.server.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
        const ssl = false;
        requestHandler(req, res, ssl);
      });

      // tunneling for https
      this.server.on(
        'connect',
        (req: http.IncomingMessage, cltSocket: stream.Duplex, head: Buffer) => {
          cltSocket.on('error', () => {});
          connectHandler(req, cltSocket, head);
        },
      );

      // TODO: handle WebSocket
      this.server.on(
        'upgrade',
        (req: http.IncomingMessage, socket: stream.Duplex, head: Buffer) => {
          const ssl = false;
          upgradeHandler(req, socket, head, ssl);
        },
      );
    });
  }

  public stop(): void {
    this.server.close(() => {});
  }
}
