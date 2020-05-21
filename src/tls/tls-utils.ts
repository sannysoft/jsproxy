import forge from 'node-forge';
import mkdirp from 'mkdirp';
import * as _ from 'lodash';
import path from 'path';
import fs from 'fs';
import { CaConfig } from '../types/ca-config';
import { CaPair } from '../types/ca-pair';
import { caConfig } from '../common/ca-config';

export default class TlsUtils {
  public static createCA(CN: string): CaPair {
    const keys = forge.pki.rsa.generateKeyPair(2046);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = `${new Date().getTime()}`;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);
    const attrs = [
      {
        name: 'commonName',
        value: CN,
      },
      {
        name: 'countryName',
        value: 'CN',
      },
      {
        shortName: 'ST',
        value: 'GuangDong',
      },
      {
        name: 'localityName',
        value: 'ShenZhen',
      },
      {
        name: 'organizationName',
        value: 'node-mitmproxy',
      },
      {
        shortName: 'OU',
        value: 'https://github.com/wuchangming/node-mitmproxy',
      },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      {
        name: 'basicConstraints',
        critical: true,
        cA: true,
      },
      {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true,
      },
      {
        name: 'subjectKeyIdentifier',
      },
    ]);

    // self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: cert,
    };
  }

  public static covertNodeCertToForgeCert(
    originCertificate: forge.pki.Certificate,
  ): forge.pki.Certificate {
    // TODO: Check
    // @ts-ignore
    const obj = forge.asn1.fromDer(originCertificate.raw.toString('binary'));
    return forge.pki.certificateFromAsn1(obj);
  }

  public static createFakeCertificateByDomain(caPair: CaPair, domain: string): CaPair {
    const keys = forge.pki.rsa.generateKeyPair(2046);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = `${new Date().getTime()}`;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
    const attrs = [
      {
        name: 'commonName',
        value: domain,
      },
      {
        name: 'countryName',
        value: 'CN',
      },
      {
        shortName: 'ST',
        value: 'GuangDong',
      },
      {
        name: 'localityName',
        value: 'ShengZhen',
      },
      {
        name: 'organizationName',
        value: 'node-mitmproxy',
      },
      {
        shortName: 'OU',
        value: 'https://github.com/wuchangming/node-mitmproxy',
      },
    ];

    cert.setIssuer(caPair.cert.subject.attributes);
    cert.setSubject(attrs);

    cert.setExtensions([
      {
        name: 'basicConstraints',
        critical: true,
        cA: false,
      },
      {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true,
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2,
            value: domain,
          },
        ],
      },
      {
        name: 'subjectKeyIdentifier',
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true,
      },
      {
        name: 'authorityKeyIdentifier',
      },
    ]);
    cert.sign(caPair.key, forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: cert,
    };
  }

  public static createFakeCertificateByCA(
    caPair: CaPair,
    originCertificate: forge.pki.Certificate,
  ): CaPair {
    const certificate = TlsUtils.covertNodeCertToForgeCert(originCertificate);

    const keys = forge.pki.rsa.generateKeyPair(2046);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = certificate.serialNumber;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    cert.setSubject(certificate.subject.attributes);
    cert.setIssuer(caPair.cert.subject.attributes);

    // @ts-ignore
    if (certificate.subjectaltname)
      // @ts-ignore
      cert.subjectaltname = certificate.subjectaltname;

    const subjectAltName = _.find(certificate.extensions, {
      name: 'subjectAltName',
    });

    cert.setExtensions([
      {
        name: 'basicConstraints',
        critical: true,
        cA: false,
      },
      {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true,
      },
      {
        name: 'subjectAltName',
        altNames: subjectAltName.altNames,
      },
      {
        name: 'subjectKeyIdentifier',
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true,
      },
      {
        name: 'authorityKeyIdentifier',
      },
    ]);
    cert.sign(caPair.key, forge.md.sha256.create());

    return {
      key: keys.privateKey,
      cert: cert,
    };
  }

  public static isBrowserRequest(userAgent: string): boolean {
    return /Mozilla/i.test(userAgent);
  }

  public static isMappingHostName(DNSName: string, hostname: string): boolean {
    let reg = DNSName.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
    reg = `^${reg}$`;
    return new RegExp(reg).test(hostname);
  }

  public static getMappingHostNamesFormCert(cert: forge.pki.Certificate): string[] {
    let mappingHostNames = [cert.subject.getField('CN')?.value ?? []];

    // @ts-ignore
    const altNames = cert.getExtension('subjectAltName')?.altNames ?? [];

    mappingHostNames = mappingHostNames.concat(_.map(altNames, 'value'));

    return mappingHostNames;
  }

  public static initCA(basePath: string): CaConfig {
    const caCertPath = path.resolve(basePath, caConfig.caCertFileName);
    const caKeyPath = path.resolve(basePath, caConfig.caKeyFileName);

    try {
      fs.accessSync(caCertPath, fs.constants.F_OK);
      fs.accessSync(caKeyPath, fs.constants.F_OK);

      // has exist
      return {
        caCertPath,
        caKeyPath,
        create: false,
      };
    } catch (error) {
      const caObj = TlsUtils.createCA(caConfig.caName);

      const caCert = caObj.cert;
      const cakey = caObj.key;

      const certPem = forge.pki.certificateToPem(caCert);
      const keyPem = forge.pki.privateKeyToPem(cakey);

      mkdirp.sync(path.dirname(caCertPath));
      fs.writeFileSync(caCertPath, certPem);
      fs.writeFileSync(caKeyPath, keyPem);
    }
    return {
      caCertPath,
      caKeyPath,
      create: true,
    };
  }
}
