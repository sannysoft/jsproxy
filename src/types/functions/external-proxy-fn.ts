import { IncomingMessage } from 'http';
import { ExternalProxyConfig } from '../external-proxy-config';

export type ExternalProxyFn = (req: IncomingMessage, ssl: boolean) => ExternalProxyConfig;
