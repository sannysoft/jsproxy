import { SslConnectInterceptorFn } from './functions/ssl-connect-interceptor';
import { RequestInterceptorFn } from './functions/request-interceptor-fn';
import { ResponseInterceptorFn } from './functions/response-interceptor-fn';
import { ExternalProxyFn } from './functions/external-proxy-fn';
import { ExternalProxyConfig } from './external-proxy-config';

export interface ProxyConfig {
  port: number;
  log: boolean;

  sslConnectInterceptor: SslConnectInterceptorFn | undefined;
  requestInterceptor: RequestInterceptorFn | undefined;
  responseInterceptor: ResponseInterceptorFn | undefined;

  getCertSocketTimeout: number;

  externalProxy: ExternalProxyConfig | ExternalProxyFn | undefined;

  caCertPath: string;
  caKeyPath: string;
}

export type UserProxyConfig = Partial<ProxyConfig>;
