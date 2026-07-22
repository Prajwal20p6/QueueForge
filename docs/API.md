# REST API Documentation

This document describes all API endpoints, authentication flows, error structures, rate limits, and webhook verification routines of QueueForge.

## 🌐 API Details
*   **Base URL**: `http://localhost:3000/v1`
*   **Global Headers**:
    *   `Content-Type: application/json`

---

## 🔑 Authentication Mechanisms

Endpoints require one of the following authentication headers:

### 1. API Key Authentication
For server-to-server ingest pipelines:
*   Header: `X-API-Key: <your-api-key>`

### 2. Bearer JWT Authentication
For dashboard users and client requests:
*   Header: `Authorization: Bearer <jwt-token>`

---

## 🚦 Rate Limiting
API requests are throttled at the ingress middleware.
*   **Limits**: 1000 requests per minute per IP or authenticated token/Key.
*   **Exceeded Response**: HTTP `429 Too Many Requests`.

---

## ❌ Error Catalog
QueueForge returns error bodies in standard JSON format:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Confidence score must be between 0.0 and 1.0",
  "details": {
    "confidenceScore": "Out of bounds [0.0, 1.0]"
  }
}
```

### Common Error Codes
*   `AUTHENTICATION_ERROR` (401): Missing or invalid credentials.
*   `AUTHORIZATION_ERROR` (403): Scopes validation failed.
*   `VALIDATION_ERROR` (422): Input parameters do not conform to schema constraints.
*   `NOT_FOUND` (404): Requested entity does not exist.
*   `RATE_LIMIT_EXCEEDED` (429): Ingress volume limit reached.
*   `INTERNAL_SERVER_ERROR` (500): Unexpected system exceptions.

---

## 📡 Endpoint Specifications

### 1. POST `/results`
Ingest a new AI model task result for routing.
*   **Auth Required**: JWT or API Key
*   **Request Body**:
    ```json
    {
      "emailId": "user@test.com",
      "agentId": "classifier-agent",
      "agentVersion": "v1.0.0",
      "resultPayload": { "category": "billing", "urgency": "high" },
      "confidenceScore": 0.95
    }
    ```
*   **Response (202 Accepted)**:
    ```json
    {
      "id": "result-uuid-12345",
      "status": "ACCEPTED",
      "createdAt": "2024-07-18T10:15:30.000Z"
    }
    ```

### 2. GET `/lineage/{emailId}`
Query all task results and dispatches associated with an email identifier.
*   **Auth Required**: JWT
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "result-uuid-12345",
        "agentId": "classifier-agent",
        "createdAt": "2024-07-18T10:15:30.000Z",
        "deliveries": [
          {
            "id": "delivery-uuid-987",
            "destinationId": "dest-uuid-555",
            "status": "COMPLETED"
          }
        ]
      }
    ]
    ```

### 3. POST `/destinations`
Register a new routing endpoint.
*   **Auth Required**: JWT (requires write scope)
*   **Request Body**:
    ```json
    {
      "endpointUrl": "https://api.oneinbox.ai/webhook",
      "destinationType": { "kind": "webhook" },
      "eventFilters": { "agentId": "classifier-agent" }
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": "dest-uuid-555",
      "endpointUrl": "https://api.oneinbox.ai/webhook",
      "enabled": true
    }
    ```

### 4. GET `/destinations`
List all registered destinations with pagination details.
*   **Auth Required**: JWT
*   **Parameters**: `page` (default 1), `limit` (default 10)
*   **Response (200 OK)**:
    ```json
    {
      "data": [...],
      "total": 12,
      "page": 1,
      "limit": 10
    }
    ```

### 5. GET `/health`
Check application service health status.
*   **Response (200 OK)**:
    ```json
    {
      "status": "healthy",
      "timestamp": "2024-07-18T10:20:00.000Z",
      "services": {
        "database": "UP",
        "redis": "UP"
      }
    }
    ```

---

## 🪝 Webhook Contract & Signature Verification

QueueForge signs outgoing HTTP payloads using HMAC-SHA256. Secure downstream webhook systems must compute the signature of the incoming request body using their shared `HMAC_SECRET` and verify it matches the header.

### Signature Headers
*   `X-QueueForge-Signature`: Hex-encoded HMAC-SHA256 signature.
*   `X-QueueForge-Timestamp`: Unix timestamp of dispatch.

### Node.js Verification Example
```javascript
const crypto = require('crypto');

function verifyWebhook(secret, payload, signatureHeader, timestampHeader) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestampHeader}.${payload}`);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
}
```

---

## 💻 Common Operation cURL Examples

### Ingest Task Result
```bash
curl -X POST http://localhost:3000/v1/results \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-secret-min-32-characters-long" \
  -d '{
    "emailId": "support@customer.com",
    "agentId": "billing-extractor",
    "agentVersion": "v1.2.0",
    "resultPayload": { "invoice": "INV-102", "amount": 250.00 },
    "confidenceScore": 0.99
  }'
```

### Retrieve Ingestion Lineage
```bash
curl -H "Authorization: Bearer <jwt-token>" \
  http://localhost:3000/v1/lineage/support@customer.com
```
