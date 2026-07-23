# Security Architecture & Threat Model

This document outlines the security controls, authentication mechanisms, encryption protocols, and compliance safeguards implemented in QueueForge.

---

## 🔒 Authentication & Access Control

- **JWT Tokens**: Signed using HMAC-SHA256 with 24-hour expiration (`JWT_SECRET`).
- **Master API Keys**: SHA-256 hashed API keys (`X-API-Key`) validated against configuration credentials.
- **HMAC Webhook Payload Signing**: Outgoing webhook payloads carry an `X-QueueForge-Signature` header generated via SHA-256 HMAC over the payload timestamp and JSON data.

```
Signature = HMAC-SHA256(HMAC_SECRET, Timestamp + '.' + JSONPayload)
```

---

## 🛡️ Data Protection & Privacy

- **PostgreSQL Encryption**: Require TLS 1.3 encrypted SSL connections in production.
- **Redis Security**: Authenticated access via password/URL, encrypted at rest.
- **Secrets Management**: Loaded dynamically from environment variables or cloud secrets managers (AWS Secrets Manager, HashiCorp Vault). Never committed to version control.
- **Audit Logging**: Sensitive tokens and credentials filtered from Winston logger outputs.

---

## ⚡ Rate Limiting & Distributed Protection

- **API Rate Limiting**: Enforced via sliding-window counters in Redis (default 1,000 req/min per API key).
- **Helmet HTTP Headers**: Enforces strict `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security`.
- **CORS Policies**: Strict origin whitelist matching production domains.

---

## 📋 Audit, GDPR & HIPAA Compliance

- **Immutable Audit Log**: Append-only PostgreSQL table tracking all system configuration and user actions.
- **Data Retention & Purging**: Soft-deletion of user task result payloads with optional 7-day auto-purge daemon.
- **GDPR Compliance**: Support for user data deletion requests.

---

## 🚀 Recommended Production Hardening Checklist

1. Enable **TLS 1.3** for all ingress and database network links.
2. Store secrets in **AWS Secrets Manager** or **HashiCorp Vault**.
3. Restrict PostgreSQL and Redis access using **VPC Private Subnets** and Kubernetes NetworkPolicies.
4. Deploy an Application Firewall (WAF) in front of Express API instances.
