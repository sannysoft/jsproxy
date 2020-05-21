import { IncomingMessage } from 'http';
import stream from 'stream';

export type UpgradeHandlerFn = (
  req: IncomingMessage,
  cltSocket: stream.Duplex,
  head: Buffer,
  ssl: boolean,
) => void;
