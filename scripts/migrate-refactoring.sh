#!/bin/bash

# Migration script for refactored code
# This script helps migrate from old to new refactored structure

set -e

echo "🔄 MyFilms Refactoring Migration Script"
echo "========================================"
echo ""

# Function to backup files
backup_files() {
  echo "📦 Creating backup..."
  mkdir -p .backups/pre-refactoring

  cp src/lib/services/recommendations.service.ts .backups/pre-refactoring/ 2>/dev/null || true
  cp src/lib/services/movies.service.ts .backups/pre-refactoring/ 2>/dev/null || true
  cp src/pages/api/recommendations.ts .backups/pre-refactoring/ 2>/dev/null || true
  cp src/pages/api/ratings.ts .backups/pre-refactoring/ 2>/dev/null || true
  cp src/pages/api/lists.ts .backups/pre-refactoring/ 2>/dev/null || true

  echo "✅ Backup created in .backups/pre-refactoring/"
}

# Function to run tests
run_tests() {
  echo ""
  echo "🧪 Running tests..."
  npm run test || {
    echo "❌ Tests failed! Migration aborted."
    exit 1
  }
  echo "✅ Tests passed!"
}

# Function to check TypeScript
check_types() {
  echo ""
  echo "🔍 Checking TypeScript types..."
  npm run build || {
    echo "❌ Type check failed! Migration aborted."
    exit 1
  }
  echo "✅ Types are valid!"
}

# Function to migrate files
migrate_files() {
  echo ""
  echo "🚀 Migrating files..."

  # Remove old files
  echo "  Removing old files..."
  rm -f src/lib/services/recommendations.service.ts
  rm -f src/lib/services/movies.service.ts
  rm -f src/pages/api/recommendations.ts
  rm -f src/pages/api/ratings.ts
  rm -f src/pages/api/lists.ts

  # Rename new files
  echo "  Renaming refactored files..."
  mv src/lib/services/recommendations.service.refactored.ts src/lib/services/recommendations.service.ts
  mv src/lib/services/movies.service.refactored.ts src/lib/services/movies.service.ts
  mv src/pages/api/recommendations.refactored.ts src/pages/api/recommendations.ts
  mv src/pages/api/ratings.refactored.ts src/pages/api/ratings.ts
  mv src/pages/api/lists.refactored.ts src/pages/api/lists.ts

  echo "✅ Files migrated successfully!"
}

# Function to rollback
rollback() {
  echo ""
  echo "⏮️  Rolling back changes..."

  cp .backups/pre-refactoring/recommendations.service.ts src/lib/services/ 2>/dev/null || true
  cp .backups/pre-refactoring/movies.service.ts src/lib/services/ 2>/dev/null || true
  cp .backups/pre-refactoring/recommendations.ts src/pages/api/ 2>/dev/null || true
  cp .backups/pre-refactoring/ratings.ts src/pages/api/ 2>/dev/null || true
  cp .backups/pre-refactoring/lists.ts src/pages/api/ 2>/dev/null || true

  echo "✅ Rollback complete!"
}

# Main script
case "${1:-}" in
  "backup")
    backup_files
    ;;
  "test")
    run_tests
    ;;
  "check")
    check_types
    ;;
  "migrate")
    backup_files
    run_tests
    check_types
    migrate_files
    echo ""
    echo "🎉 Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run E2E tests: npm run test:e2e"
    echo "2. Test manually in browser"
    echo "3. Deploy to staging"
    ;;
  "rollback")
    rollback
    ;;
  *)
    echo "Usage: $0 {backup|test|check|migrate|rollback}"
    echo ""
    echo "Commands:"
    echo "  backup   - Create backup of current files"
    echo "  test     - Run unit tests"
    echo "  check    - Check TypeScript types"
    echo "  migrate  - Full migration (backup + test + check + migrate)"
    echo "  rollback - Restore from backup"
    exit 1
    ;;
esac

