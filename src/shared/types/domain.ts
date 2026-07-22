/**
 * branded types for domain modeling
 */
export type EmailId = string;
export type AgentId = string;

/**
 * Valid delivery result statuses
 */
export type DeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

/**
 * Valid destination pipeline target channels
 */
export type DestinationType = 'WEBHOOK' | 'DATABASE' | 'QUEUE';

/**
 * AI Result content payload
 */
export interface ResultPayload {
  [key: string]: any;
}
