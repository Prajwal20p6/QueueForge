# Team Onboarding Guide

Prerequisites and steps to boot local environments.

---

## 🏗️ Requirements
*   **Node.js**: Node 20 LTS.
*   **Docker**: Docker Compose.

---

## 🚀 Running Commands
1.  **Clone Project & Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Initialize Database Schema**:
    ```bash
    npx prisma migrate dev
    ```
3.  **Boot Dev Stack**:
    ```bash
    npm run dev
    ```
