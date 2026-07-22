import { Request, Response } from 'express';
import { AuthContext } from '../security/context/auth-context';

/**
 * Extended Express request interface carrying request correlation IDs and auth credentials.
 */
export interface ApiRequest extends Request {
  auth?: AuthContext;
  correlationId?: string;
  requestId?: string;
}

/**
 * Standard Express response structure.
 */
export interface ApiResponse extends Response {}

/**
 * Standard schema for API error responses.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  traceId?: string;
}

/**
 * API contexts housing all middleware context options.
 */
export interface ApiContext {
  auth: AuthContext | null;
  correlationId: string;
  requestId: string;
}
