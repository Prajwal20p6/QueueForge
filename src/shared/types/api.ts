import { ErrorCode } from '../constants/error-codes';

/**
 * Standard structured API error response payload
 */
export interface APIErrorResponse {
  code: ErrorCode;
  message: string;
  context?: Record<string, any>;
}

/**
 * Unified API Response structure for all Controller responses
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIErrorResponse;
  timestamp: string;
}

/**
 * Generic API Request placeholder mirroring Express typing variables
 */
export interface APIRequest<TBody = any, TQuery = any, TParams = any> {
  body: TBody;
  query: TQuery;
  params: TParams;
}
