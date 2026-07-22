export class AuditVerifier {
  constructor(private readonly auditMock: any) {}

  public assertAuditEventLogged(eventType?: string): void {
    const fn = this.auditMock?.log || this.auditMock?.logEvent;
    if (!fn || !fn.mock?.calls?.length) {
      throw new Error(`Expected audit event ${eventType ? `"${eventType}"` : ''} to be logged`);
    }
  }
}
