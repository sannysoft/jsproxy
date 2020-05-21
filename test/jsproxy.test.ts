import JsProxy from '../src/jsproxy';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Dummy test
 */
describe('Proxy test', () => {
  jest.setTimeout(5 * 60e3);

  it('JsProxy is instantiable', () => {
    expect(new JsProxy({})).toBeInstanceOf(JsProxy);
  });

  it('', async () => {
    const proxy = new JsProxy()
      .log(true)
      .sslConnectInterceptor(() => true)
      .requestInterceptor((rOptions, clientReq, clientRes, ssl, next) => {
        console.log(`URL requested：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
        console.log('cookie:', rOptions.headers.cookie);
        clientRes.setHeader('Content-Type', 'application/json');
        clientRes.end('Hello jsproxy!');
        next();
      })
      .responseInterceptor((req, res, proxyReq, proxyRes, ssl, next) => {
        next();
      })
      .externalProxy('http://127.0.0.1:8888');
    proxy.run();
    await sleep(100000);
  });
});
