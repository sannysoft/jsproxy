import * as http from 'http';
import stream from 'stream';

export type SslConnectInterceptorFn = (
  req: http.IncomingMessage,
  cltSocket: stream.Duplex,
  head: Buffer,
) => boolean;
