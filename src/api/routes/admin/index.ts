import { Router } from 'express';
import { adminAuthMiddleware } from '../../middleware/admin-auth.middleware';
import { adminAuditMiddleware } from '../../middleware/admin-audit.middleware';
import { AdminDashboardController } from '../../controllers/admin/dashboard.controller';
import { AdminQueueController } from '../../controllers/admin/queue.controller';
import { AdminDeliveryController } from '../../controllers/admin/delivery.controller';
import { AdminDestinationController } from '../../controllers/admin/destination.controller';
import { AdminConfigurationController } from '../../controllers/admin/configuration.controller';
import { AdminUsersController } from '../../controllers/admin/users.controller';
import { AdminRolesController } from '../../controllers/admin/roles.controller';
import { AdminAuditController } from '../../controllers/admin/audit.controller';
import { AdminIncidentController } from '../../controllers/admin/incident.controller';
import { AdminAlertController } from '../../controllers/admin/alert.controller';
import { AdminBackupController } from '../../controllers/admin/backup.controller';
import { AdminMetricsController } from '../../controllers/admin/metrics.controller';
import { Logger } from '../../../observability/logging/logger';
import { getConfig } from '../../../config';
import { DashboardBuilder } from '../../../admin/services/dashboard-builder';

export function createAdminRouter(): Router {
  const router = Router();
  const logger = new Logger(getConfig().observability, 'AdminRoutes');

  const dashboardController = new AdminDashboardController(new DashboardBuilder(), logger);
  const queueController = new AdminQueueController(logger);
  const deliveryController = new AdminDeliveryController(logger);
  const destinationController = new AdminDestinationController(logger);
  const configController = new AdminConfigurationController(logger);
  const usersController = new AdminUsersController(logger);
  const rolesController = new AdminRolesController(logger);
  const auditController = new AdminAuditController(logger);
  const incidentController = new AdminIncidentController(logger);
  const alertController = new AdminAlertController(logger);
  const backupController = new AdminBackupController(logger);
  const metricsController = new AdminMetricsController(logger);

  const auth = adminAuthMiddleware();
  const audit = adminAuditMiddleware(logger);

  router.use(auth);
  router.use(audit);

  router.get('/dashboard', dashboardController.getOverview.bind(dashboardController));
  router.post('/queue/pause', queueController.pauseQueue.bind(queueController));
  router.post('/queue/resume', queueController.resumeQueue.bind(queueController));
  router.post('/queue/clear', queueController.clearQueue.bind(queueController));
  router.get('/deliveries/dlq', deliveryController.getDLQDeliveries.bind(deliveryController));
  router.post('/deliveries/retry', deliveryController.retryDLQDelivery.bind(deliveryController));
  router.get('/destinations/:id/stats', destinationController.getDestinationStats.bind(destinationController));
  router.post('/destinations/:id/test', destinationController.testDestination.bind(destinationController));
  router.get('/configuration', configController.getConfiguration.bind(configController));
  router.patch('/configuration', configController.updateConfiguration.bind(configController));
  router.get('/users', usersController.listUsers.bind(usersController));
  router.post('/users', usersController.createUser.bind(usersController));
  router.get('/roles', rolesController.listRoles.bind(rolesController));
  router.post('/roles', rolesController.createRole.bind(rolesController));
  router.get('/audit-logs', auditController.getAuditLogs.bind(auditController));
  router.get('/incidents', incidentController.listIncidents.bind(incidentController));
  router.patch('/incidents/:id/acknowledge', incidentController.acknowledgeIncident.bind(incidentController));
  router.get('/alerts', alertController.listAlerts.bind(alertController));
  router.patch('/alerts/:id/acknowledge', alertController.acknowledgeAlert.bind(alertController));
  router.get('/backups', backupController.listBackups.bind(backupController));
  router.post('/backups', backupController.createBackup.bind(backupController));
  router.get('/metrics', metricsController.getMetricsSnapshot.bind(metricsController));

  return router;
}
