# Template Adaptation Checklist

## Purpose
This checklist ensures all configuration values are consistent across the codebase when adapting a starter template or boilerplate project. It prevents cascading configuration errors that occur when default values are not fully updated.

## When to Use This Checklist
- ✅ When starting a project from a template/boilerplate
- ✅ When forking an existing project for a new purpose
- ✅ Before any feature development on an adapted codebase
- ✅ When renaming a project or changing its domain

## The Checklist

### 1. Database Name Consistency
- [ ] Identify the default database name in the template (e.g., `app_db`, `starter_db`, `myapp`)
- [ ] Choose your project-specific database name (e.g., `petbnb`)
- [ ] Search entire codebase for the default name:
  ```bash
  grep -r "app_db" . --exclude-dir=node_modules --exclude-dir=.git
  ```
- [ ] Update all occurrences in:
  - `docker-compose.yml` - POSTGRES_DB environment variable
  - `.env` and `.env.example` - DATABASE_URL
  - All files in `/scripts/` - especially seed and setup scripts
  - `DATABASE.md` and other documentation
  - Migration files (if any contain database-specific commands)
  - Test configuration files
  - CI/CD configuration files
- [ ] Verify no occurrences remain:
  ```bash
  grep -r "app_db" . --exclude-dir=node_modules --exclude-dir=.git | wc -l
  # Should output: 0
  ```

### 2. Application Name Consistency
- [ ] Identify all variations of the template's name:
  - Full name (e.g., "AI Starter App")
  - Package name (e.g., "ai-starter-app")
  - Short name (e.g., "starter")
  - Domain references (e.g., "aistart.com")
- [ ] Create a mapping table:
  ```
  Template Name          → Your Project Name
  AI Starter App        → PetBnB
  ai-starter-app        → petbnb
  starter               → petbnb
  aistart.com          → petbnb.com
  noreply@aistart.com  → noreply@petbnb.com
  ```
- [ ] Update all occurrences in:
  - `package.json` - name field
  - `README.md` - project title and descriptions
  - HTML page titles
  - Email templates
  - API documentation
  - Error messages
  - Log output

### 3. Package and Module References
- [ ] Update `package.json`:
  ```json
  {
    "name": "petbnb",
    "description": "Pet sitting marketplace",
    // ... other fields
  }
  ```
- [ ] Update import paths if package name is referenced
- [ ] Update any module aliases in build configs
- [ ] Search for the old package name in:
  ```bash
  grep -r "ai-starter-app" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
  ```

### 4. Docker and Container References
- [ ] Update Docker image names in:
  - `docker-compose.yml`
  - `Dockerfile`
  - Build scripts
  - Deployment configurations
- [ ] Update container names if hardcoded anywhere
- [ ] Update volume names to match project

### 5. Environment Variables
- [ ] Document all environment variables that need renaming:
  ```
  Old Variable              → New Variable
  STARTER_APP_SECRET       → PETBNB_SECRET
  REACT_APP_STARTER_API    → REACT_APP_PETBNB_API
  ```
- [ ] Update in:
  - `.env` and `.env.example`
  - CI/CD secrets
  - Deployment configurations
  - Documentation
  - Code references

### 6. API Endpoints and URLs
- [ ] Update any hardcoded URLs:
  - API base URLs
  - Webhook endpoints
  - OAuth redirect URLs
  - CORS allowed origins
- [ ] Update API route prefixes if they include the app name

### 7. Automated Validation Script
- [ ] Ensure `scripts/validate-config.js` exists and includes checks for your project
- [ ] Run the validation:
  ```bash
  node scripts/validate-config.js
  ```
- [ ] The script should check for:
  - Old database names
  - Old application names
  - Old package names
  - Old domain references

### 8. End-to-End Smoke Test
- [ ] Clean start test:
  ```bash
  # Remove all containers and volumes
  docker-compose down -v
  
  # Start fresh
  docker-compose up -d
  npm run migrate
  npm run dev
  ```
- [ ] Verify in logs:
  - Correct database name in connection strings
  - No "database does not exist" errors
  - No references to old project name
- [ ] Test basic functionality:
  - Health check endpoint responds
  - Can create a record
  - Can query records

### 9. Documentation Update
- [ ] Update all documentation to reflect new names:
  - README.md
  - API documentation
  - Setup guides
  - Contributing guidelines
- [ ] Update example commands and code snippets
- [ ] Update screenshots if they show old names

### 10. Git Repository Cleanup
- [ ] Update repository name (if applicable)
- [ ] Update repository description
- [ ] Update any GitHub/GitLab specific configurations
- [ ] Update issue templates
- [ ] Update PR templates

### 11. Test Suite Adaptation
- [ ] **Component Tests**: Update all hardcoded text (e.g., "Top Asian Noodles" → "PetBnB")
- [ ] **API Tests**: Update endpoints and expected responses
- [ ] **E2E Tests**: These require COMPLETE REWRITING
  - [ ] Disable/delete all template e2e tests
  - [ ] Document new user flows for your domain
  - [ ] Write new e2e tests from scratch
  - [ ] Update all selectors to match new UI
- [ ] **Test Data**: Update all fixtures and mocks

## Validation Criteria
✅ All checks above are completed
✅ `validate-config.js` passes with no errors
✅ Application starts without configuration errors
✅ No references to template's original names remain
✅ Database connection works with new name
✅ All tests pass with updated configuration

## Common Pitfalls
1. **Partial updates** - Missing occurrences in less obvious files
2. **Case sensitivity** - Missing variations like `APP_DB` vs `app_db`
3. **Documentation drift** - Code updated but docs still show old names
4. **Hidden references** - In error messages, logs, or comments
5. **Test data** - Hardcoded values in test fixtures

## Recovery Steps
If you discover configuration issues after development has started:
1. Stop all development work
2. Create a configuration fix branch
3. Run through this entire checklist
4. Test thoroughly before merging
5. Have another developer verify the changes

## Important Note
This checklist MUST be completed before any feature development. Configuration inconsistencies become exponentially harder to fix as the codebase grows. Spending 30 minutes on this checklist saves hours of debugging later.