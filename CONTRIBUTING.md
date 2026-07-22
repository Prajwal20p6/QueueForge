# Contributing to QueueForge

Thank you for contributing to QueueForge! Please read this guide before submitting issues or pull requests.

## Development Setup

1.  **Node Version**: Ensure you are using Node.js `v20.x` (refer to `.nvmrc`).
2.  **Installation**: Run `npm ci` to install dependencies.
3.  **Local Stack**: Start the database and cache using `docker-compose up -d`.
4.  **Database Migrations**: Apply migrations using `npx prisma db push`.
5.  **Run Development Server**: Run `npm run dev`.

## Commit Message Guidelines

We use conventional commit formats:
*   `feat(scope): ...`
*   `fix(scope): ...`
*   `test(scope): ...`
*   `docs(scope): ...`

Refer to [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for more details.
