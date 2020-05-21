import JsProxy from '../src/jsproxy';

/**
 * Dummy test
 */
describe('Dummy test', () => {
  it('works if true is truthy', () => {
    expect(true).toBeTruthy();
  });

  it('JsProxy is instantiable', () => {
    expect(new JsProxy({})).toBeInstanceOf(JsProxy);
  });

  it('', () => {
    const proxy = new JsProxy({});
    proxy.run();
  });
});
