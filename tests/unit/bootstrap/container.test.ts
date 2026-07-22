import { Container } from '../../../src/bootstrap/container';

describe('Container Unit Tests', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it('should register and retrieve synchronous dependencies', () => {
    container.register('service', () => ({ name: 'TestService' }));
    expect(container.has('service')).toBe(true);

    const service = container.get<{ name: string }>('service');
    expect(service.name).toBe('TestService');
  });

  it('should cache singleton instances by default', () => {
    container.register('singleton', () => ({ timestamp: Math.random() }));

    const instance1 = container.get<{ timestamp: number }>('singleton');
    const instance2 = container.get<{ timestamp: number }>('singleton');

    expect(instance1).toBe(instance2);
    expect(instance1.timestamp).toBe(instance2.timestamp);
  });

  it('should return new instances when singleton is false', () => {
    container.register('transient', () => ({ id: Math.random() }), false);

    const instance1 = container.get<{ id: number }>('transient');
    const instance2 = container.get<{ id: number }>('transient');

    expect(instance1).not.toBe(instance2);
  });

  it('should register and retrieve async dependencies using getAsync', async () => {
    container.registerAsync('asyncService', async () => {
      return { loaded: true };
    });

    expect(container.has('asyncService')).toBe(true);

    const result = await container.getAsync<{ loaded: boolean }>('asyncService');
    expect(result.loaded).toBe(true);
  });

  it('should cache singleton async dependencies', async () => {
    container.registerAsync('asyncSingleton', async () => {
      return { id: Math.random() };
    });

    const res1 = await container.getAsync<{ id: number }>('asyncSingleton');
    const res2 = await container.getAsync<{ id: number }>('asyncSingleton');

    expect(res1).toBe(res2);
  });

  it('should throw an error when retrieving unregistered dependencies', () => {
    expect(() => container.get('unregistered')).toThrow(
      'Dependency "unregistered" is not registered in the DI Container'
    );
  });

  it('should throw an error when calling get() on async dependencies', () => {
    container.registerAsync('asyncOnly', async () => 'data');
    expect(() => container.get('asyncOnly')).toThrow(
      'Dependency "asyncOnly" is asynchronous. Use getAsync() instead.'
    );
  });

  it('should introspect registered services with getAll()', () => {
    container.register('a', () => 'valueA');
    container.register('b', () => 'valueB');

    const map = container.getAll();
    expect(map.has('a')).toBe(true);
    expect(map.has('b')).toBe(true);
  });

  it('should clear all registrations with clear()', () => {
    container.register('key', () => 'val');
    container.clear();
    expect(container.has('key')).toBe(false);
  });
});
