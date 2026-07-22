# API Usage Examples

This guide provides code snippets in cURL, JavaScript, and Python to help you integrate with the QueueForge API.

---

## 📡 1. Ingesting an AI Task Result

### cURL
```bash
curl -X POST http://localhost:3000/v1/results \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-secret-here" \
  -d '{
    "emailId": "support@customer.com",
    "agentId": "billing-extractor",
    "agentVersion": "v1.2.0",
    "resultPayload": { "invoice": "INV-102", "amount": 250.00 },
    "confidenceScore": 0.99
  }'
```

### JavaScript (Axios)
```javascript
const axios = require('axios');

async function ingestResult() {
  try {
    const res = await axios.post('http://localhost:3000/v1/results', {
      emailId: 'support@customer.com',
      agentId: 'billing-extractor',
      agentVersion: 'v1.2.0',
      resultPayload: { invoice: 'INV-102', amount: 250.00 },
      confidenceScore: 0.99
    }, {
      headers: { 'X-API-Key': 'your-api-key-secret-here' }
    });
    console.log('Ingestion success:', res.data);
  } catch (err) {
    console.error('Ingestion failed:', err.response ? err.response.data : err.message);
  }
}
```

### Python (Requests)
```python
import requests

def ingest_result():
    url = "http://localhost:3000/v1/results"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "your-api-key-secret-here"
    }
    payload = {
        "emailId": "support@customer.com",
        "agentId": "billing-extractor",
        "agentVersion": "v1.2.0",
        "resultPayload": { "invoice": "INV-102", "amount": 250.00 },
        "confidenceScore": 0.99
    }
    try:
        res = requests.post(url, json=payload, headers=headers)
        res.raise_for_status()
        print("Ingestion success:", res.json())
    except requests.exceptions.HTTPError as err:
        print("Ingestion failed:", err.response.json())
```

---

## 🛡️ 2. Webhook Signature Verification

### JavaScript
```javascript
const crypto = require('crypto');

function verifySignature(payload, signatureHeader, timestampHeader, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestampHeader}.${payload}`);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
}
```

### Python
```python
import hmac
import hashlib

def verify_signature(payload: str, signature_header: str, timestamp_header: str, secret: str) -> bool:
    message = f"{timestamp_header}.{payload}".encode('utf-8')
    computed = hmac.new(secret.encode('utf-8'), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature_header, computed)
```
