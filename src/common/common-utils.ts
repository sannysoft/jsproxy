import url from 'url';
// @ts-ignore
import tunnelAgent from 'tunnel-agent';
import * as http from 'http';
import { ProxyHttpsAgent } from './proxy-https-agent';
import { ProxyHttpAgent } from './proxy-http-agent';
import { ExternalProxyFn } from '../types/functions/external-proxy-fn';
import { RequestOptions } from '../types/request-options';
import { logError } from './logger';

const httpsAgent = new ProxyHttpsAgent({
  keepAlive: true,
  timeout: 60000,
});

const httpAgent = new ProxyHttpAgent({
  keepAlive: true,
  timeout: 60000,
});

let socketId = 0;

let httpsOverHttpAgent: boolean;
let httpOverHttpsAgent: boolean;
let httpsOverHttpsAgent: boolean;

export function makeErr(message: string): never {
  throw new Error(message);
}

export class CommonUtils {
  public static getOptionsFromRequest(
    req: http.IncomingMessage,
    ssl: boolean,
    externalProxy: string | ExternalProxyFn | undefined = undefined,
  ): RequestOptions {
    const urlObject = url.parse(req?.url ?? makeErr('No URL specified'));
    const defaultPort = ssl ? 443 : 80;
    const protocol = ssl ? 'https:' : 'http:';
    const headers = Object.assign({}, req.headers);

    const externalProxyUrl = this.getExternalProxyUrl(externalProxy, req, ssl);

    delete headers['proxy-connection'];

    let agent: any = false;
    if (!externalProxyUrl) {
      // keepAlive
      if (headers.connection !== 'close') {
        if (protocol === 'https:') {
          agent = httpsAgent;
        } else {
          agent = httpAgent;
        }
        headers.connection = 'keep-alive';
      }
    } else {
      agent = CommonUtils.getTunnelAgent(protocol === 'https:', externalProxyUrl);
    }

    const requestHost: string = req.headers?.host ?? makeErr('No request hostname set');

    const options: RequestOptions = {
      protocol: protocol,
      hostname: requestHost.split(':')[0],
      method: req.method ?? makeErr('No request method set'),
      port: Number(requestHost.split(':')[1] || defaultPort),
      path: urlObject.path ?? makeErr('No request path set'),
      headers: req.headers,
      agent: agent,
    };

    if (
      protocol === 'http:' &&
      externalProxyUrl &&
      url.parse(externalProxyUrl).protocol === 'http:'
    ) {
      const externalURL = url.parse(externalProxyUrl);
      options.hostname = externalURL.hostname ?? makeErr('No external proxy hostname');
      options.port = Number(externalURL.port ?? makeErr('No external proxy port'));

      // support non-transparent proxy
      options.path = `http://${urlObject.host}${urlObject.path}`;
    }

    // TODO: Check if we ever have customSocketId
    // mark a socketId for Agent to bind socket for NTLM
    // @ts-ignore
    if (req.socket.customSocketId) {
      // @ts-ignore
      options.customSocketId = req.socket.customSocketId;
    } else if (headers.authorization) {
      // @ts-ignore
      req.socket.customSocketId = socketId++;
      // @ts-ignore
      options.customSocketId = req.socket.customSocketId;
    }

    return options;
  }

  private static getExternalProxyUrl(
    externalProxy: string | ExternalProxyFn | undefined,
    req: http.IncomingMessage,
    ssl: boolean,
  ): string | undefined {
    let externalProxyUrl: string | undefined;

    if (externalProxy) {
      if (typeof externalProxy === 'string') {
        externalProxyUrl = externalProxy;
      } else if (typeof externalProxy === 'function') {
        try {
          externalProxyUrl = externalProxy(req, ssl);
        } catch (error) {
          logError(error);
        }
      }
    }

    return externalProxyUrl;
  }

  private static getTunnelAgent(isSsl: boolean, externalProxyUrl: string): any {
    const urlObject = url.parse(externalProxyUrl);
    const externalProxyProtocol = urlObject.protocol || 'http:';
    const port: number | null = Number(
      urlObject?.port ?? (externalProxyProtocol === 'http:' ? 80 : 443),
    );

    const hostname = urlObject.hostname || 'localhost';

    if (isSsl) {
      if (externalProxyProtocol === 'http:') {
        if (!httpsOverHttpAgent) {
          httpsOverHttpAgent = tunnelAgent.httpsOverHttp({
            proxy: {
              host: hostname,
              port: port,
            },
          });
        }
        return httpsOverHttpAgent;
      }
      if (!httpsOverHttpsAgent) {
        httpsOverHttpsAgent = tunnelAgent.httpsOverHttps({
          proxy: {
            host: hostname,
            port: port,
          },
        });
      }
      return httpsOverHttpsAgent;
    }
    if (externalProxyProtocol === 'http:') {
      // if (!httpOverHttpAgent) {
      //     httpOverHttpAgent = tunnelAgent.httpOverHttp({
      //         proxy: {
      //             host: hostname,
      //             port: port
      //         }
      //     });
      // }
      return false;
    }
    if (!httpOverHttpsAgent) {
      httpOverHttpsAgent = tunnelAgent.httpOverHttps({
        proxy: {
          host: hostname,
          port: port,
        },
      });
    }
    return httpOverHttpsAgent;
  }
}
