import { test as base } from '@playwright/test';
import { cleanupUserDataByEmail } from '../helpers/cleanup';
import { getTestCredentials } from '../helpers/test-credentials';

/**
 * Extended test fixture that cleans up user data before each test
 * This ensures test isolation and prevents data pollution between test runs
 */
export const test = base.extend({
  /**
   * Auto fixture that runs before each test to clean up test user data
   */
  cleanDatabase: [
    async ({}, use) => {
      const credentials = getTestCredentials();

      // Cleanup before test
      console.log(`\n[Test Setup] Cleaning database for user: ${credentials.username}`);
      await cleanupUserDataByEmail(credentials.username);
      console.log(`[Test Setup] ✓ Database cleaned\n`);

      // Run the test
      await use();

      // Cleanup after test is optional - we clean before each test anyway
      // If you want to also cleanup after, uncomment the lines below:
      // console.log(`\n[Test Teardown] Cleaning database for user: ${credentials.username}`);
      // await cleanupUserDataByEmail(credentials.username);
      // console.log(`[Test Teardown] ✓ Database cleaned\n`);
    },
    { auto: true }, // Auto-run for every test
  ],
});

export { expect } from '@playwright/test';
