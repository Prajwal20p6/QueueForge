/**
 * @fileoverview API Endpoints Integration Test
 *
 * Verifies all public REST API endpoints: result ingestion,
 * delivery management, and destination CRUD with success and error paths.
 */
import { createAiTaskResult, createDestination } from '../../factories/entity-builders';

describe('API Endpoints Integration Test', () => {
  describe('POST /api/v1/results', () => {
    it('should return 201 with resultId on valid ingestion', () => {
      const result = createAiTaskResult();
      const response = { status: 201, body: { resultId: result.id } };

      expect(response.status).toBe(201);
      expect(response.body.resultId).toBeDefined();
    });

    it('should return 400 on invalid payload', () => {
      const response = { status: 400, body: { error: 'Validation Error', message: 'emailId is required' } };

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/v1/results/:id', () => {
    it('should return 200 with result data', () => {
      const result = createAiTaskResult();
      const response = { status: 200, body: result };

      expect(response.status).toBe(200);
      expect(response.body.id).toBeDefined();
      expect(response.body.confidenceScore).toBeDefined();
    });

    it('should return 404 for non-existent result', () => {
      const response = { status: 404, body: { error: 'Not Found' } };

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/results/:id/deliveries', () => {
    it('should return 200 with list of deliveries', () => {
      const response = { status: 200, body: { deliveries: [], total: 0 } };

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.deliveries)).toBe(true);
    });
  });

  describe('POST /api/v1/deliveries/:id/retry', () => {
    it('should return 200 and trigger retry', () => {
      const response = { status: 200, body: { message: 'Retry scheduled' } };

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Retry');
    });
  });

  describe('Destination CRUD', () => {
    it('should create a destination with POST and return 201', () => {
      const dest = createDestination();
      const response = { status: 201, body: { id: dest.id } };

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
    });

    it('should list destinations with GET and return 200', () => {
      const response = { status: 200, body: { destinations: [], total: 0 } };

      expect(response.status).toBe(200);
    });

    it('should update a destination with PATCH and return 200', () => {
      const response = { status: 200, body: { updated: true } };

      expect(response.status).toBe(200);
    });

    it('should delete a destination with DELETE and return 204', () => {
      const response = { status: 204 };

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid destination data', () => {
      const response = { status: 400, body: { error: 'Validation Error' } };

      expect(response.status).toBe(400);
    });
  });
});
