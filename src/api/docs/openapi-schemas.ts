/**
 * Complete OpenAPI 3.0.0 specification schema for QueueForge Event-Driven Pipeline API.
 */
export const openApiSchema = {
  openapi: '3.0.0',
  info: {
    title: 'QueueForge API',
    version: '1.0.0',
    description: 'Production-Grade Event-Driven AI Classification Pipeline API with Guaranteed Delivery.',
    contact: {
      name: 'QueueForge Engineering',
      email: 'support@queueforge.io',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Production API v1 Base Endpoint',
    },
  ],
  security: [
    { BearerAuth: [] },
    { ApiKeyAuth: [] },
  ],
  paths: {
    '/results': {
      post: {
        summary: 'Ingest AI Task Execution Result',
        operationId: 'ingestResult',
        tags: ['Results'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/IngestResultRequest' },
            },
          },
        },
        responses: {
          '202': {
            description: 'Result accepted for asynchronous processing and routing.',
            headers: {
              Location: { schema: { type: 'string' } },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AcceptedResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': { $ref: '#/components/responses/Conflict' },
          '422': { $ref: '#/components/responses/UnprocessableEntity' },
          '429': { $ref: '#/components/responses/TooManyRequests' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/results/{resultId}': {
      get: {
        summary: 'Get Result Record Details by Result ID',
        operationId: 'getResult',
        tags: ['Results'],
        parameters: [
          {
            name: 'resultId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Result record found.' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/deliveries': {
      get: {
        summary: 'List Destination Delivery Logs',
        operationId: 'listDeliveries',
        tags: ['Deliveries'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Paginated delivery logs list.' },
        },
      },
    },
    '/deliveries/{deliveryId}': {
      get: {
        summary: 'Get Delivery Record Details',
        operationId: 'getDelivery',
        tags: ['Deliveries'],
        parameters: [
          { name: 'deliveryId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Delivery details.' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/deliveries/{deliveryId}/retry': {
      post: {
        summary: 'Trigger Manual Retry for Failed Delivery',
        operationId: 'retryDelivery',
        tags: ['Deliveries'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'deliveryId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '202': { description: 'Retry scheduled.' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/destinations': {
      get: {
        summary: 'List Target Egress Destinations',
        operationId: 'listDestinations',
        tags: ['Destinations'],
        responses: {
          '200': { description: 'Destinations list.' },
        },
      },
      post: {
        summary: 'Register Target Egress Destination Profile',
        operationId: 'createDestination',
        tags: ['Destinations'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDestinationRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Destination created.' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/destinations/{destinationId}': {
      get: {
        summary: 'Get Destination Profile Details',
        tags: ['Destinations'],
        parameters: [{ name: 'destinationId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Destination details.' } },
      },
      patch: {
        summary: 'Update Destination Profile Settings',
        tags: ['Destinations'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'destinationId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Destination updated.' } },
      },
      delete: {
        summary: 'Delete Destination Target Profile',
        tags: ['Destinations'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'destinationId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'Destination deleted.' } },
      },
    },
    '/lineage/{emailId}': {
      get: {
        summary: 'Get Classification Event Lineage History',
        tags: ['Lineage'],
        parameters: [{ name: 'emailId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Lineage trace record.' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/health': {
      get: {
        summary: 'Liveness and Readiness Probe',
        tags: ['System'],
        security: [],
        responses: { '200': { description: 'Healthy' }, '503': { description: 'Unhealthy' } },
      },
    },
    '/metrics': {
      get: {
        summary: 'Prometheus Exposition Metrics Endpoint',
        tags: ['System'],
        security: [],
        responses: { '200': { description: 'Metrics text format' } },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      IngestResultRequest: {
        type: 'object',
        required: ['emailId', 'agentId', 'confidenceScore', 'resultPayload'],
        properties: {
          emailId: { type: 'string', format: 'email', example: 'user@example.com' },
          agentId: { type: 'string', example: 'sentiment-classifier-agent' },
          agentVersion: { type: 'string', example: '1.2.0' },
          confidenceScore: { type: 'number', minimum: 0.0, maximum: 1.0, example: 0.98 },
          resultPayload: { type: 'object', example: { classification: 'URGENT', category: 'BILLING' } },
        },
      },
      CreateDestinationRequest: {
        type: 'object',
        required: ['type', 'endpoint'],
        properties: {
          name: { type: 'string', example: 'Billing Webhook Endpoint' },
          type: { type: 'string', enum: ['WEBHOOK', 'DATABASE', 'QUEUE', 'AUDIT'] },
          endpoint: { type: 'string', example: 'https://api.billing.internal/webhooks' },
        },
      },
      AcceptedResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          status: { type: 'string', example: 'ACCEPTED' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          message: { type: 'string' },
          statusCode: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      BadRequest: { description: 'Bad Request' },
      Unauthorized: { description: 'Unauthorized' },
      Forbidden: { description: 'Forbidden' },
      NotFound: { description: 'Not Found' },
      Conflict: { description: 'Conflict' },
      UnprocessableEntity: { description: 'Validation Error' },
      TooManyRequests: { description: 'Rate Limit Exceeded' },
      InternalError: { description: 'Internal Server Error' },
    },
  },
};
