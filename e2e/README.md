# E2E Tests Directory

This directory contains end-to-end tests using Playwright.

## Structure

```
e2e/
├── pages/              # Page Object Models
│   └── login.page.ts   # Example: Login page POM
├── *.spec.ts           # Test files
└── README.md           # This file
```

## Page Object Models (POM)

The `pages/` directory contains Page Object Models that encapsulate page-specific logic and selectors. This pattern:
- Improves test maintainability
- Reduces code duplication
- Makes tests more readable
- Isolates page-specific changes

## Naming Conventions

- Test files: `*.spec.ts`
- Page Object Models: `*.page.ts`
- Use descriptive names that reflect the feature being tested

## Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

## Running Tests

See [TESTING.md](../TESTING.md) for detailed instructions on running E2E tests.
