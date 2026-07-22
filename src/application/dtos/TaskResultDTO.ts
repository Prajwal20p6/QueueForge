export interface ReceiveTaskResultDTO {
  taskId: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
}

export interface RegisterDestinationDTO {
  name: string;
  type: string; // "WEBHOOK", "DATABASE", "QUEUE"
  config: Record<string, any>;
  isActive?: boolean;
}
