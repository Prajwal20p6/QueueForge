# Security Policy and Compliance

This document describes the security protocols, encryption parameters, authorization boundaries, and GDPR compliance policies implemented in QueueForge.

---

## 🔒 Authentication & Key Management

### 1. API Keys
*   Used for machine-to-machine integration.
*   Stored securely in configuration environment keys. Keys must be rotated every 90 days.

### 2. JWT Strategy
*   Used for client dashboard interactions.
*   Signed using HMAC-SHA256 with the `JWT_SECRET`. Tokens expire after 3600 seconds.

---

## 🛡️ Webhook Integrity (HMAC signatures)

Outgoing webhook dispatches carry HMAC-SHA256 signatures to prevent tampering or replay attacks. The header `X-QueueForge-Signature` contains a hex-encoded hash computed over the request payload prefixed by the dispatch timestamp:

```
Signature = HMAC-SHA256(HMAC_SECRET, Timestamp + '.' + Payload)
```

Downstream receivers must compute this signature and compare it securely using time-constant comparison functions.

---

## 📁 GDPR Data Retention & Privacy

To comply with privacy laws, personal identifiers (like email addresses) are handled strictly:

*   **Retention Policies**: Logs, audit trails, and delivery attempts are retained for a maximum of 7 days before being automatically purged via the database maintenance daemon.
*   **PII Purging**: When a user invokes the deletion API, their corresponding `AiTaskResult` records are soft-deleted immediately and hard-deleted from all tables within 24 hours.
*   **Encrypted Storage**: Connection strings, passwords, and API keys are stored in encrypted environment parameter stores (such as AWS Systems Manager Parameter Store or HashiCorp Vault) and are never committed to version control.
