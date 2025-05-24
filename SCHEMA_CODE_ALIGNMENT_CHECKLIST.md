# Schema-Code Alignment Checklist

## Purpose
This checklist prevents the common failure pattern where database schema, API endpoints, and tests become misaligned during development. It must be completed whenever schema changes are made.

## When to Use This Checklist
- ✅ After creating or modifying database migrations
- ✅ When transitioning from one domain model to another (e.g., restaurants → sitters)
- ✅ Before writing any tests
- ✅ After adapting a template or starter project

## The Checklist

### 1. Schema Definition Phase
- [ ] Database migration files created
- [ ] Migration runs successfully on fresh database
- [ ] Schema documented with all column names and types
- [ ] Run query to verify table structure: `\d table_name`

### 2. API Endpoint Alignment
For each table in the schema:
- [ ] List all CRUD endpoints needed
- [ ] Map database columns to API request/response fields
- [ ] Create field mapping document:
  ```
  Database Column    → API Field       → Type
  first_name        → firstName       → string
  hourly_rate       → hourlyRate      → number
  ```
- [ ] Verify each endpoint queries the correct table
- [ ] Test each endpoint with minimal data

### 3. Code Generation Verification
- [ ] Generate TypeScript types from database schema (if applicable)
- [ ] Verify field names match between:
  - Database columns
  - API DTOs/interfaces
  - Frontend types
- [ ] Document any intentional mismatches

### 4. Test Data Alignment
- [ ] Create test data that matches exact schema
- [ ] Verify test assertions use correct field names
- [ ] Run this verification query:
  ```sql
  -- Insert test record and immediately query it
  INSERT INTO table_name (...) VALUES (...) RETURNING *;
  ```
- [ ] Ensure test data includes all required fields
- [ ] Test data uses appropriate data types

### 5. Integration Smoke Test
Before writing feature tests:
- [ ] Start with empty test database
- [ ] Run migrations
- [ ] Create one record via API
- [ ] Read that record via API
- [ ] Verify all fields round-trip correctly
- [ ] Update the record via API
- [ ] Delete the record via API

### 6. Legacy Code Handling
When transitioning between schemas:
- [ ] Document which endpoints are legacy
- [ ] Create adapter layer if maintaining backwards compatibility
- [ ] Update legacy endpoints to use new schema
- [ ] Add deprecation notices where appropriate
- [ ] Update all related tests

### 7. Validation Script
Create and run `scripts/validate-schema-alignment.js`:
```javascript
// This script should:
// 1. Query database for table structure
// 2. Make API calls to each endpoint
// 3. Compare field names and types
// 4. Report any mismatches
```

## Red Flags to Catch

1. **Different table names in code vs migrations**
   - Search for: `FROM table_name` in all SQL queries
   - Verify against migration files

2. **Field name mismatches**
   - Database: `first_name` (snake_case)
   - API: `firstName` (camelCase)
   - Document the mapping explicitly

3. **Type mismatches**
   - Database: `DECIMAL` for money
   - JavaScript: `number` (float)
   - Add explicit casting where needed

4. **Missing required fields**
   - Database: `NOT NULL` columns
   - API: Optional parameters
   - Validate required fields in API layer

## Example Implementation

### Step 1: After creating sitter_profiles migration
```sql
-- Verify the table exists and check its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sitter_profiles';
```

### Step 2: Create minimal API test
```javascript
// Test that API field names match what we expect
const response = await request(app)
  .post('/api/sitters')
  .send({
    firstName: 'Test',     // Maps to first_name
    lastName: 'User',      // Maps to last_name
    email: 'test@test.com',
    // ... all required fields
  });

// Verify response has expected fields
expect(response.body).toHaveProperty('first_name', 'Test');
```

### Step 3: Document the mapping
```markdown
## Sitter Profile Field Mapping
| Database        | API Request  | API Response   | Notes           |
|----------------|--------------|----------------|-----------------|
| first_name     | firstName    | first_name     | Snake case in DB |
| hourly_rate    | hourlyRate   | hourly_rate    | DECIMAL → number |
| location       | lat, lng     | location       | PostGIS point   |
```

## Benefits

1. **Catches mismatches early** - Before they cascade into test failures
2. **Documents decisions** - Why field names differ between layers
3. **Speeds up debugging** - Clear mapping when tests fail
4. **Enables automation** - Validation scripts can check alignment
5. **Reduces rework** - Fix issues before writing extensive tests

## When This Checklist Would Have Helped

In our case, this checklist would have caught:
- Server querying `sitters` table instead of `sitter_profiles`
- POST endpoint expecting different fields than the schema
- Restaurant endpoints still querying non-existent `restaurants` table
- Test data structure not matching actual database columns

By completing this checklist after migrations but before writing tests, we would have avoided all the test failures we encountered.