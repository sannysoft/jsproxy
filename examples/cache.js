import JsProxy from 'jsproxy';

const cache = {};

const proxy = new JsProxy()
  .sslConnectInterceptor(true)
  .requestInterceptor((rOptions, clientReq, clientRes, ssl, next) => {
    const url = `${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}${rOptions.path}`;
    clientReq.fullUrl = url;

    if (rOptions.method === 'GET') {
      // For GET requests let's see if we have it cached
      if (url in cache) {
        console.log('IN CACHE');

        const c = cache[url];

        // Send headers, status & body to the client
        Object.entries(c.headers).forEach(([name, value]) => {
          // @ts-ignore
          clientRes.setHeader(name, value ?? '');
        });
        clientRes.writeHead(c.statusCode ?? 200);

        clientRes.end(c.body);
      }
    }

    next();
  })
  .responseInterceptor((clientReq, clientRes, proxyReq, proxyRes, ssl, next) => {
    const url = clientReq.fullUrl;

    // Send headers and status code
    Object.entries(proxyRes.headers).forEach(([name, value]) => {
      clientRes.setHeader(name, value ?? '');
    });
    clientRes.writeHead(proxyRes.statusCode ?? 200);

    // Listen for data and save & send to client
    const bufs = [];
    proxyRes.on('data', d => {
      bufs.push(d);
      clientRes.write(d);
    });
    proxyRes.on('end', () => {
      clientRes.end();
      const buf = Buffer.concat(bufs);
      cache[url] = {
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers,
        body: buf,
      };
    });
  });

process.once('SIGTERM', code => {
  console.log('SIGTERM received...');
  proxy.close();
});

proxy.run();
