# Contributing Guidelines

We welcome contributions to QueueForge! Please follow this guide when developing features, fixing issues, or writing documentation.

---

## 🛠️ Git Development Workflow

1.  **Branch Naming**: Match the target ticket or action:
    *   `feat/feature-name`
    *   `fix/bug-description`
    *   `chore/update-dependencies`
2.  **Conventional Commits**: Commit messages must follow the standard syntax:
    *   `feat(api): add pagination options to destinations`
    *   `fix(worker): prevent heartbeat collision in Redis`
    *   `test(resilience): add chaos scenario tests for circuit breakers`
3.  **Pull Request Submission**:
    *   Target the `main` branch.
    *   Fill out the Pull Request template completely.
    *   Ensure the CI/CD pipeline runs and passes successfully.

---

## 📐 Coding Styles & Formatting

*   **Linting**: Run ESLint before committing changes:
    *   `npm run lint`
*   **Formatting**: Format your code with Prettier:
    *   `npm run format`
*   **Strict Types**: Avoid using type overrides like `any` unless absolutely necessary (e.g. for mock contexts).

---

## 🧪 Testing Requirements

*   **Coverage**: New features must include unit tests. The PR build will fail if overall coverage drops below **80%**.
*   **Integration Checks**: If your change modifies database schemas, write matching integration test cases under `tests/integration/`.
