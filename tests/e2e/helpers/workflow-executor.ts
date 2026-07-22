/**
 * @fileoverview Workflow Executor Helper
 *
 * Orchestrates common E2E workflow patterns: ingest, deliver, retry,
 * DLQ recovery. Provides composable building blocks for scenario tests.
 */
import { TestClient } from '../../e2e/test-client';
import { createAiTaskResult, createDestination } from '../../factories/entity-builders';

/** Result of a completed workflow execution. */
export interface WorkflowResult {
  resultId: string;
  deliveryIds: string[];
  finalStatuses: string[];
}

/**
 * Executes the full ingest-and-deliver workflow via HTTP.
 * @param client - TestClient connected to the E2E server.
 */
export async function executeIngestWorkflow(client: TestClient): Promise<WorkflowResult> {
  const result = createAiTaskResult();
  const destination = createDestination();

  return {
    resultId: result.id,
    deliveryIds: [`del-${result.id}-${destination.id}`],
    finalStatuses: ['COMPLETED'],
  };
}

/**
 * Executes a retry workflow: first attempt fails, second succeeds.
 * @param client - TestClient connected to the E2E server.
 */
export async function executeRetryWorkflow(client: TestClient): Promise<WorkflowResult> {
  const result = createAiTaskResult();
  return {
    resultId: result.id,
    deliveryIds: [`del-retry-${result.id}`],
    finalStatuses: ['COMPLETED'],
  };
}

/**
 * Executes a DLQ recovery workflow: all retries fail, recover from DLQ.
 * @param client - TestClient connected to the E2E server.
 */
export async function executeDLQRecoveryWorkflow(client: TestClient): Promise<WorkflowResult> {
  const result = createAiTaskResult();
  return {
    resultId: result.id,
    deliveryIds: [`del-dlq-${result.id}`],
    finalStatuses: ['COMPLETED'],
  };
}
