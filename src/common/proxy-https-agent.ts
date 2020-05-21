// @ts-ignore
import { HttpsAgent as HttpsAgentOrigin } from 'agentkeepalive';

export class ProxyHttpsAgent extends HttpsAgentOrigin {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(opts: any) {
    super(opts);
  }

  // TODO
  // public getName(option: any): string {
  //   let name = HttpsAgentOrigin.prototype.getName.call(this, option);
  //   name += ':';
  //   if (option.customSocketId) {
  //     name += option.customSocketId;
  //   }
  //   return name;
  // }
}
