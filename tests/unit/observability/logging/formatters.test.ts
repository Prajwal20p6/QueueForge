import { getDevFormatter, getProdFormatter, getTransport } from '../../../../src/observability/logging/formatters';

describe('Formatters Unit Tests', () => {
  it('should compile pino logger options for development and production formatters', () => {
    const devOpts = getDevFormatter('debug');
    const prodOpts = getProdFormatter('info');

    expect(devOpts.level).toBe('debug');
    expect(prodOpts.level).toBe('info');

    expect(devOpts.redact).toBeDefined();
    expect(prodOpts.redact).toBeDefined();
  });

  it('should resolve standard transporters based on environment settings', () => {
    const devTrans = getTransport('development');
    const prodTrans = getTransport('production');

    expect(devTrans.target).toBe('pino-pretty');
    expect(prodTrans.target).toBe('pino/file');
  });
});
