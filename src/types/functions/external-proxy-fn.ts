import { IncomingMessage } from 'http';

export type ExternalProxyFn = (req: IncomingMessage, ssl: boolean) => string;
