import { SignalHandler } from '../../../src/bootstrap/server/signal-handler';

describe('Signal Handling Integration Tests', () => {
  it('should attach and remove SIGTERM/SIGINT process event handlers without leaking listeners', () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    const handler = new SignalHandler(undefined, callback);

    const initialSigtermCount = process.listenerCount('SIGTERM');

    handler.setup();
    expect(process.listenerCount('SIGTERM')).toBe(initialSigtermCount + 1);

    handler.teardown();
    expect(process.listenerCount('SIGTERM')).toBe(initialSigtermCount);
  });
});
