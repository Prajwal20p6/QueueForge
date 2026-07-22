# Developer Guide

This document helps developers navigate the QueueForge codebase, run tests, and use debugging profiles.

---

## 💻 Recommended Editor Configurations

We recommend using **VS Code** with the following workspace extensions:
*   `dbaeumer.vscode-eslint` (ESLint code linting)
*   `esbenp.prettier-vscode` (Prettier code formatter)
*   `prisma.prisma` (Prisma schema helper)

Add these settings to `.vscode/settings.json` to enable format-on-save:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## 🔍 Debugging Configurations

To debug the API server locally, add this configuration to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug QueueForge API",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["src/main.ts"],
      "env": {
        "NODE_ENV": "development",
        "PORT": "3000"
      },
      "sourceMaps": true,
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 🛠️ Common CLI Shortcuts

*   **Run Development Watcher**: `npm run dev`
*   **Compile Code**: `npm run build`
*   **Run Linters**: `npm run lint`
*   **Format Files**: `npm run format`
*   **Generate Prisma Client**: `npx prisma generate`
*   **Sync Database Schema**: `npx prisma db push`
