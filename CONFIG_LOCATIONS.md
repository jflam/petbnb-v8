# Configuration Locations Reference

This document tracks all locations where key configuration values appear in the codebase. This is essential for preventing configuration mismatches when adapting templates or making system-wide changes.

## Database Name: `petbnb`

The database name appears in the following locations:

### Core Configuration Files
- **docker-compose.yml**: Line 8 - `POSTGRES_DB: petbnb`
- **.env**: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/petbnb`
- **DATABASE.md**: Multiple references to connection strings

### Scripts
- **scripts/check-db.js**: Line 8 - Default connection string fallback
- **scripts/dev.js**: Line 117 - Local database URL for development
- **scripts/seed.js**: Uses DATABASE_URL from environment
- **scripts/seed.ts**: Uses DATABASE_URL from environment

### Test Configuration
- **tests/_setupDb.ts**: Uses DATABASE_URL from environment
- **tests/setupGlobal.ts**: Test database configuration
- **scripts/setup-test-db.js**: Test database name references
- **scripts/setup-test-db.sh**: Shell script for test DB setup

### Documentation
- **specs/phase1_plan.md**: Line 105 - Example DATABASE_URL
- **CLAUDE.md**: References to petbnb in instructions

## Application Name: `PetBnB`

The application name appears in:

### Package Files
- **package.json**: Line 2 - `"name": "ai-starter-app-postgis"`
- **package-lock.json**: Generated from package.json

### Documentation
- **README.md**: Project title and descriptions
- **specs/petbnb_spec.md**: Product specification
- **specs/phase1_plan.md**: Implementation plan
- **CLAUDE.md**: AI assistant instructions

### Frontend Components
- **src/client/components/Header.tsx**: Application title
- **src/client/components/LandingPage.tsx**: Hero section text
- **index.html**: Page title tag

## Environment Variables

Key environment variables and their locations:

### MAPBOX_TOKEN
- **.env**: Token definition
- **src/client/hooks/useRestaurants.ts**: API calls
- **src/client/components/RestaurantMap.tsx**: Map initialization
- **CLAUDE.md**: Documentation of required env vars

### DATABASE_URL
- **.env**: Connection string
- **src/server/db.js**: Database pool initialization
- **scripts/**: Various seed and migration scripts
- **tests/**: Test setup files

### OPENAI_API_KEY
- **.env**: API key for image generation
- **scripts/generate-images.js**: Studio Ghibli image generation
- **CLAUDE.md**: Documentation

## Port Numbers

Default ports used:

- **PostgreSQL**: 5432 (docker-compose.yml, connection strings)
- **Express Server**: 3001 (src/server/simplified-server.js)
- **Vite Dev Server**: 5173 (vite.config.ts)

## Docker Configuration

Docker-related configuration:

- **Container Names**: Set by Docker Compose project name (directory name)
- **Volume Names**: `postgres_data` in docker-compose.yml
- **Network**: Default bridge network created by Docker Compose

## Test Database Name: `petbnb_test`

The test database name appears in:

### Test Setup Files
- **tests/_setupDb.ts**: Line 12 - `POSTGRES_DB: 'petbnb_test'`
- **tests/_setupDb.ts**: Line 23 - Connection string
- **tests/server/api.test.ts**: Line 21 - Fallback connection string
- **scripts/setup-test-db.sh**: Line 9 - Test database URL

## Validation Script

To check configuration consistency, run:
```bash
node scripts/validate-config.js
```

This script will search for obsolete terms and verify all configuration values are properly updated.

## Checklist for Configuration Changes

When changing any configuration value:

1. [ ] Update all locations listed in this document
2. [ ] Run the validation script
3. [ ] Restart all services (Docker, dev servers)
4. [ ] Run migrations if database-related
5. [ ] Update this document if new locations are added
6. [ ] Commit all changes together to maintain consistency