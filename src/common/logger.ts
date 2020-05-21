import * as util from 'util';

const debug = util.debuglog('jsproxy');

let loggerEnabled = false;

type colorFn = (str: string) => string;

export function setLoggerEnabled(enabled: boolean): void {
  loggerEnabled = enabled;
}

export function log(message: string, colorFn?: colorFn): void {
  if (loggerEnabled) {
    const formattedMessage = colorFn?.(message) ?? message;
    console.log(formattedMessage);
  } else {
    debug(message);
  }
}

export function logError(message: string | Error): void {
  if (loggerEnabled) {
    console.error(message);
  } else {
    debug(`Error: ${message}`);
  }
}
