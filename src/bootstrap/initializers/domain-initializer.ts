import { Container } from '../container';

/**
 * Initializer for Domain layer (stateless domain models, schemas, and guards).
 */
export class DomainInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    // Pure domain logic requires no dynamic async state setup
    if (!this.container) return;
  }
}
