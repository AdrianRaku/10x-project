/**
 * Test credentials helper
 * Loads credentials from environment variables set in .env.test
 */

export function getTestCredentials() {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'E2E_USERNAME and E2E_PASSWORD must be set in .env.test file'
    );
  }

  return {
    username,
    password,
  };
}
