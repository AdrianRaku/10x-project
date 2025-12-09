# Test Helper Scripts

This directory contains helper scripts for managing E2E test environment and troubleshooting.

## Scripts

### `check-test-env.js`

Verifies that all required environment variables are set in `.env.test`.

```bash
node scripts/check-test-env.js
```

### `test-supabase-login.js`

Tests if the E2E test credentials can successfully authenticate with Supabase.

```bash
node scripts/test-supabase-login.js
```

### `create-test-user.js`

Creates a test user in Supabase Authentication for E2E testing.

**Requirements:**
- `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.test`
- Get this key from Supabase Dashboard → Settings → API → service_role key

```bash
node scripts/create-test-user.js
```

### `reset-test-user-password.js`

Resets the password for an existing test user to match `.env.test`.

**Requirements:**
- `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.test`
- User must already exist in Supabase

```bash
node scripts/reset-test-user-password.js
```

## Typical Workflow

### First Time Setup

1. Check environment variables:
   ```bash
   node scripts/check-test-env.js
   ```

2. Create test user:
   ```bash
   # First, add SUPABASE_SERVICE_ROLE_KEY to .env.test
   node scripts/create-test-user.js
   ```

3. Verify login works:
   ```bash
   node scripts/test-supabase-login.js
   ```

### Troubleshooting Failed Tests

If E2E tests fail with authentication errors:

1. Test the credentials:
   ```bash
   node scripts/test-supabase-login.js
   ```

2. If login fails:
   - Check if user exists in Supabase Dashboard
   - If user exists, reset password:
     ```bash
     node scripts/reset-test-user-password.js
     ```
   - If user doesn't exist, create it:
     ```bash
     node scripts/create-test-user.js
     ```

## Environment Variables

Required in `.env.test`:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Only needed for user management scripts

# E2E Test Credentials
E2E_USERNAME=test@tes.pl
E2E_PASSWORD=your_test_password
```
