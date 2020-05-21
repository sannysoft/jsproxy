# JSProxy

`Originally created by wuchangming`

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Dev Dependencies](https://david-dm.org/alexjoverm/typescript-library-starter/dev-status.svg)](https://david-dm.org/alexjoverm/typescript-library-starter?type=dev)

JS Proxy library with support for request/response rewriting, optional SSL MITM (man-in-the-middle), external proxy.


### Installation

```bash
npm i jsproxy
```

###Usage

```js
import JsProxy from 'jsproxy';

const proxy = new JsProxy()
  .log(true)
  .sslConnectInterceptor((req, cltSocket, head) => true)
  .requestInterceptor((rOptions, clientReq, clientRes, ssl, next) => {
    console.log(`URL requested：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
    console.log('Cookies:', rOptions.headers.cookie);
    clientRes.end('Hello jsproxy!');
    next();
  })
  .responseInterceptor((req, res, proxyReq, proxyRes, ssl, next) => {
    next();
  })
  .externalProxy('http://127.0.0.1:8888');
  
// Start listening 
proxy.run();

...

proxy.stop()
```

### Features

 - Optional request/response interception
 - Optional MITM for SSL requests
 - Optional external proxy
 - Written in TypeScript
 
