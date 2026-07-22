export class TraceVerifier {
  constructor(private readonly tracerMock: any) {}

  public assertSpanStarted(operationName?: string): void {
    const startSpan = this.tracerMock?.startSpan;
    if (!startSpan || !startSpan.mock?.calls?.length) {
      throw new Error(`Expected trace span ${operationName ? `"${operationName}"` : ''} to be created`);
    }
  }
}
