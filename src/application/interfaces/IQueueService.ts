export interface IQueueService {
  enqueueDelivery(
    taskResultId: string,
    destinationId: string,
    attempt?: number,
    delayMs?: number
  ): Promise<void>;
}
