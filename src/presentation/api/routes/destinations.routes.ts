import { Router } from 'express';
import { destinationController } from '../controllers/DestinationController';
import { requireAuth } from '../../../infrastructure/security/auth.middleware';

const router = Router();

router.post('/', requireAuth, destinationController.register);
router.get('/', requireAuth, destinationController.list);
router.post('/:id/toggle', requireAuth, destinationController.toggle);

export default router;
