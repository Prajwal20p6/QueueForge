import express from 'express';
import request from 'supertest';
import { createAdminRouter, AdminControllers } from '../../../src/api/admin/routes/admin.routes';
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

import { AdminDashboardController } from '../../../src/api/admin/controllers/admin-dashboard.controller';
import { DeliveryExplorerController } from '../../../src/api/admin/controllers/delivery-explorer.controller';
import { RetryManagerController } from '../../../src/api/admin/controllers/retry-manager.controller';
import { DLQManagerController } from '../../../src/api/admin/controllers/dlq-manager.controller';
import { WorkerManagerController } from '../../../src/api/admin/controllers/worker-manager.controller';
import { DaemonManagerController } from '../../../src/api/admin/controllers/daemon-manager.controller';
import { ConfigurationManagerController } from '../../../src/api/admin/controllers/configuration-manager.controller';
import { AuditExplorerController } from '../../../src/api/admin/controllers/audit-explorer.controller';
import { ApiKeyManagerController } from '../../../src/api/admin/controllers/api-key-manager.controller';
import { RoleManagerController } from '../../../src/api/admin/controllers/role-manager.controller';
import { SystemDiagnosticsController } from '../../../src/api/admin/controllers/system-diagnostics.controller';
import { AnalyticsController } from '../../../src/api/admin/controllers/analytics.controller';
import { ExportsController } from '../../../src/api/admin/controllers/exports.controller';

describe('Admin Platform Integration Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    const controllers: AdminControllers = {
      dashboardController: new AdminDashboardController(new DashboardService()),
      deliveryExplorerController: new DeliveryExplorerController(new DeliveryExplorerService()),
      retryManagerController: new RetryManagerController(new RetryManagerService()),
      dlqManagerController: new DLQManagerController(new DLQManagerService()),
      workerManagerController: new WorkerManagerController(new WorkerManagerService()),
      daemonManagerController: new DaemonManagerController(new DaemonManagerService()),
      configurationManagerController: new ConfigurationManagerController(new ConfigurationService()),
      auditExplorerController: new AuditExplorerController(new AuditService()),
      apiKeyManagerController: new ApiKeyManagerController(new ApiKeyService()),
      roleManagerController: new RoleManagerController(new RoleService()),
      systemDiagnosticsController: new SystemDiagnosticsController(new DiagnosticService()),
      analyticsController: new AnalyticsController(new AnalyticsService()),
      exportsController: new ExportsController(new ExportService()),
    };

    const router = createAdminRouter(controllers);
    app.use('/admin', router);
  });

  it('should reject unauthenticated admin requests with 401', async () => {
    const res = await request(app).get('/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('should allow authenticated admin requests and return dashboard metrics', async () => {
    const res = await request(app)
      .get('/admin/dashboard')
      .set('x-admin-key', 'secret-admin-key');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.systemHealth.status).toBe('HEALTHY');
  });

  it('should list deliveries via Admin API', async () => {
    const res = await request(app)
      .get('/admin/deliveries?page=1&limit=10')
      .set('x-admin-key', 'secret-admin-key');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('should create API key via Admin API', async () => {
    const res = await request(app)
      .post('/admin/api-keys')
      .set('x-admin-key', 'secret-admin-key')
      .send({ name: 'IntegrationKey', tier: 'ENTERPRISE' });

    expect(res.status).toBe(201);
    expect(res.body.data.keyId).toBeDefined();
  });
});
