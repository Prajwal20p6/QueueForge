import { Router, Request, Response } from 'express';
import { metricsService } from '../../../infrastructure/monitoring/metrics.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsService.registry.contentType);
    res.status(200).send(await metricsService.registry.metrics());
  } catch (err: any) {
    res.status(500).send(err.message || err);
  }
});

export default router;
