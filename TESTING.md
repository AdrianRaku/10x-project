# Testing Guide - MyFilms Project

## Overview

Ten projekt wykorzystuje dwa frameworki testowe:

- **Vitest** - dla testów jednostkowych i integracyjnych
- **Playwright** - dla testów E2E (end-to-end)

## Struktura Katalogów

```
project/
├── e2e/                          # Testy E2E (Playwright)
│   ├── pages/                    # Page Object Models
│   │   └── login.page.ts
│   ├── login.spec.ts
│   └── login-pom.spec.ts
├── src/
│   └── test/
│       ├── setup.ts              # Konfiguracja testów Vitest
│       ├── unit/                 # Testy jednostkowe
│       └── integration/          # Testy integracyjne
├── vitest.config.ts              # Konfiguracja Vitest
└── playwright.config.ts          # Konfiguracja Playwright
```

## Testy Jednostkowe i Integracyjne (Vitest)

### Uruchamianie testów

```bash
# Uruchom wszystkie testy jednostkowe
npm run test

# Tryb watch - automatyczne uruchamianie po zmianie plików
npm run test:watch

# UI mode - interaktywny interfejs testów
npm run test:ui

# Generowanie raportów coverage
npm run test:coverage
```

### Konfiguracja

Vitest jest skonfigurowany do:

- Używania środowiska **happy-dom** dla testów komponentów React (lżejsza i szybsza alternatywa dla jsdom)
- Automatycznego ładowania pliku setup z globalnymi konfiguracjami
- Wykluczania node_modules, dist i testów E2E
- Generowania raportów coverage (text, json, html)

### Przykłady testów

#### Test funkcji utility (utils.test.ts)

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });
});
```

#### Test komponentu React (button.test.tsx)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button Component', () => {
  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Best Practices (Vitest)

1. **Mockowanie** - Używaj `vi.fn()`, `vi.spyOn()`, `vi.mock()` do mockowania funkcji i modułów
2. **Setup files** - Globalne konfiguracje umieszczaj w `src/test/setup.ts`
3. **Test doubles** - Preferuj spies nad mocks gdy potrzebujesz tylko weryfikacji wywołań
4. **TypeScript** - Zachowuj strict typing w testach
5. **Arrange-Act-Assert** - Strukturyzuj testy według tego wzorca

## Testy E2E (Playwright)

### Uruchamianie testów

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# UI mode - interaktywny tryb z wizualizacją testów
npm run test:e2e:ui

# Debug mode - krok po kroku z inspektorem
npm run test:e2e:debug
```

### Konfiguracja

Playwright jest skonfigurowany do:

- Testowania tylko na **Chromium** (Desktop Chrome)
- Automatycznego uruchamiania serwera deweloperskiego
- Generowania trace dla nieudanych testów
- Robienia screenshotów przy błędach
- Parallel execution dla szybszych testów

### Przykłady testów

#### Podstawowy test E2E (login.spec.ts)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays login form elements", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /witaj ponownie/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
```

#### Test z Page Object Model (login-pom.spec.ts)

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";

test.describe("Login Page - Using Page Object Model", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("can fill login form", async () => {
    await loginPage.emailInput.fill("test@example.com");
    await expect(loginPage.emailInput).toHaveValue("test@example.com");
  });
});
```

### Best Practices (Playwright)

1. **Page Object Model** - Twórz klasy reprezentujące strony dla lepszej maintainability
2. **Locators** - Używaj resilient locators (role, label) zamiast CSS selectors
3. **Browser contexts** - Izoluj testy używając browser contexts
4. **Assertions** - Używaj specific matchers jak `toBeVisible()`, `toHaveText()`
5. **Test hooks** - Wykorzystuj `beforeEach`, `afterEach` dla setup i cleanup
6. **Trace viewer** - Używaj trace dla debugowania nieudanych testów

## Setup files

### src/test/setup.ts

Ten plik zawiera globalną konfigurację dla testów Vitest:

- Rozszerzenie expect o matchers z `@testing-library/jest-dom`
- Automatyczne cleanup po każdym teście
- Mock dla `window.matchMedia`
- Mock dla `IntersectionObserver`

## Wyniki Testów

Po poprawnej konfiguracji, wszystkie testy powinny przejść pomyślnie:

```
✓ src/lib/utils.test.ts (5 tests)
✓ src/components/ui/button.test.tsx (7 tests)

Test Files  2 passed (2)
     Tests  12 passed (12)
```

## Kompatybilność

### Node.js Version

Projekt wykorzystuje Node.js 18.19.1. Niektóre zależności testowe wymagają Node 20+, ale zostały skonfigurowane do działania z obecną wersją:

- **happy-dom** jest używany zamiast jsdom dla lepszej kompatybilności
- Playwright i Vitest działają poprawnie mimo ostrzeżeń o wersji engine

Jeśli napotkasz problemy, rozważ aktualizację do Node 20+.

## CI/CD Integration

Testy można łatwo zintegrować z GitHub Actions lub innym CI/CD:

```yaml
- name: Run Unit Tests
  run: npm run test

- name: Run E2E Tests
  run: npm run test:e2e
```

## Debugging

### Vitest

- Użyj `test.only()` aby uruchomić tylko jeden test
- Użyj `console.log()` w testach dla debugowania
- Uruchom `npm run test:ui` dla interaktywnego debugowania

### Playwright

- Użyj `npm run test:e2e:debug` dla step-by-step debugging
- Użyj `await page.pause()` w teście dla zatrzymania wykonania
- Otwórz HTML report: `npx playwright show-report`

## Dodatkowe Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
