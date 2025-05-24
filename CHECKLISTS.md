# Project Checklists Overview

This project uses several critical checklists to ensure quality and prevent common failure patterns. These checklists follow the principles from Atul Gawande's "The Checklist Manifesto" - using simple, actionable checks at critical transition points to prevent predictable failures.

## Pre-Implementation Checklists (In Order)

### 1. [Template Adaptation Checklist](./TEMPLATE_ADAPTATION_CHECKLIST.md)
**When:** Starting from a template or forking a project  
**Purpose:** Ensure all configuration values are updated consistently  
**Prevents:** Database connection errors, naming inconsistencies, partial updates

### 2. [Schema-Code Alignment Checklist](./SCHEMA_CODE_ALIGNMENT_CHECKLIST.md)
**When:** After creating migrations, before implementing features  
**Purpose:** Ensure database schema, API, and tests are synchronized  
**Prevents:** Field name mismatches, type errors, failing tests

## Operational Checklists

### 3. [Configuration Locations Reference](./CONFIG_LOCATIONS.md)
**When:** Making configuration changes  
**Purpose:** Quick reference for where configuration values appear  
**Prevents:** Missing updates in obscure locations

## Why These Checklists Matter

Our experience showed that without these checklists:
- Database names were inconsistent (`app_db` vs `petbnb`)
- API endpoints queried non-existent tables
- Tests failed due to schema-code mismatches
- Hours were wasted debugging configuration issues

With these checklists:
- Configuration issues are caught immediately
- Schema mismatches are prevented before coding
- Tests pass on first run
- Development proceeds smoothly

## Checklist Principles

1. **DO-CONFIRM** - Do the work, then confirm with the checklist
2. **Pause Points** - Natural breaks between phases
3. **Simple Items** - Each item is clear and actionable
4. **Automated Verification** - Scripts validate completion where possible

## Adding New Checklists

When creating a new checklist:
1. Identify a repeated failure pattern
2. Document the specific checks that would prevent it
3. Place the checklist at the natural pause point
4. Include validation criteria
5. Add it to this overview

Remember: A 30-minute checklist can save hours of debugging!