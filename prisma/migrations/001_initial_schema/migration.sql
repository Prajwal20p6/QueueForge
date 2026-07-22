-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('WEBHOOK', 'DATABASE', 'QUEUE', 'AUDIT');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'SCHEDULED_RETRY', 'FAILED_DLQ');

-- CreateTable: ai_task_results
CREATE TABLE "ai_task_results" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentVersion" TEXT NOT NULL,
    "resultPayload" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "llmMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ai_task_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable: destinations
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "type" "DestinationType" NOT NULL,
    "endpoint" TEXT NOT NULL,
    "eventFilters" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "retryStrategy" TEXT NOT NULL DEFAULT 'exponential',
    "circuitBreakerThreshold" INTEGER NOT NULL DEFAULT 5,
    "timeout" INTEGER NOT NULL DEFAULT 5000,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_result_deliveries
CREATE TABLE "task_result_deliveries" (
    "id" TEXT NOT NULL,
    "taskResultId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "errorCategory" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "task_result_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_result_delivery_attempts
CREATE TABLE "task_result_delivery_attempts" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "statusCode" INTEGER,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "requestHeaders" JSONB NOT NULL DEFAULT '{}',
    "responseHeaders" JSONB NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_result_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: idempotency_cache
CREATE TABLE "idempotency_cache" (
    "compositeKey" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_cache_pkey" PRIMARY KEY ("compositeKey")
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ai_task_results indices
CREATE INDEX "ai_task_results_emailId_createdAt_idx" ON "ai_task_results"("emailId", "createdAt");
CREATE INDEX "ai_task_results_agentId_idx" ON "ai_task_results"("agentId");
CREATE INDEX "ai_task_results_createdAt_idx" ON "ai_task_results"("createdAt");

-- CreateIndex: destinations indices
CREATE INDEX "destinations_type_idx" ON "destinations"("type");
CREATE INDEX "destinations_enabled_idx" ON "destinations"("enabled");
CREATE INDEX "destinations_createdAt_idx" ON "destinations"("createdAt");

-- CreateIndex: task_result_deliveries indices & unique constraints
CREATE UNIQUE INDEX "task_result_deliveries_taskResultId_destinationId_key" ON "task_result_deliveries"("taskResultId", "destinationId");
CREATE INDEX "task_result_deliveries_status_idx" ON "task_result_deliveries"("status");
CREATE INDEX "task_result_deliveries_nextRetryAt_idx" ON "task_result_deliveries"("nextRetryAt");
CREATE INDEX "task_result_deliveries_status_createdAt_idx" ON "task_result_deliveries"("status", "createdAt");

-- CreateIndex: task_result_delivery_attempts indices
CREATE INDEX "task_result_delivery_attempts_deliveryId_attemptNumber_idx" ON "task_result_delivery_attempts"("deliveryId", "attemptNumber");
CREATE INDEX "task_result_delivery_attempts_createdAt_idx" ON "task_result_delivery_attempts"("createdAt");
CREATE INDEX "task_result_delivery_attempts_statusCode_idx" ON "task_result_delivery_attempts"("statusCode");

-- CreateIndex: idempotency_cache indices
CREATE INDEX "idempotency_cache_expiresAt_idx" ON "idempotency_cache"("expiresAt");

-- CreateIndex: audit_logs indices
CREATE INDEX "audit_logs_entityId_createdAt_idx" ON "audit_logs"("entityId", "createdAt");
CREATE INDEX "audit_logs_eventType_createdAt_idx" ON "audit_logs"("eventType", "createdAt");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey constraints with CASCADE deletes
ALTER TABLE "task_result_deliveries" ADD CONSTRAINT "task_result_deliveries_taskResultId_fkey" FOREIGN KEY ("taskResultId") REFERENCES "ai_task_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_result_deliveries" ADD CONSTRAINT "task_result_deliveries_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_result_delivery_attempts" ADD CONSTRAINT "task_result_delivery_attempts_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "task_result_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
-- ROLLBACK CAPABILITY (Commented for safety)
-- Add foreign keys drop
ALTER TABLE "task_result_delivery_attempts" DROP CONSTRAINT "task_result_delivery_attempts_deliveryId_fkey";
ALTER TABLE "task_result_deliveries" DROP CONSTRAINT "task_result_deliveries_destinationId_fkey";
ALTER TABLE "task_result_deliveries" DROP CONSTRAINT "task_result_deliveries_taskResultId_fkey";

-- Drop tables
DROP TABLE "audit_logs";
DROP TABLE "idempotency_cache";
DROP TABLE "task_result_delivery_attempts";
DROP TABLE "task_result_deliveries";
DROP TABLE "destinations";
DROP TABLE "ai_task_results";

-- Drop enums
DROP TYPE "DeliveryStatus";
DROP TYPE "DestinationType";
*/
