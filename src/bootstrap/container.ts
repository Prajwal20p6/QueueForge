interface ServiceRegistration {
  factory: () => any;
  isAsync: boolean;
  singleton: boolean;
  instance?: any;
  promise?: Promise<any>;
}

/**
 * Dependency Injection container supporting sync/async factories, lazy creation, and singleton caching.
 */
export class Container {
  private static instance: Container | null = null;
  private readonly services = new Map<string, ServiceRegistration>();

  /**
   * Retrieves or instantiates global singleton Container instance.
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Registers a synchronous factory dependency.
   */
  public register<T>(key: string, factory: () => T, singleton: boolean = true): void {
    this.services.set(key, {
      factory,
      isAsync: false,
      singleton,
    });
  }

  /**
   * Registers an asynchronous factory dependency.
   */
  public registerAsync<T>(key: string, factory: () => Promise<T>, singleton: boolean = true): void {
    this.services.set(key, {
      factory,
      isAsync: true,
      singleton,
    });
  }

  /**
   * Retrieves synchronous dependency by registration key.
   */
  public get<T>(key: string): T {
    const reg = this.services.get(key);
    if (!reg) {
      throw new Error(`Dependency "${key}" is not registered in the DI Container`);
    }

    if (reg.isAsync) {
      throw new Error(`Dependency "${key}" is asynchronous. Use getAsync() instead.`);
    }

    if (reg.singleton) {
      if (reg.instance === undefined) {
        reg.instance = reg.factory();
      }
      return reg.instance;
    }

    return reg.factory();
  }

  /**
   * Retrieves asynchronous dependency by registration key.
   */
  public async getAsync<T>(key: string): Promise<T> {
    const reg = this.services.get(key);
    if (!reg) {
      throw new Error(`Dependency "${key}" is not registered in the DI Container`);
    }

    if (reg.singleton) {
      if (reg.instance !== undefined) {
        return reg.instance;
      }

      if (!reg.promise) {
        reg.promise = Promise.resolve(reg.factory()).then(inst => {
          reg.instance = inst;
          return inst;
        });
      }

      return reg.promise;
    }

    return Promise.resolve(reg.factory());
  }

  /**
   * Asserts whether a key has been registered in container.
   */
  public has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Introspects all active service registrations and cached singleton instances.
   */
  public getAll(): Map<string, any> {
    const map = new Map<string, any>();
    for (const [key, reg] of this.services.entries()) {
      map.set(key, reg.instance !== undefined ? reg.instance : reg.factory);
    }
    return map;
  }

  /**
   * Clears all registered services and cached singleton instances.
   */
  public clear(): void {
    this.services.clear();
  }
}
