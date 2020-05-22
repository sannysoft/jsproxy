import JsProxy from 'jsproxy';

const proxy = new JsProxy()
  .log(message => {
    console.log(message);
  })
  .errorLog(error => {
    console.error(error);
  })
  .sslConnectInterceptor(() => true)
  .requestInterceptor((rOptions, clientReq, clientRes, ssl, next) => {
    clientReq.setTimeout(10000); // Set request timeout to 10 seconds

    console.log(`URL requested：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
    console.log('Cookie:', rOptions.headers.cookie);

    if (rOptions.url.includes('test')) {
      clientRes.setHeader('Content-Type', 'application/json');
      clientRes.end('Hello jsproxy!');
      // If we call clientRes.end and close client socket in request interception
      // then no other actions are performed
    }

    next();
  })
  .responseInterceptor((clientReq, clientRes, proxyReq, proxyRes, ssl, next) => {
    // proxyRes will be piped to clientRes, we can change proxyRes or write to clientRes directly here
    proxyRes.headers['test_header'] = 'test';

    if (proxyRes.statusCode === 301) {
      clientRes.setHeader('Content-Type', 'text/html');
      clientRes.statusCode = 404;
      clientRes.end('NO REDIRECTS HERE');
    }

    next();
  });

process.once('SIGTERM', function(code) {
  console.log('SIGTERM received...');
  proxy.close();
});

proxy.run();
