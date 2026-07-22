import { Container } from '../../../../src/bootstrap/container';
import { DomainInitializer } from '../../../../src/bootstrap/initializers/domain-initializer';

describe('DomainInitializer Unit Tests', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it('should initialize stateless domain layer without throwing errors', async () => {
    const initializer = new DomainInitializer(container);
    await expect(initializer.initialize()).resolves.not.toThrow();
  });
});
