# Instructions for AI Coding Assistants

## Project Overview

PetBnB is a pet-sitting marketplace application with spatial search capabilities using:
- React 18 with Vite for the frontend
- Express (JavaScript) for the backend API
- PostgreSQL 15 with PostGIS 3.4 for spatial database
- SQL-first approach (no ORM)
- Mapbox GL JS for interactive maps
- SWR for server state management
- Plain CSS with BEM naming convention

## Common Commands

### Development
- `npm run dev` - Start both client and server
- `npm run dev:client` - Start Vite development server only
- `npm run dev:server` - Start Express server only
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Database
- `npm run migrate` - Run database migrations (requires DATABASE_URL)
- `npm run seed` - Seed the database with sample data
- `npm run generate-images` - Generate Studio Ghibli profile images using OpenAI
- `npm run seed:full` - Generate images and seed database

### Building
- `npm run build` - Build both client and server
- `npm run build:client` - Build client only
- `npm run build:server` - Build server only (Note: Backend is JavaScript, no build needed)

### Testing
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:api` - Run API tests with Vitest
- `npm run test:e2e` - Run E2E tests with Playwright

## Important Files and Directories

- `/migrations/` - SQL migration files
- `/scripts/seed.js` - Database seeding script
- `/scripts/generate-images.js` - Studio Ghibli image generation script
- `/src/server/db.js` - PostgreSQL connection pool
- `/src/server/simplified-server.js` - Main Express server file
- `/src/client/components/` - React components
- `/public/images/profiles/` - Generated profile images

## PostGIS Usage Patterns

When working with spatial data:

1. Always use `ST_SetSRID` with SRID 4326 (WGS84) for storing points:
   ```sql
   ST_SetSRID(ST_GeomFromText('POINT(-122.3 47.6)'), 4326)
   ```

2. For distance queries, cast to geography type:
   ```sql
   ST_Distance(
     location::geography,
     ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
   ) AS meters
   ```

3. Use spatial indices for better performance:
   ```sql
   CREATE INDEX idx_spatial ON table USING GIST (column);
   ```

4. The standard pattern for nearby searches:
   ```sql
   SELECT id, name, 
     ST_Distance(location::geography, ST_MakePoint($1, $2)::geography) AS meters
   FROM table
   WHERE ST_DWithin(location::geography, ST_MakePoint($1, $2)::geography, $3)
   ORDER BY meters;
   ```

## Code Style Guidelines

- Backend uses CommonJS (require/module.exports) as it's JavaScript
- Frontend uses ES modules (import/export)
- Use async/await for asynchronous operations
- Frontend uses TypeScript, backend uses JavaScript
- Use Zod for input validation
- Prefer raw SQL with parameterized queries over query builders
- React components should be functional with hooks
- CSS uses BEM naming convention, no Tailwind

## Project Structure Notes

- Frontend and backend are in the same repository
- `/src/client/` contains all frontend code (TypeScript/React)
- `/src/server/` contains all backend code (JavaScript/Express)
- Vite handles frontend bundling
- Backend runs directly with Node.js (no compilation)
- Tests use Vitest for both frontend and backend

## Docker Tips

- Use `docker-compose up -d postgres` to start only the database
- The full `docker-compose up` command starts everything including migrations
- Database data is persisted in a Docker volume

## Common Pitfalls

- Remember to cast geometry to geography for distance calculations in meters
- Mapbox requires MAPBOX_TOKEN environment variable to be set
- OpenAI image generation requires OPENAI_API_KEY environment variable
- Ensure proper CORS setup when testing the frontend against backend
- Make sure environment variables are properly set in .env file
- Backend uses JavaScript, not TypeScript - no type annotations

## Environment Variables

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/petbnb"

# Mapbox for maps and geocoding
MAPBOX_TOKEN="your-mapbox-token"

# OpenAI for Studio Ghibli image generation
OPENAI_API_KEY="your-openai-api-key"
```

## Phase 1 Focus

Phase 1 is logged-out functionality only:
- No authentication system
- Public sitter profiles
- Search and discovery features
- Studio Ghibli-style generated profile images
- Placeholder data for ratings and response times