# E2E Tests Directory

This directory contains end-to-end tests using Playwright.

## Structure

```
e2e/
├── pages/                                  # Page Object Models
│   ├── login.page.ts                      # Login page POM
│   └── main.page.ts                       # Main page POM
├── components/                            # Component Object Models
│   ├── movie-search.component.ts          # Movie search component
│   ├── movie-card.component.ts            # Movie card component
│   ├── movie-rating.component.ts          # Movie rating dialog component
│   └── recommendation-generator.component.ts # Recommendation generator component
├── *.spec.ts                              # Test files
└── README.md                              # This file
```

## Page Object Models (POM)

The `pages/` and `components/` directories contain Page Object Models that encapsulate page-specific and component-specific logic and selectors. This pattern:

- Improves test maintainability
- Reduces code duplication
- Makes tests more readable
- Isolates page-specific changes
- Follows Playwright best practices

### Available Pages

#### LoginPage (`pages/login.page.ts`)

Handles login functionality and form validation.

**Key Methods:**

- `goto()` - Navigate to login page
- `login(email, password)` - Fill form and submit
- `waitForFormError()` - Wait for error message
- `getFormErrorText()` - Get error message text

**Key Locators:**

- `emailInput` - Email input field
- `passwordInput` - Password input field
- `submitButton` - Login submit button
- `formError` - Form error message

#### MainPage (`pages/main.page.ts`)

Represents the main application page with movie search and recommendations.

**Key Methods:**

- `goto()` - Navigate to main page
- `isRecommendationsUnlocked()` - Check if recommendations are available
- `isRecommendationsLocked()` - Check if recommendations are locked
- `getRatingsProgress()` - Get current ratings progress
- `getRatingsThreshold()` - Get required ratings threshold
- `waitForRecommendationsToUnlock()` - Wait for recommendations to become available
- `getRecommendationsCount()` - Get number of recommendations displayed

**Key Locators:**

- `recommendationsLockedMessage` - Message about locked recommendations
- `ratingsThreshold` - Required number of ratings
- `ratingsProgressBar` - Progress bar element
- `ratingsProgressText` - Progress text (e.g., "5/10")
- `recommendationsSection` - Recommendations section container

**Embedded Components:**

- `movieSearch` - MovieSearchComponent instance
- `recommendationGenerator` - RecommendationGeneratorComponent instance

### Available Components

#### MovieSearchComponent (`components/movie-search.component.ts`)

Handles movie search functionality.

**Key Methods:**

- `search(query)` - Enter search query
- `clearSearch()` - Clear search input
- `searchAndWaitForResults(query)` - Search and wait for results
- `waitForResults()` - Wait for search results to load
- `getResultsCount()` - Get number of results
- `getFirstMovieCard()` - Get first movie card
- `getAllMovieCards()` - Get all movie cards

**Key Locators:**

- `searchInput` - Search input field
- `loadingIndicator` - Loading state indicator
- `resultsContainer` - Search results container

#### MovieCardComponent (`components/movie-card.component.ts`)

Represents a single movie card in search results or recommendations.

**Key Methods:**

- `clickCard()` - Navigate to movie details
- `getTitle()` - Get movie title
- `getYear()` - Get movie year
- `rateMovie(rating)` - Open dialog and rate movie (1-10)
- `isVisible()` - Check if card is visible
- `waitForVisible()` - Wait for card to be visible

**Key Locators:**

- `card` - Card container (dynamic: `movie-card-{tmdbId}`)
- `link` - Card link to details
- `title` - Movie title
- `year` - Movie year

**Embedded Components:**

- `rating` - MovieRatingComponent instance

#### MovieRatingComponent (`components/movie-rating.component.ts`)

Handles movie rating dialog and star selection.

**Key Methods:**

- `openRatingDialog()` - Open rating dialog
- `closeDialog()` - Close dialog
- `selectRating(rating)` - Select rating (1-10)
- `submitRating()` - Submit selected rating
- `rateMovie(rating)` - Complete flow: open, select, submit
- `getCurrentRating()` - Get current user rating if exists
- `hasRating()` - Check if movie is already rated

**Key Locators:**

- `rateButton` - Button to open rating dialog
- `dialog` - Rating dialog container
- `starsContainer` - Container with star buttons
- `selectedRatingDisplay` - Display of selected rating
- `submitButton` - Submit rating button
- `cancelButton` - Cancel button

#### RecommendationGeneratorComponent (`components/recommendation-generator.component.ts`)

Handles AI recommendation generation.

**Key Methods:**

- `generateRecommendations(prompt?)` - Generate with optional prompt
- `fillPrompt(prompt)` - Fill prompt textarea
- `generateAndWaitForResults(prompt?)` - Generate and wait for completion
- `isButtonEnabled()` - Check if generate button is enabled
- `isButtonDisabled()` - Check if button is disabled (limit reached)
- `getUsageCount()` - Get usage stats `{ used, limit }`
- `hasReachedLimit()` - Check if daily limit reached

**Key Locators:**

- `promptInput` - Optional prompt textarea
- `generateButton` - Generate recommendations button
- `usageCounter` - Usage counter display
- `loadingIndicator` - Loading state
- `errorMessage` - Error message display

## Naming Conventions

- Test files: `*.spec.ts`
- Page Object Models: `*.page.ts`
- Component Object Models: `*.component.ts`
- Use descriptive names that reflect the feature being tested

## Example Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { MainPage } from "./pages/main.page";

test.describe("Feature Name", () => {
  let loginPage: LoginPage;
  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    mainPage = new MainPage(page);
  });

  test("should do something", async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login("user@example.com", "password");

    // Interact with main page
    await mainPage.goto();
    await mainPage.movieSearch.search("Matrix");
    await mainPage.movieSearch.waitForResults();

    // Rate a movie
    const movieCard = await mainPage.movieSearch.getFirstMovieCard();
    await movieCard.rateMovie(8);
  });
});
```

## Example: Complete Scenario Test

See `recommendations-unlock.spec.ts` for a complete example demonstrating:

1. User login
2. Checking recommendations lock state
3. Rating multiple movies
4. Unlocking recommendations after threshold
5. Generating AI recommendations

## Data Test IDs

All components use `data-test-id` attributes for stable, resilient selectors:

- Login: `login-form`, `login-email-input`, `login-password-input`, `login-submit-button`
- Main page: `recommendations-locked-message`, `ratings-threshold`, `ratings-progress-bar`
- Movie search: `movie-search-input`, `movie-search-results`
- Movie card: `movie-card-{tmdbId}`, `rate-movie-button`
- Rating dialog: `rating-dialog`, `rating-star-{1-10}`, `rating-submit-button`
- Recommendations: `generate-recommendations-button`, `recommendation-prompt-input`

## Test Configuration

### Environment Variables

Tests use credentials from `.env.test` file:

- `E2E_USERNAME` - Test user email
- `E2E_PASSWORD` - Test user password

The `playwright.config.ts` automatically loads these variables using dotenv.

### Test Helpers

`helpers/test-credentials.ts` - Helper for loading test credentials from environment variables

```typescript
import { getTestCredentials } from "./helpers/test-credentials";

const credentials = getTestCredentials();
await loginPage.login(credentials.username, credentials.password);
```

## Running Tests

See [TESTING.md](../TESTING.md) for detailed instructions on running E2E tests.

```bash
# Run all tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/recommendations-unlock.spec.ts
```

**IMPORTANT:** Make sure `.env.test` exists with valid test credentials before running tests.
