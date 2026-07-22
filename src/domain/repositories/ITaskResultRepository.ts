import { AiTaskResult } from '../entities/ai-task-result.entity';

export interface ITaskResultRepository {
  save(taskResult: AiTaskResult): Promise<AiTaskResult>;
  findById(id: string): Promise<AiTaskResult | null>;
  findByTaskId(taskId: string): Promise<AiTaskResult | null>;
  findByIdempotencyKey(key: string): Promise<AiTaskResult | null>;
  update(taskResult: AiTaskResult): Promise<AiTaskResult>;
}
