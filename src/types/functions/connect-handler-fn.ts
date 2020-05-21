import { IncomingMessage } from 'http';
import stream from 'stream';

export type ConnectHandlerFn = (
  req: IncomingMessage,
  cltSocket: stream.Duplex,
  head: Buffer,
) => void;
