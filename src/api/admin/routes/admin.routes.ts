import { Router } from 'express';
import { adminAuthMiddleware, adminAuditMiddleware } from './admin-middleware';
import { AdminDashboardController } from '../controllers/admin-dashboard.controller';
import { DeliveryExplorerController } from '../controllers/delivery-explorer.controller';
import { RetryManagerController } from '../controllers/retry-manager.controller';
import { DLQManagerController } from '../controllers/dlq-manager.controller';
import { WorkerManagerController } from '../controllers/worker-manager.controller';
import { DaemonManagerController } from '../controllers/daemon-manager.controller';
import { ConfigurationManagerController } from '../controllers/configuration-manager.controller';
import { AuditExplorerController } from '../controllers/audit-explorer.controller';
import { ApiKeyManagerController } from '../controllers/api-key-manager.controller';
import { RoleManagerController } from '../controllers/role-manager.controller';
import { SystemDiagnosticsController } from '../controllers/system-diagnostics.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { ExportsController } from '../controllers/exports.controller';

export interface AdminControllers {
  dashboardController: AdminDashboardController;
  deliveryExplorerController: DeliveryExplorerController;
  retryManagerController: RetryManagerController;
  dlqManagerController: DLQManagerController;
  workerManagerController: WorkerManagerController;
  daemonManagerController: DaemonManagerController;
  configurationManagerController: ConfigurationManagerController;
  auditExplorerController: AuditExplorerController;
  apiKeyManagerController: ApiKeyManagerController;
  roleManagerController: RoleManagerController;
  systemDiagnosticsController: SystemDiagnosticsController;
  analyticsController: AnalyticsController;
  exportsController: ExportsController;
}

/**
 * Creates and mounts all 13 Admin API endpoint routes.
 */
export function createAdminRouter(controllers: AdminControllers): Router {
  const router = Router();

  router.use(adminAuthMiddleware);
  router.use(adminAuditMiddleware);

  // 1. Dashboard
  router.get('/dashboard', controllers.dashboardController.getDashboard);
  router.get('/dashboard/queue-stats', controllers.dashboardController.getQueueStats);

  // 2. Delivery Explorer
  router.get('/deliveries', controllers.deliveryExplorerController.listDeliveries);
  router.get('/deliveries/:id', controllers.deliveryExplorerController.getDelivery);

  // 3. Retry Manager
  router.post('/deliveries/:id/retry', controllers.retryManagerController.retryDelivery);
  router.post('/deliveries/retry-batch', controllers.retryManagerController.retryBatch);

  // 4. DLQ Manager
  router.get('/dlq', controllers.dlqManagerController.listDLQItems);
  router.post('/dlq/:id/recover', controllers.dlqManagerController.recoverDLQItem);
  router.get('/dlq/analysis', controllers.dlqManagerController.analyzeDLQ);

  // 5. Worker Manager
  router.get('/workers', controllers.workerManagerController.listWorkers);
  router.post('/workers/:workerId/pause', controllers.workerManagerController.pauseWorker);
  router.post('/workers/:workerId/resume', controllers.workerManagerController.resumeWorker);

  // 6. Daemon Manager
  router.get('/daemons', controllers.daemonManagerController.listDaemons);
  router.post('/daemons/:daemonId/trigger', controllers.daemonManagerController.triggerDaemon);

  // 7. Configuration Manager
  router.get('/config', controllers.configurationManagerController.getConfiguration);
  router.get('/feature-flags', controllers.configurationManagerController.getFeatureFlags);
  router.post('/feature-flags/toggle', controllers.configurationManagerController.toggleFeatureFlag);

  // 8. Audit Explorer
  router.get('/audit-logs', controllers.auditExplorerController.listAuditLogs);
  router.get('/audit-logs/compliance-report', controllers.auditExplorerController.generateComplianceReport);

  // 9. API Key Manager
  router.get('/api-keys', controllers.apiKeyManagerController.listApiKeys);
  router.post('/api-keys', controllers.apiKeyManagerController.createApiKey);
  router.delete('/api-keys/:keyId', controllers.apiKeyManagerController.revokeApiKey);

  // 10. Role Manager
  router.get('/roles', controllers.roleManagerController.listRoles);
  router.post('/roles', controllers.roleManagerController.createRole);
  router.get('/users', controllers.roleManagerController.listUsers);
  router.post('/users', controllers.roleManagerController.createUser);

  // 11. System Diagnostics
  router.get('/diagnostics/resources', controllers.systemDiagnosticsController.getResourceUsage);
  router.get('/diagnostics/performance', controllers.systemDiagnosticsController.getPerformanceMetrics);

  // 12. Analytics
  router.get('/analytics/overview', controllers.analyticsController.getOverview);

  // 13. Exports
  router.post('/exports/deliveries', controllers.exportsController.exportDeliveries);
  router.get('/exports/status/:exportId', controllers.exportsController.getExportStatus);

  return router;
}
