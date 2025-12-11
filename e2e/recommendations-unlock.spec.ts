import { test, expect } from "./fixtures/test-setup";
import { LoginPage } from "./pages/login.page";
import { MainPage } from "./pages/main.page";
import { getTestCredentials } from "./helpers/test-credentials";

test.describe("Recommendations Unlock Scenario", () => {
  let loginPage: LoginPage;
  let mainPage: MainPage;
  const credentials = getTestCredentials();

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    mainPage = new MainPage(page);
  });

  test("user without 10 ratings cannot generate recommendations", async ({ page, context }) => {
    // Step 1: Clear all cookies and storage to ensure fresh start after cleanup
    await context.clearCookies();
    await context.clearPermissions();

    // Step 2: Navigate to login page
    await loginPage.goto();

    // Step 3: Fill in login credentials and submit
    await loginPage.login(credentials.username, credentials.password);

    // Wait for navigation away from login page (redirect after successful login)
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });

    // Step 4: Verify user is on main page
    await expect(mainPage.heading).toBeVisible();

    // Step 5: Verify recommendations are locked
    const isLocked = await mainPage.isRecommendationsLocked();
    expect(isLocked).toBe(true);

    // Step 6: Verify locked message is displayed
    await expect(mainPage.recommendationsLockedMessage).toBeVisible();

    // Step 7: Verify threshold is 10
    const threshold = await mainPage.getRatingsThreshold();
    expect(threshold).toBe(10);

    // Step 8: Verify recommendations section is not visible
    await expect(mainPage.recommendationsSection).not.toBeVisible();

    // Step 9: Verify progress bar shows current progress (should be 0 after cleanup)
    const progress = await mainPage.getRatingsProgress();
    expect(progress.total).toBe(10);
    expect(progress.current).toBe(0);
  });

  test("user can rate movies and unlock recommendations after 10 ratings", async ({ page }) => {
    test.setTimeout(180000); // 3 minutes timeout for this test

    // Step 1: Login
    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });

    // Step 2: Verify initial state - recommendations locked
    expect(await mainPage.isRecommendationsLocked()).toBe(true);

    // Step 3: Check current progress
    const initialProgress = await mainPage.getRatingsProgress();
    const ratingsNeeded = initialProgress.total - initialProgress.current;

    // Step 4: Search for movies and rate them
    // Rate movies in batches of 3, checking progress after each batch
    let currentProgress = initialProgress.current;
    let attempt = 0;
    const maxAttempts = 20;
    const batchSize = 3;

    console.log(`Need ${ratingsNeeded} more ratings (${currentProgress}/${initialProgress.total}).`);

    while (currentProgress < initialProgress.total && attempt < maxAttempts) {
      // Rate a batch of movies
      for (let i = 0; i < batchSize && attempt < maxAttempts; i++) {
        try {
          console.log(`\nAttempt ${attempt + 1}...`);

          const movieCard = await mainPage.movieSearch.searchAndGetUnratedMovie(attempt);
          await movieCard.waitForVisible();
          await movieCard.rateMovie(8);

          console.log(`Successfully rated movie ${attempt + 1}`);
          await page.waitForTimeout(1000);

          await mainPage.movieSearch.clearSearch();
          await page.waitForTimeout(300);

          attempt++;
        } catch (error) {
          console.log(`Attempt ${attempt + 1} failed: ${error.message}`);
          attempt++;
          try {
            await page.goto("/");
            await page.waitForTimeout(500);
          } catch {
            // Ignore navigation errors
          }
        }
      }

      // Check progress after batch
      console.log("\nChecking progress...");
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1000);

      // Check if recommendations are unlocked (progress bar disappears when unlocked)
      const isUnlocked = await mainPage.isRecommendationsUnlocked();
      if (isUnlocked) {
        console.log("✓ Threshold reached - recommendations unlocked!");
        currentProgress = initialProgress.total; // Set to threshold
        break;
      }

      // Still locked, read the progress
      const newProgress = await mainPage.getRatingsProgress();
      console.log(`Progress: ${newProgress.current}/${newProgress.total}`);
      currentProgress = newProgress.current;
    }

    if (currentProgress < initialProgress.total) {
      throw new Error(
        `Failed to reach threshold after ${attempt} attempts. Progress: ${currentProgress}/${initialProgress.total}`
      );
    }

    // Step 5: Verify recommendations are now unlocked
    // We already reloaded after the last batch, so just check if visible
    console.log("Verifying recommendations section is now visible...");
    await mainPage.recommendationsSection.waitFor({ state: "visible", timeout: 5000 });

    expect(await mainPage.isRecommendationsUnlocked()).toBe(true);
    console.log("✓ Recommendations unlocked!");

    // Step 6: Verify recommendation generator is visible
    await expect(mainPage.recommendationsSection).toBeVisible();
    await expect(mainPage.recommendationGenerator.container).toBeVisible();

    // Step 7: Verify generate button is enabled
    expect(await mainPage.recommendationGenerator.isButtonEnabled()).toBe(true);

    console.log("✓ Test passed - recommendations panel unlocked and ready!");
  });

  test("generate button is disabled when recommendations limit is reached", async ({ page }) => {
    // This test assumes user has already unlocked recommendations
    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });

    // Skip if recommendations are not unlocked
    const isUnlocked = await mainPage.isRecommendationsUnlocked();
    test.skip(!isUnlocked, "Recommendations not unlocked for this user");

    // Generate recommendations until limit is reached
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const usage = await mainPage.recommendationGenerator.getUsageCount();

      if (usage.used >= usage.limit) {
        // Limit reached
        break;
      }

      await mainPage.recommendationGenerator.generateAndWaitForResults();
      attempts++;
    }

    // Verify button is now disabled
    expect(await mainPage.recommendationGenerator.isButtonDisabled()).toBe(true);

    // Verify error message is shown when trying to generate
    const hasReachedLimit = await mainPage.recommendationGenerator.hasReachedLimit();
    expect(hasReachedLimit).toBe(true);
  });
});
