# Step-by-Step Contribution Guide

Follow these steps to submit a contribution to QueueForge:

## Step 1: Fork and Clone
Fork the repository on GitHub, then clone your fork locally:
```bash
git clone https://github.com/your-username/queueforge.git
cd queueforge
```

## Step 2: Create a Feature Branch
Create a branch named after the ticket or feature:
```bash
git checkout -b feat/add-rate-limiting-overrides
```

## Step 3: Implement and Format
Implement your changes following the style guidelines. Run ESLint and Prettier before committing:
```bash
npm run lint -- --fix
npm run format
```

## Step 4: Verify with Tests
Ensure the entire test suite passes:
```bash
npm test
```

## Step 5: Commit and Push
Commit using conventional format and push to your fork:
```bash
git commit -m "feat(security): add override options to rate limiter"
git push origin feat/add-rate-limiting-overrides
```

## Step 6: Open a Pull Request
Open a pull request on GitHub against the `main` branch.
