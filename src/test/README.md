# Test Directory Structure

## setup.ts

Global test setup file that is loaded before all tests. Contains:

- Extension of Vitest expect with jest-dom matchers
- Automatic cleanup after each test
- Mocks for browser APIs (matchMedia, IntersectionObserver)

## unit/

Directory for unit tests that test individual functions, utilities, and components in isolation.

Examples:

- Testing utility functions
- Testing individual React components
- Testing hooks

## integration/

Directory for integration tests that test how multiple components or modules work together.

Examples:

- Testing component interactions
- Testing data flow between components
- Testing service integrations
