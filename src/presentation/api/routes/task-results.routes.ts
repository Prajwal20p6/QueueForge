import { Router } from 'express';
import { taskResultController } from '../controllers/TaskResultController';
import { requireAuth } from '../../../infrastructure/security/auth.middleware';

const router = Router();

router.post('/', requireAuth, taskResultController.ingest);
router.get('/:id', requireAuth, taskResultController.getStatus);
router.get('/:id/logs', requireAuth, taskResultController.getLogs);

export default router;
