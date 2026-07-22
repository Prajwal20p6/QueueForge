import { Delivery } from '../../src/domain/entities/delivery.entity';
import { DeliveryStatus, isFailedDLQ } from '../../src/domain/value-objects/delivery-status';
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';

/**
 * Asserts that a Delivery entity is in the expected status state.
 * @param delivery - The Delivery domain entity.
 * @param expectedStatus - The expected DeliveryStatus discriminated union value.
 */
export function assertDeliveryStatus(
  delivery: Delivery,
  expectedStatus: DeliveryStatus
): void {
  const actual = delivery.getStatus();
  if (actual.type !== expectedStatus.type) {
    throw new Error(
      `[assertDeliveryStatus] Expected status "${expectedStatus.type}" but got "${actual.type}" ` +
        `for delivery "${delivery.getId()}".`
    );
  }
}

/**
 * Asserts that a Delivery entity has been moved to the Dead Letter Queue (FAILED_DLQ) state.
 * @param delivery - The Delivery domain entity.
 */
export function assertDeliveryInDLQ(delivery: Delivery): void {
  const status = delivery.getStatus();
  if (!isFailedDLQ(status)) {
    throw new Error(
      `[assertDeliveryInDLQ] Expected delivery "${delivery.getId()}" to be in FAILED_DLQ state, ` +
        `but got "${status.type}".`
    );
  }
}

/**
 * Asserts that the BullMQ queue has the expected number of waiting jobs.
 * @param queue - The BullMQ Queue instance.
 * @param expectedDepth - Expected number of waiting jobs.
 */
export async function assertQueueDepth(
  queue: Queue,
  expectedDepth: number
): Promise<void> {
  const counts = await queue.getJobCounts('waiting', 'active', 'delayed');
  const total = (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0);
  if (total !== expectedDepth) {
    throw new Error(
      `[assertQueueDepth] Expected queue depth ${expectedDepth} but got ${total} ` +
        `(waiting=${counts.waiting}, active=${counts.active}, delayed=${counts.delayed}).`
    );
  }
}

/**
 * Asserts that no records were lost between an initial and final count.
 * @param initialCount - Count before operation.
 * @param finalCount - Count after operation.
 */
export function assertNoDataLoss(initialCount: number, finalCount: number): void {
  if (finalCount < initialCount) {
    throw new Error(
      `[assertNoDataLoss] Data loss detected! Initial count: ${initialCount}, ` +
        `final count: ${finalCount}. Delta: ${initialCount - finalCount} records lost.`
    );
  }
}

/**
 * Asserts that the event type was emitted on the target EventEmitter.
 * Checks the mock call history on the event's 'emit' method.
 * @param emitter - Object with an 'emit' spy.
 * @param eventType - Name of the event that should have been emitted.
 */
export function assertEventEmitted(
  emitter: { emit: jest.Mock | ((...args: unknown[]) => boolean) },
  eventType: string
): void {
  if (!jest.isMockFunction(emitter.emit)) {
    throw new Error('[assertEventEmitted] emitter.emit must be a Jest mock function.');
  }
  const emitted = (emitter.emit as jest.Mock).mock.calls.some(
    (call: unknown[]) => call[0] === eventType
  );
  if (!emitted) {
    const actual = (emitter.emit as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    throw new Error(
      `[assertEventEmitted] Event "${eventType}" was never emitted. ` +
        `Emitted events: [${actual.join(', ')}].`
    );
  }
}

/**
 * Asserts that an audit log entry exists for the given event type and entity ID.
 * @param prisma - PrismaClient instance.
 * @param eventType - The audit log event type string.
 * @param entityId - The entity ID associated with the audit log entry.
 */
export async function assertAuditLogEntry(
  prisma: PrismaClient,
  eventType: string,
  entityId: string
): Promise<void> {
  const entry = await prisma.auditLog.findFirst({
    where: { eventType, entityId },
  });
  if (!entry) {
    throw new Error(
      `[assertAuditLogEntry] No audit log entry found for eventType="${eventType}" ` +
        `and entityId="${entityId}".`
    );
  }
}

/**
 * Asserts that a delivery record exists in the database for the given destination and result IDs.
 * @param prisma - PrismaClient instance.
 * @param destinationId - Destination entity ID.
 * @param resultId - AiTaskResult entity ID.
 */
export async function assertDeliveredToDestination(
  prisma: PrismaClient,
  destinationId: string,
  resultId: string
): Promise<void> {
  const delivery = await prisma.taskResultDelivery.findFirst({
    where: { destinationId, taskResultId: resultId },
  });
  if (!delivery) {
    throw new Error(
      `[assertDeliveredToDestination] No delivery record found for ` +
        `destinationId="${destinationId}" and resultId="${resultId}".`
    );
  }
}

/**
 * Asserts that the correct number of deliveries exist for a given result ID.
 * @param prisma - PrismaClient instance.
 * @param resultId - AiTaskResult entity ID.
 * @param expectedCount - Expected delivery count.
 */
export async function assertCorrectDeliveryCount(
  prisma: PrismaClient,
  resultId: string,
  expectedCount: number
): Promise<void> {
  const count = await prisma.taskResultDelivery.count({
    where: { taskResultId: resultId },
  });
  if (count !== expectedCount) {
    throw new Error(
      `[assertCorrectDeliveryCount] Expected ${expectedCount} deliveries for ` +
        `resultId="${resultId}" but found ${count}.`
    );
  }
}
