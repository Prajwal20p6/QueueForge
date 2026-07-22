import { DashboardService } from '../../../src/api/admin/services/dashboard.service';
import { DeliveryExplorerService } from '../../../src/api/admin/services/delivery-explorer.service';
import { RetryManagerService } from '../../../src/api/admin/services/retry-manager.service';
import { DLQManagerService } from '../../../src/api/admin/services/dlq-manager.service';
import { WorkerManagerService } from '../../../src/api/admin/services/worker-manager.service';
import { DaemonManagerService } from '../../../src/api/admin/services/daemon-manager.service';
import { ConfigurationService } from '../../../src/api/admin/services/configuration.service';
import { AuditService } from '../../../src/api/admin/services/audit-service';
import { ApiKeyService } from '../../../src/api/admin/services/api-key-service';
import { RoleService } from '../../../src/api/admin/services/role-service';
import { DiagnosticService } from '../../../src/api/admin/services/diagnostic-service';
import { AnalyticsService } from '../../../src/api/admin/services/analytics.service';
import { ExportService } from '../../../src/api/admin/services/export.service';

describe('Admin Services Unit Tests', () => {
  it('should get dashboard data', async () => {
    const service = new DashboardService();
    const data = await service.getDashboardData();
    expect(data.systemHealth.status).toBe('HEALTHY');
    expect(data.queueStats).toBeDefined();
  });

  it('should list deliveries with pagination', async () => {
    const service = new DeliveryExplorerService();
    const result = await service.listDeliveries({ page: 1, limit: 10 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should execute retry batch', async () => {
    const service = new RetryManagerService();
    const res = await service.retryBatch(['00000000-0000-0000-0000-000000000001']);
    expect(res.successCount).toBe(1);
  });

  it('should analyze DLQ patterns', async () => {
    const service = new DLQManagerService();
    const analysis = await service.analyzeDLQPatterns();
    expect(analysis.topErrors).toHaveLength(2);
  });

  it('should list worker nodes', async () => {
    const service = new WorkerManagerService();
    const workers = await service.getWorkerList();
    expect(workers).toHaveLength(1);
  });

  it('should list background daemons', async () => {
    const service = new DaemonManagerService();
    const daemons = await service.getDaemonList();
    expect(daemons).toHaveLength(3);
  });

  it('should toggle feature flag', async () => {
    const service = new ConfigurationService();
    await service.toggleFeatureFlag('testFlag', true);
    const flags = await service.getFeatureFlags();
    expect(flags.testFlag).toBe(true);
  });

  it('should generate compliance report', async () => {
    const service = new AuditService();
    const report = await service.generateComplianceReport('2026-01-01', '2026-01-31');
    expect(report.totalEvents).toBe(120);
  });

  it('should create and revoke API Key', async () => {
    const service = new ApiKeyService();
    const { keyId } = await service.createApiKey('TestKey', 'PREMIUM');
    let keys = await service.listApiKeys();
    expect(keys[0].enabled).toBe(true);

    await service.revokeApiKey(keyId);
    keys = await service.listApiKeys();
    expect(keys[0].enabled).toBe(false);
  });

  it('should create role and user', async () => {
    const service = new RoleService();
    const role = await service.createRole('Manager', ['read', 'write']);
    const user = await service.createUser('mgr@example.com', 'Manager User', [role.id]);
    expect(user.roles[0].name).toBe('Manager');
  });

  it('should fetch diagnostics and resource usage', async () => {
    const service = new DiagnosticService();
    const usage = await service.getResourceUsage();
    expect(usage.cpuUsagePercent).toBeGreaterThan(0);
  });

  it('should fetch analytics overview', async () => {
    const service = new AnalyticsService();
    const overview = await service.getAnalyticsOverview('7d');
    expect(overview.timeRange).toBe('7d');
  });

  it('should create export job', async () => {
    const service = new ExportService();
    const job = await service.createExportJob('DELIVERIES', 'CSV');
    expect(job.format).toBe('CSV');
  });
});
