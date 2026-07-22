export class LogVerifier {
  constructor(private readonly loggerMock: any) {}

  public assertLogged(level: 'info' | 'warn' | 'error' | 'debug'): void {
    const fn = this.loggerMock?.[level];
    if (!fn || !fn.mock?.calls?.length) {
      throw new Error(`Expected log entry at level "${level}"`);
    }
  }
}
