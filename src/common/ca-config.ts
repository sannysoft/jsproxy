import path from 'path';

class CaConfig {
  public caCertFileName: string = 'jsproxy.ca.crt';

  public caKeyFileName: string = 'jsproxy.ca.key.pem';

  public caName: string = 'jsproxy CA';

  // eslint-disable-next-line class-methods-use-this
  public getDefaultCABasePath(): string {
    const userHome = process.env.HOME || process.env.USERPROFILE || '';
    return path.resolve(userHome, './jsproxy');
  }

  public getDefaultCACertPath(): string {
    return path.resolve(this.getDefaultCABasePath(), this.caCertFileName);
  }

  public getDefaultCaKeyPath(): string {
    return path.resolve(this.getDefaultCABasePath(), this.caKeyFileName);
  }
}

export const caConfig = new CaConfig();
