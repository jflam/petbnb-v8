# PetBnB Phase 1: Foundation & Basic Search
## Detailed Implementation Plan

### Overview
Phase 1 establishes the core foundation for PetBnB with basic sitter discovery functionality. This phase delivers a functional MVP that allows pet owners to search for sitters and sitters to create profiles, providing the essential marketplace foundation.

---

## Technical Architecture

### Stack Implementation
Following the provided technical stack template:

**Frontend:**
- React 18 with Vite for development
- TypeScript for type safety
- SWR for server state management
- Plain CSS for styling
- Zod for validation
- Single-page app (no routing needed for Phase 1)

**Backend:**
- Express (current version in codebase)
- JavaScript (no TypeScript compilation)
- PostgreSQL 15 with PostGIS 3.4 (SQL-first, no ORM)
- node-postgres (pg) for database connections
- Zod for API validation

**Infrastructure:**
- Docker for containerization
- npm for package management (no workspaces)
- GitHub Actions for CI/CD
- Azure deployment ready

---

## Core Database Schema (Phase 1 - No Authentication)

```sql
-- SQL-first approach (no ORM)
CREATE TABLE sitter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info (no user association in Phase 1)
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  profile_picture VARCHAR(500),
  
  bio TEXT,
  experience TEXT,
  service_radius INTEGER DEFAULT 10, -- miles
  hourly_rate DECIMAL(10,2) NOT NULL,
  
  -- Mock data fields for Phase 1 visual appeal
  mock_rating DECIMAL(2,1) DEFAULT 4.5,
  mock_review_count INTEGER DEFAULT 12,
  mock_response_time VARCHAR(50) DEFAULT '1 hour',
  mock_repeat_client_percent INTEGER DEFAULT 85,
  
  -- Location
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  location GEOMETRY(Point, 4326), -- PostGIS geometry column
  
  -- Services
  accepts_dogs BOOLEAN DEFAULT true,
  accepts_cats BOOLEAN DEFAULT true,
  accepts_other_pets BOOLEAN DEFAULT false,
  
  -- Home features
  has_fenced_yard BOOLEAN DEFAULT false,
  has_other_pets BOOLEAN DEFAULT false,
  is_smoke_free BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location queries
CREATE INDEX idx_sitter_location ON sitter_profiles USING GIST (location);

-- Create trigger to auto-update location geometry from lat/lng
CREATE OR REPLACE FUNCTION update_sitter_location() RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sitter_location_trigger
BEFORE INSERT OR UPDATE ON sitter_profiles
FOR EACH ROW EXECUTE FUNCTION update_sitter_location();
```

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5433/petbnb"
REDIS_URL="redis://localhost:6379"

# Authentication (Phase 2)
# JWT_SECRET="your-jwt-secret-key"
# JWT_EXPIRES_IN="24h"

# Mapbox (for geocoding and mapping)
MAPBOX_TOKEN="your-mapbox-token"
MAPBOX_STYLE_URL="mapbox://styles/mapbox/streets-v11"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB
```

---

## Implementation Tasks

### 1. Project Foundation & Monorepo Setup

**Objective:** Set up the complete development environment with proper tooling and structure.

**Requirements:**
- Initialize project with npm
- Use existing React 18 app with Vite
- Use existing Express app with JavaScript
- Configure ESLint, Prettier, and Husky pre-commit hooks
- Set up Docker Compose for local development (PostgreSQL 15 + PostGIS 3.4)
- Configure GitHub Actions workflow for CI/CD
- SQL migration setup with raw SQL files

**File Structure:**
```
petbnb/
├── src/
│   ├── client/            # React app
│   └── server/            # Express app
├── migrations/            # SQL migration files
├── scripts/               # Build and utility scripts
├── public/                # Static assets
├── docker-compose.yml     # Local development services
├── package.json           # Root package.json
└── vite.config.ts         # Vite configuration
```

**Validation Criteria:**
- `npm run dev` starts both frontend and backend
- `npm run test` runs all tests
- `npm run lint` enforces code standards
- `npm run migrate` runs SQL migrations successfully
- Docker containers start without errors
- PostGIS extensions are properly installed

### 2. Basic Data Models (No Authentication)

**Objective:** Create essential data models for sitters without authentication requirements.

**Backend Requirements:**
- Basic sitter profile model without user association
- Simplified sitter creation for demo purposes
- No authentication or protected routes
- Focus on search and display functionality

**Note:** The sitter model is defined in SQL in the Core Database Schema section above. We're using a SQL-first approach without an ORM.

**Validation Criteria:**
- Sitter profiles can be created without authentication
- All sitter data is publicly viewable
- Search functionality works without login
- Demo/seed data can be easily loaded

### 3. UI Component Library

**Objective:** Create reusable, accessible UI components with consistent design system.

**Required Components:**
```typescript
// Core Components
Button: { variant: 'primary' | 'secondary' | 'outline', size: 'sm' | 'md' | 'lg', loading?: boolean }
Input: { type: 'text' | 'email' | 'password' | 'search', error?: string, label?: string }
Card: { children: ReactNode, className?: string }
Modal: { isOpen: boolean, onClose: () => void, children: ReactNode }
Spinner: { size: 'sm' | 'md' | 'lg' }

// Form Components
FormField: { label: string, error?: string, required?: boolean, children: ReactNode }
DatePicker: { value?: Date, onChange: (date: Date) => void, placeholder?: string }
Select: { options: Array<{value: string, label: string}>, value?: string, onChange: (value: string) => void }

// Layout Components
Container: { children: ReactNode, maxWidth?: 'sm' | 'md' | 'lg' | 'xl' }
Grid: { cols: number, gap?: 'sm' | 'md' | 'lg', children: ReactNode }
```

**Design System:**
- Plain CSS with BEM naming convention
- Color palette: Primary blue (#2563eb), Secondary gray (#6b7280), Success green (#059669), Error red (#dc2626)
- Typography scale: .text-sm (0.875rem), .text-base (1rem), .text-lg (1.125rem), .text-xl (1.25rem), .text-2xl (1.5rem)
- Spacing scale: CSS variables --spacing-2 (0.5rem), --spacing-4 (1rem), --spacing-6 (1.5rem), --spacing-8 (2rem)
- Border radius: --radius-md (6px) for most components
- Shadow levels: .shadow-sm, .shadow-md, .shadow-lg using box-shadow

**Validation Criteria:**
- All components render without errors
- Components support required props and variants
- Accessibility attributes (ARIA labels, keyboard navigation)
- Components work on mobile and desktop viewports
- Storybook documentation for each component

### 4. Landing Page with Search

**Objective:** Create compelling landing page with integrated search functionality.

**Page Structure:**
```typescript
// Hero Section
- Large background image or gradient
- Main headline: "Find trusted pet care in your neighborhood"
- Subtitle explaining the service
- Integrated search form (prominent placement)

// Search Form Fields
- Location input with Mapbox Places autocomplete
- Date range picker (Check-in / Check-out dates)
- Pet type selector (Dog, Cat, Other)
- Number of pets counter
- Service type dropdown (Boarding, House Sitting, Drop-in Visits, Day Care, Dog Walking)
- Search button

// Features Section
- Grid of 3-4 key value propositions
- Icons with titles and descriptions
- "Background-checked sitters", "Lower fees", "24/7 support"

// Call-to-Action Section
- Encourage sitter registration
- Benefits of becoming a sitter
- "Get Started" button
```

**Mapbox Places Integration:**
- Autocomplete suggestions for location input using Mapbox Geocoding API
- Restrict results to US locations with country filter
- Handle API errors gracefully with fallback messaging
- Debounce input to avoid excessive API calls (300ms delay)
- Cache recent searches to reduce API usage

**Technical Implementation:**
```typescript
// Mapbox geocoding service
import mapboxgl from 'mapbox-gl';

const mapboxClient = mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

export class MapboxGeocodingService {
  async searchPlaces(query: string, options?: {
    country?: string;
    types?: string[];
    proximity?: [number, number];
  }): Promise<MapboxFeature[]> {
    const params = new URLSearchParams({
      q: query,
      access_token: process.env.MAPBOX_TOKEN!,
      country: options?.country || 'us',
      types: options?.types?.join(',') || 'place,locality,neighborhood',
      limit: '5'
    });

    if (options?.proximity) {
      params.append('proximity', options.proximity.join(','));
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features;
  }

  async reverseGeocode(longitude: number, latitude: number): Promise<MapboxFeature | null> {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.MAPBOX_TOKEN}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features[0] || null;
  }
}
```

**Search Form Behavior:**
- Real-time validation with error messages
- Full URL state management for all search parameters:
  - location, checkIn, checkOut (basic search)
  - petType, petCount, serviceType (pet details)
  - petSize, specialNeeds[] (advanced filters)
  - priceMin, priceMax (price range)
  - services[] (service types)
  - sort (distance/price/rating)
- Navigate to search results page on submit with all params in URL
- Mobile-responsive design with proper touch targets

**Validation Criteria:**
- Landing page loads under 3 seconds
- Search form submits successfully with valid data
- Mapbox Places autocomplete works reliably
- Page is fully responsive on mobile devices
- SEO meta tags and structured data implemented

### 5. Sitter Profile Creation

**Objective:** Multi-step onboarding flow for sitters to create complete profiles.

**Onboarding Steps:**
```typescript
Step 1: Basic Information
- Bio (min 50 characters, max 500)
- Pet care experience description
- Hourly rate ($10-$200 range)

Step 2: Location & Service Area
- Full address input with Mapbox Places autocomplete
- Service radius slider (1-25 miles)
- Automatic geocoding to lat/lng coordinates using Mapbox

Step 3: Pet Preferences
- Checkboxes for pet types (Dogs, Cats, Other pets)
- Maximum number of pets accepted
- Special needs capabilities (Senior pets, Medication, etc.)

Step 4: Home Features
- Fenced yard availability
- Other pets in home
- Smoke-free environment
- Additional amenities

Step 5: Profile Photo
- Select from placeholder image options
- Preview selected placeholder
- Option to use custom URL (for demo purposes)
```

**Technical Requirements:**
- Multi-step form with progress indicator
- Form state persistence between steps
- Back/Next navigation with validation
- Final step saves complete profile to database
- Address geocoding using Mapbox Geocoding API
- Placeholder image selection (no file upload in Phase 1)

**Mapbox Integration for Address Input:**
```typescript
// Address geocoding service
export class AddressGeocodingService {
  constructor(private mapboxService: MapboxGeocodingService) {}

  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const features = await this.mapboxService.searchPlaces(address, {
        country: 'us',
        types: ['address', 'place']
      });

      if (features.length === 0) {
        throw new Error('No results found for address');
      }

      const feature = features[0];
      const [longitude, latitude] = feature.center;
      
      return {
        latitude,
        longitude,
        formattedAddress: feature.place_name,
        city: this.extractContext(feature, 'place'),
        state: this.extractContext(feature, 'region'),
        zipCode: this.extractContext(feature, 'postcode'),
      };
    } catch (error) {
      throw new BadRequestException(`Address geocoding failed: ${error.message}`);
    }
  }

  private extractContext(feature: MapboxFeature, type: string): string {
    const context = feature.context?.find(ctx => ctx.id.startsWith(type));
    return context?.text || '';
  }
}
```

**Form Validation:**
- Required field validation on each step
- Real-time error display
- Prevent progression with invalid data
- Final validation before profile creation
- Address validation through successful geocoding

**Validation Criteria:**
- Complete onboarding flow works end-to-end
- Profile data saves correctly to database
- Placeholder image selection works correctly
- Address geocoding returns valid coordinates using Mapbox
- Form handles errors gracefully

### 6. Search Results & Sitter Listings with Interactive Map

**Objective:** Display search results with filtering, basic sitter information, and interactive map view.

**Search Results Page Layout:**
```typescript
// Header Section
- Search location and parameters display
- Results count ("X sitters found in [location]")
- View toggle buttons (List/Map - with full map implementation)
- Sort dropdown (Distance, Price, Rating)

// Map View (Toggle Option)
- Interactive Mapbox GL JS map
- Sitter location pins with clustering for 50+ results
- Pin hover shows mini profile (photo, name, hourly rate)
- Click pin to highlight corresponding card in list
- Split-screen on desktop (60% map, 40% list)
- Full-screen map on mobile with bottom sheet for results
- "Search this area" button when map is panned
- Privacy offset of ±400ft applied to all pin locations

// List View (Default)
- Responsive grid layout (1 col mobile, 2-3 cols tablet, 4 cols desktop)
- Each card shows: 
  - Profile photo
  - Name
  - Distance badge
  - Hourly rate
  - ★ Rating with count (mock data in Phase 1)
  - Response time badge (e.g., "Responds in ~1 hour" - mock data in Phase 1)
  - Repeat-client % indicator (e.g., "85% repeat clients" - mock data in Phase 1)
  - Bio preview (first 100 chars)
  - Pet type icons accepted
- Click to view detailed profile

// No Results State
- Helpful message when no sitters found
- Suggestions to expand search radius
- Link to browse all sitters
```

**Search Backend API:**
```typescript
GET /search/sitters
Query Parameters:
- location: string (required)
- checkIn: ISO date string (required)
- checkOut: ISO date string (required)
- petType: 'dog' | 'cat' | 'other' (required)
- petCount: number (required)
- serviceType: string (required)
- petSize: 'xs' | 's' | 'm' | 'l' | 'xl' (optional)
- specialNeeds: string[] (optional, e.g., ['senior', 'medication'])
- services: string[] (optional, service types)
- priceMin: number (optional)
- priceMax: number (optional)
- radius: number (optional, default 10 miles)
- sort: 'distance' | 'price' | 'rating' (optional, default 'distance')

Response:
{
  sitters: SitterProfile[],
  total: number,
  searchLocation: { latitude, longitude, formattedAddress }
}
```

**Backend Implementation with Mapbox:**
```typescript
// Search service with Mapbox geocoding (JavaScript/Express)
class SearchService {
  constructor(db, mapboxService) {
    this.db = db;
    this.mapboxService = mapboxService;
  }

  async findSitters(query) {
    // Geocode the search location using Mapbox
    const features = await this.mapboxService.searchPlaces(query.location, {
      country: 'us',
      types: ['place', 'locality', 'neighborhood']
    });

    if (features.length === 0) {
      throw new Error('Location not found');
    }

    const searchFeature = features[0];
    const [searchLng, searchLat] = searchFeature.center;
    
    // Find sitters within radius using PostGIS spatial functions
    const result = await this.db.query(`
      SELECT sp.*,
        ST_Distance(
          sp.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 AS distance_km
      FROM sitter_profiles sp
      WHERE sp.is_active = true
      AND (
        ($3 = 'dog' AND sp.accepts_dogs = true) OR
        ($3 = 'cat' AND sp.accepts_cats = true) OR
        ($3 = 'other' AND sp.accepts_other_pets = true)
      )
      AND ST_DWithin(
        sp.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $4 * 1609.34  -- Convert miles to meters
      )
      ORDER BY distance_km ASC
      LIMIT 50
    `, [searchLng, searchLat, query.petType, query.radius || 10]);

    return {
      sitters: result.rows,
      total: result.rows.length,
      searchLocation: {
        latitude: searchLat,
        longitude: searchLng,
        formattedAddress: searchFeature.place_name
      },
    };
  }
}
```

**Distance Calculation:**
- Use PostGIS spatial functions for accurate distance calculation
- ST_Distance for precise geographic measurements
- ST_DWithin for efficient radius filtering with spatial index
- Raw SQL query for optimal performance
- Sort by distance as default

**Validation Criteria:**
- Search returns relevant results based on location
- Distance calculations are accurate
- Results page loads under 2 seconds
- Responsive design works on all devices
- Empty states handled gracefully

### 7. Sitter Detail Pages

**Objective:** Comprehensive sitter profile pages with booking preparation.

**Profile Page Sections:**
```typescript
// Header Section
- Large profile photo
- Sitter name and location
- Star rating placeholder (for Phase 4)
- Response time badge
- Hourly rate prominently displayed

// About Section
- Full bio text
- Pet care experience details
- Services offered list
- Home features and amenities

// Location Section
- Service area map (basic implementation)
- Distance from search location
- General area description (no exact address)

// Availability Section
- Calendar placeholder (for Phase 3)
- "Request Booking" button (for Phase 3)

// Reviews Section
- Placeholder for review system (Phase 4)
- "No reviews yet" message for new sitters
```

**Technical Implementation:**
- Dynamic routing with sitter ID parameter
- SEO-friendly URLs (e.g., /sitters/john-doe-seattle)
- Social media meta tags for sharing
- Breadcrumb navigation
- Mobile-optimized layout

**Validation Criteria:**
- Profile pages load successfully for all sitters
- All profile information displays correctly
- Page is SEO optimized with proper meta tags
- Mobile experience is fully functional
- Navigation works seamlessly

---

## Seed Data Generation

### Objective
Create realistic test data for validating search functionality, user flows, and UI components during development and testing.

### Database Seeding Strategy

**Location Strategy:**
- 10 sitters in Seattle metro area (coordinates: 47.6062° N, 122.3321° W)
- 10 sitters in Austin metro area (coordinates: 30.2672° N, 97.7431° W)
- Distribute sitters within 15-mile radius of city centers
- 10 pet owners split between both cities (5 each)

### Seed Data Files

The seed data has been organized into separate artifacts for better maintainability:

- **Sitter Seed Data**: Contains 20 detailed sitter profiles (10 Seattle, 10 Austin) with realistic bios, experience, pricing, and location data
- **Owner Seed Data**: Contains 10 pet owner profiles with associated pet information for testing search scenarios
- **Seed Script**: Main seeding script that imports data and populates the database

### Package.json Script

```json
{
  "scripts": {
    "db:seed": "node scripts/seed.js"
  }
}
```

### Seed Data Validation

**Geographic Distribution:**
- Seattle area: 10 sitters within 15-mile radius of downtown Seattle
- Austin area: 10 sitters within 15-mile radius of downtown Austin
- Realistic addresses and coordinates for each location
- Service radius variety (7-25 miles) to ensure search overlap

**Service Variety:**
- Mix of dog-only, cat-only, and multi-pet sitters
- Different specializations (training, medical care, adventure, behavioral)
- Hourly rates ranging from $25-$45 to test price sorting
- Various home features (fenced yards, other pets, smoke-free)

**Owner Diversity:**
- Single pet and multi-pet households
- Different pet types (dogs, cats, rabbit)
- Various special needs (senior care, medication, reactive pets, puppies)
- Different service preferences to test search filtering

**Testing Scenarios Enabled:**
1. Location-based search (Seattle vs Austin results)
2. Pet type filtering (dog-only, cat-only, mixed)
3. Special needs matching
4. Price range and sorting validation
5. Service radius testing
6. Multi-pet household scenarios
7. Distance calculation verification

**Login Credentials:**
- All users have password: `password123`
- Email addresses follow pattern: `firstname.lastname@email.com`
- Can be used for testing authentication and user flows

------

## API Documentation (Phase 1 - No Authentication)

### Sitter Profile Endpoints
```typescript
POST /sitters                 # Create new sitter profile (public)
GET /sitters/:id              # Get sitter profile by ID
PUT /sitters/:id              # Update sitter profile (public for demo)
```

### Search Endpoints
```typescript
GET /search/sitters           # Search for sitters by location
GET /search/locations         # Mapbox Places autocomplete proxy
```

### Static Assets
```typescript
GET /images/placeholder.jpg   # Placeholder profile images
```

---

## Testing Requirements

### Testing Philosophy
All tests must validate the actual implementation without mocking core business logic. Tests should use real database connections, actual API calls, and genuine user interactions to ensure the system works as intended in production.

### Test Database Setup
```javascript
// test/setup/database.js
const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_TEST_URL || 'postgresql://test:test@localhost:5433/petbnb_test'
});

async function setupTestDatabase() {
  // Reset test database to clean state
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  
  // Enable PostGIS
  await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
  
  // Run SQL migrations
  const migrationsDir = path.join(__dirname, '../../migrations');
  const migrations = fs.readdirSync(migrationsDir).sort();
  
  for (const migration of migrations) {
    const sql = fs.readFileSync(path.join(migrationsDir, migration), 'utf8');
    await pool.query(sql);
  }
  
  // Seed with minimal test data
  await seedTestData();
}

async function cleanupTestDatabase() {
  await pool.query('DELETE FROM sitter_profiles');
}

module.exports = { pool as testDb, setupTestDatabase, cleanupTestDatabase };
```

### Unit Tests (No Mocking of Business Logic)

#### 1. Authentication Service Tests
**File:** `apps/backend/src/auth/auth.service.spec.ts`

**Dependencies:**
- Real test database with User table
- bcrypt for actual password hashing
- JWT library for token generation
- Real PostgreSQL client with node-postgres (no mocking)

**Test Implementation:**
```typescript
describe('AuthService Integration Tests', () => {
  let authService: AuthService;
  let userService: UserService;
  
  beforeEach(async () => {
    await setupTestDatabase();
    // Use real services with test database
    authService = new AuthService(testDb);
    userService = new UserService(testDb);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('register', () => {
    it('should create user with hashed password in database', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER' as const
      };

      const result = await authService.register(userData);

      // Verify user exists in database
      const result = await testDb.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      const dbUser = result.rows[0];
      
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe(userData.email);
      expect(dbUser.password).not.toBe(userData.password); // Should be hashed
      expect(await bcrypt.compare(userData.password, dbUser.password)).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe(dbUser.id);
    });

    it('should reject duplicate email addresses', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER' as const
      };

      await authService.register(userData);

      await expect(authService.register(userData))
        .rejects
        .toThrow(/email already exists/i);
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials and return JWT', async () => {
      // Create user first
      const userData = {
        email: 'login@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'SITTER' as const
      };
      
      await authService.register(userData);

      const result = await authService.login({
        email: userData.email,
        password: userData.password
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.role).toBe('SITTER');
      
      // Verify JWT is valid
      const jwtService = new JwtService({ secret: process.env.JWT_SECRET });
      const decoded = await jwtService.verifyAsync(result.accessToken);
      expect(decoded.sub).toBe(result.user.id);
    });

    it('should reject invalid credentials', async () => {
      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow(/invalid credentials/i);
    });
  });
});
```

#### 2. Sitter Profile Service Tests
**File:** `apps/backend/src/sitters/sitter-profile.service.spec.ts`

**Dependencies:**
- Real test database with User and SitterProfile tables
- Mapbox API (test API key in environment)
- Real geocoding service (no mocking)
- Seeded test users

**Test Implementation:**
- Create real Mapbox geocoding service (no mocking)
- Test profile creation with actual address geocoding
- Verify coordinates are correctly stored in database
- Test error handling for invalid addresses
- Test Mapbox API rate limiting scenarios

#### 3. Search Service Tests
**File:** `apps/backend/src/search/search.service.spec.ts`

**Dependencies:**
- Real test database with seeded sitter data
- Mapbox API for geocoding search locations
- Real distance calculations using PostGIS or Haversine formula
- Complete sitter profiles with actual coordinates

**Test Implementation:**
- Create real Mapbox geocoding service and database
- Test search with actual distance calculations
- Verify location-based filtering (Seattle vs Austin)
- Test pet type preferences filtering
- Test various location format handling
- Test Mapbox API error scenarios

### Integration Tests (Full System Testing)

#### 4. Authentication API Tests
**File:** `apps/backend/test/auth.e2e-spec.ts`

**Dependencies:**
- Running NestJS application with test database
- Real HTTP requests using Supertest
- Actual database transactions
- JWT token validation

**Test Implementation:**
- Complete authentication flow testing with real JWT tokens
- User registration with actual password hashing and database writes
- Login validation with real credential verification
- Protected route testing with actual authorization middleware
- Form validation testing with real error responses

#### 5. Sitter Profile API Tests
**File:** `apps/backend/test/sitter-profile.e2e-spec.ts`

**Dependencies:**
- Running application with Google Maps API
- Real geocoding service calls
- Authenticated user tokens
- File upload testing capability

**Test Implementation:**
- Complete sitter profile creation with real Mapbox geocoding
- Image upload testing with actual file processing
- Address validation with real coordinate verification
- Protected routes requiring valid authentication
- Form validation testing with real error handling

#### 6. Search API Tests
**File:** `apps/backend/test/search.e2e-spec.ts`

**Dependencies:**
- Seeded database with actual sitter profiles
- Real geocoding for search locations
- Complete sitter data with varied attributes

**Test Implementation:**
- Complete search functionality with real database and Mapbox integration
- Location-based filtering with actual distance calculations
- Pet type and service preference filtering
- Sort functionality validation
- Empty state and error handling
- API parameter validation

### End-to-End Tests (Complete User Workflows)

#### 7. Complete User Registration and Sitter Onboarding Flow
**File:** `apps/frontend/e2e/sitter-onboarding.spec.ts`

**Dependencies:**
- Running frontend and backend applications
- Real browser automation with Playwright
- Actual form submissions and database writes
- Google Places API integration
- File upload functionality

**Test Implementation:**
- Complete sitter onboarding flow with real browser automation
- Multi-step form progression with actual validation
- Real Mapbox Places autocomplete integration
- File upload testing with actual images
- Database verification of profile creation
- User interface validation at each step

#### 8. Complete Search and Discovery Flow
**File:** `apps/frontend/e2e/search-flow.spec.ts`

**Dependencies:**
- Seeded database with real sitter profiles
- Running frontend and backend
- Real geocoding and distance calculations

**Test Implementation:**
- Complete search flow from landing page to sitter details
- Real search form submission with Mapbox integration
- Filter and sort functionality testing
- Sitter card interaction and navigation
- No results state validation
- URL state management verification

### Test Dependencies and Setup Requirements

#### Required Test Infrastructure
```typescript
// test/global-setup.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalSetup() {
  // Start test database container
  await execAsync('docker-compose -f docker-compose.test.yml up -d postgres-test');
  
  // Wait for database to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Run database migrations
  // SQL migrations are run in setupTestDatabase function
  
  console.log('Test environment ready');
}

// test/global-teardown.ts
export default async function globalTeardown() {
  await execAsync('docker-compose -f docker-compose.test.yml down');
  console.log('Test environment cleaned up');
}
```

#### Docker Test Configuration
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: petbnb_test
    ports:
      - "5433:5433"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data

  # Redis not needed for Phase 1

volumes:
  postgres_test_data:
```

#### Test Environment Variables
```env
# .env.test
DATABASE_TEST_URL="postgresql://test:test@localhost:5433/petbnb_test"
# REDIS_TEST_URL not needed for Phase 1
MAPBOX_ACCESS_TOKEN="your-test-mapbox-token"
JWT_SECRET="test-jwt-secret-key"
UPLOAD_DIR="./test-uploads"
```

### Test Execution Strategy

**Local Development:**
```bash
# Start test environment
pnpm test:setup

# Run unit tests (fast feedback)
pnpm test:unit

# Run integration tests (database + API)
pnpm test:integration

# Run e2e tests (full browser automation)
pnpm test:e2e

# Run all tests
pnpm test

# Cleanup test environment
pnpm test:teardown
```

**CI/CD Pipeline:**
- All tests run against real dependencies (database, APIs)
- No mocking of core business logic
- Tests must pass with actual Mapbox API calls
- Database state is reset between test suites
- File uploads tested with real files
- All user interactions tested through real browser automation

This comprehensive testing approach ensures that the implementation actually works as specified and that all integrations function correctly in a production-like environment.

---

## Performance Requirements

### Frontend Performance
- Initial page load under 3 seconds on 3G
- First contentful paint under 1.5 seconds
- Bundle size under 500KB gzipped
- Lighthouse score above 90 for performance

### Backend Performance
- API response times under 200ms for simple queries
- Search queries under 500ms with 1000+ sitters
- Database queries optimized with proper indexing
- Rate limiting to prevent abuse

### Database Optimization
- Indexes on frequently queried fields (location, userId, etc.)
- Connection pooling for concurrent requests
- Query optimization for distance calculations
- Regular VACUUM and ANALYZE for PostgreSQL

---

## Security Implementation

### Authentication Security
- JWT tokens with reasonable expiration (24 hours)
- Secure password hashing with bcrypt (12+ rounds)
- Input validation on all endpoints
- CORS configuration for frontend domain

### Data Protection
- SQL injection prevention with Prisma ORM
- XSS protection with input sanitization
- CSRF protection for state-changing operations
- Secure headers with Helmet middleware

### File Upload Security
- File type validation beyond extension checking
- Virus scanning integration ready
- Directory traversal prevention
- Size limits and rate limiting

---

## Deployment Configuration

### Environment Setup
- Development, staging, and production environments
- Environment-specific configuration management
- Secrets management with Azure Key Vault integration
- Database migration strategy

### Monitoring and Logging
- Application performance monitoring setup
- Error tracking and alerting
- User activity logging (GDPR compliant)
- Infrastructure monitoring readiness

### Backup and Recovery
- Automated database backups
- File storage backup strategy
- Disaster recovery procedures
- Data retention policies

This implementation plan provides the detailed specifications needed for a coding agent to build Phase 1 with minimal ambiguity while maintaining focus on the essential functionality required for a working MVP.

---

## Outstanding Issues and Clarifications Needed

### 1. **Inconsistent Technology References** ✅ RESOLVED
- **Issue**: Plan mentions pnpm workspaces (line 31) but we decided to keep simple structure without workspaces
- **Issue**: Plan references Prisma in multiple places (lines 171-217, 542, 817-847, 859, 1096, 1209) despite choosing SQL-first approach
- **Issue**: Plan mentions React 19 and Express 5 in task requirements (lines 131-132) but we're using React 18 and current Express
- **Resolution**: Updated all references to match our technology decisions

### 2. **Authentication Confusion** ✅ RESOLVED
- **Issue**: Phase 1 is supposed to be logged-out only, but API documentation includes auth endpoints (lines 772-778)
- **Issue**: File upload endpoint requires authentication (line 667, 803) but Phase 1 has no auth
- **Issue**: Sitter profile endpoints show as protected (lines 789-792) but Phase 1 has no auth
- **Resolution**: Removed all authentication endpoints and protection requirements

### 3. **File Upload Without Authentication** ✅ RESOLVED
- **Issue**: Plan includes file upload system (Task 8, lines 658-699) but requires authentication
- **Issue**: We decided to use placeholder images, so is file upload needed at all?
- **Resolution**: Removed entire file upload task, updated profile creation to use placeholder images

### 4. **Mapbox Token Environment Variable** ✅ RESOLVED
- **Issue**: Code examples use `process.env.MAPBOX_ACCESS_TOKEN` (lines 307, 317, 341) but we decided to keep `MAPBOX_TOKEN`
- **Resolution**: Already updated all code examples to use MAPBOX_TOKEN

### 5. **Database Schema Format Confusion** ✅ RESOLVED
- **Issue**: SQL schema is shown correctly (lines 41-100) but then Prisma schema appears again (lines 171-217)
- **Resolution**: Already removed Prisma schema and replaced with note about SQL-first approach

### 6. **Search Service Implementation Issues** ✅ RESOLVED
- **Issue**: Search service example uses Prisma and joins with users table (lines 537-594) but Phase 1 has no users table
- **Issue**: SQL query references `sp.userId` and joins with `users` table that doesn't exist
- **Resolution**: Already updated to JavaScript/SQL without user table joins

### 7. **Test Setup Inconsistencies** ✅ RESOLVED
- **Issue**: Test setup references Prisma migrations (lines 834-836, 1096) but we're using SQL migrations
- **Issue**: Test code uses Prisma client extensively despite SQL-first approach
- **Issue**: Redis mentioned in test setup (line 1089, 1124) but not needed for Phase 1
- **Resolution**: Updated all test examples to use node-postgres, removed Redis references

### 8. **Design System Contradiction** ✅ RESOLVED
- **Issue**: UI Component Library section mentions "Tailwind CSS utility classes" (line 250) but we're using plain CSS
- **Resolution**: Updated design system to use plain CSS with BEM naming and CSS variables

### 9. **API Endpoint Confusion** ✅ RESOLVED
- **Issue**: Search endpoints reference "Google Places proxy" (line 798) but we're using Mapbox
- **Resolution**: Already updated to reference Mapbox Places autocomplete proxy

### 10. **Missing Sitter Creation Endpoint** ✅ RESOLVED
- **Issue**: We need a way to create sitter profiles without authentication, but no clear endpoint is defined
- **Resolution**: Already added `POST /sitters` as a public endpoint in API documentation

---

### Summary

All 10 outstanding issues have been resolved. The implementation plan is now internally consistent and ready for implementation with:
- Simplified technology stack (React 18, JavaScript Express, SQL-first approach)
- No authentication in Phase 1 (logged-out functionality only)
- Placeholder images instead of file uploads
- Consistent use of Mapbox for all location services
- Clear API endpoints for public sitter management
- Test setup using node-postgres without Redis
- Plain CSS design system

The plan provides a clear path to build Phase 1 with the existing codebase structure and technology choices.
