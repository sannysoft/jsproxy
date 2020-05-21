import * as util from 'util';
import * as colors from 'colors';

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
    if (message instanceof Error) {
      console.error(message);
    } else {
      log(message, colors.red);
    }
  } else {
    debug(`Error: ${message}`);
  }
}
