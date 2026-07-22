/**
 * Standard HTTP Methods enum
 */
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * Standard HTTP Status Codes enum
 */
export enum HTTPStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Standard HttpRequest interface
 */
export interface HttpRequest<TBody = any, TQuery = any, TParams = any> {
  readonly body: TBody;
  readonly query: TQuery;
  readonly params: TParams;
  readonly headers: Record<string, string | string[] | undefined>;
}

/**
 * Standard HttpResponse interface
 */
export interface HttpResponse<T = any> {
  readonly statusCode: number;
  readonly body?: T;
  readonly headers?: Record<string, string>;
}

/**
 * Standard pagination filter parameters
 */
export interface PaginationFilters {
  page: number;
  limit: number;
  offset: number;
}
