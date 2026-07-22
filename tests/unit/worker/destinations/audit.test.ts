import { AuditConnector } from '../../../../src/worker/destinations/audit';

describe('AuditConnector Unit Tests', () => {
  let connector: AuditConnector;
  let destination: any;
  let logger: any;
  let metrics: any;
  let tracer: any;
  let auditLogger: any;

  beforeEach(() => {
    destination = {
      id: 'dest-1',
      endpointUrl: 'audit-log',
      destinationType: 'AUDIT',
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    metrics = {
      getMeter: jest.fn().mockReturnValue({
        createCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
      }),
    };
    tracer = {
      getTracer: jest.fn().mockReturnValue({
        startSpan: jest.fn().mockReturnValue({
          setAttribute: jest.fn(),
          end: jest.fn(),
        }),
      }),
      getTraceId: jest.fn().mockReturnValue('trace-123'),
    };
    auditLogger = {
      logEvent: jest.fn(),
    };

    connector = new AuditConnector(destination, {}, logger, metrics, tracer, auditLogger);
  });

  it('should format and write logs to audit logger system', async () => {
    const delivery: any = {
      id: 'delivery-1',
      taskResultId: 'result-1',
      destinationId: 'dest-1',
    };

    const res = await connector.execute({ diff: 'data' }, delivery);
    expect(res.success).toBe(true);
    expect(auditLogger.logEvent).toHaveBeenCalledWith(
      'TASK_RESULT_DELIVERED',
      'TaskResultDelivery',
      'delivery-1',
      'deliver',
      { diff: 'data' },
      expect.any(Object)
    );
  });
});
