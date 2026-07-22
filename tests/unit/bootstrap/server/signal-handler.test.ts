import { SignalHandler } from '../../../../src/bootstrap/server/signal-handler';

describe('SignalHandler Unit Tests', () => {
  it('should register and unregister signal listeners', () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    const handler = new SignalHandler(undefined, callback);

    expect(() => handler.setup()).not.toThrow();
    expect(() => handler.teardown()).not.toThrow();
  });
});
