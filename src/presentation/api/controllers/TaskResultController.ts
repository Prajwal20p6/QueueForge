import { Request, Response } from 'express';
import { ReceiveTaskResultUseCase } from '../../../application/use-cases/ReceiveTaskResultUseCase';
import { PrismaTaskResultRepository } from '../../../infrastructure/database/PrismaTaskResultRepository';
import { PrismaDestinationRepository } from '../../../infrastructure/database/PrismaDestinationRepository';
import { PrismaDeliveryLogRepository } from '../../../infrastructure/database/PrismaDeliveryLogRepository';
import { BullMQService } from '../../../infrastructure/queue/bullmq.service';
import { logger } from '../../../infrastructure/logging/logger';
import { metricsService } from '../../../infrastructure/monitoring/metrics.service';

export class TaskResultController {
  private readonly taskResultRepository = new PrismaTaskResultRepository();
  private readonly destinationRepository = new PrismaDestinationRepository();
  private readonly deliveryLogRepository = new PrismaDeliveryLogRepository();
  private queueService?: BullMQService;

  public setQueueService(queueService: BullMQService): void {
    this.queueService = queueService;
  }

  public ingest = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.queueService) {
        res.status(500).json({ error: 'Queue service is not initialized' });
        return;
      }

      const { taskId, payload, idempotencyKey } = req.body;

      if (!taskId || !payload) {
        res.status(400).json({ error: 'Missing required parameters: taskId, payload' });
        return;
      }

      const useCase = new ReceiveTaskResultUseCase(
        this.taskResultRepository,
        this.destinationRepository,
        this.queueService
      );

      const taskResult = await useCase.execute({
        taskId,
        payload,
        idempotencyKey,
      });

      metricsService.incomingResultsTotal.inc({ status: 'success' });
      logger.info(`Ingested task result for taskId ${taskId}. System ID: ${taskResult.id}`);

      // 202 Accepted is the correct response for asynchronous queue processing
      res.status(202).json({
        id: taskResult.id,
        taskId: taskResult.taskId,
        status: taskResult.status,
        idempotencyKey: taskResult.idempotencyKey,
        createdAt: taskResult.createdAt,
      });
    } catch (err: any) {
      metricsService.incomingResultsTotal.inc({ status: 'error' });
      logger.error('Ingestion failed: ', err);
      res.status(500).json({ error: err.message || 'Ingestion failed' });
    }
  };

  public getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.taskResultRepository.findById(id);

      if (!result) {
        res.status(404).json({ error: 'Task result not found' });
        return;
      }

      res.status(200).json(result);
    } catch (err: any) {
      logger.error(`Get status failed for ${req.params.id}: `, err);
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  };

  public getLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const logs = await this.deliveryLogRepository.findByTaskResultId(id);
      res.status(200).json(logs);
    } catch (err: any) {
      logger.error(`Get logs failed for ${req.params.id}: `, err);
      res.status(500).json({ error: 'Failed to fetch delivery logs' });
    }
  };
}
export const taskResultController = new TaskResultController();
