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
- pnpm workspaces for monorepo management
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
- Initialize monorepo with pnpm workspaces
- Create frontend React 19 app with Vite 6
- Create backend Express 5 app with TypeScript
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

**Simplified Sitter Model:**
```prisma
model SitterProfile {
  id          String   @id @default(cuid())
  
  // Basic info (no user association in Phase 1)
  firstName   String
  lastName    String
  email       String   @unique
  phone       String?
  profilePicture String?
  
  bio         String?
  experience  String?
  serviceRadius Int     @default(10) // miles
  hourlyRate  Decimal  @db.Decimal(10,2)
  
  // Mock data fields for Phase 1 visual appeal
  mockRating    Decimal  @default(4.5) @db.Decimal(2,1)
  mockReviewCount Int    @default(12)
  mockResponseTime String @default("1 hour")
  mockRepeatClientPercent Int @default(85)
  
  // Location with PostGIS
  address     String
  city        String
  state       String
  zipCode     String
  latitude    Decimal  @db.Decimal(10,8)
  longitude   Decimal  @db.Decimal(11,8)
  location    Unsupported("geometry(Point, 4326)")?
  
  // Services
  acceptsDogs     Boolean @default(true)
  acceptsCats     Boolean @default(true)
  acceptsOtherPets Boolean @default(false)
  
  // Home features
  hasFencedYard   Boolean @default(false)
  hasOtherPets    Boolean @default(false)
  isSmokeFree     Boolean @default(true)
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("sitter_profiles")
}
```

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
- Tailwind CSS utility classes
- Color palette: Primary blue (#2563eb), Secondary gray (#6b7280), Success green (#059669), Error red (#dc2626)
- Typography scale: text-sm, text-base, text-lg, text-xl, text-2xl
- Spacing scale: 0.5rem increments (p-2, p-4, p-6, p-8)
- Border radius: rounded-md (6px) for most components
- Shadow levels: shadow-sm, shadow-md, shadow-lg

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

const mapboxClient = mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;

export class MapboxGeocodingService {
  async searchPlaces(query: string, options?: {
    country?: string;
    types?: string[];
    proximity?: [number, number];
  }): Promise<MapboxFeature[]> {
    const params = new URLSearchParams({
      q: query,
      access_token: process.env.MAPBOX_ACCESS_TOKEN!,
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
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
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
- Image upload with preview
- File validation (max 5MB, image types only)
- Automatic resizing to standard dimensions
```

**Technical Requirements:**
- Multi-step form with progress indicator
- Form state persistence between steps
- Back/Next navigation with validation
- Final step saves complete profile to database
- Address geocoding using Mapbox Geocoding API
- Image upload with local file storage (Phase 1)

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
- Image upload processes successfully
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
// Search service with Mapbox geocoding
@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private mapboxService: MapboxGeocodingService
  ) {}

  async findSitters(query: SearchSittersDto) {
    // Geocode the search location using Mapbox
    const features = await this.mapboxService.searchPlaces(query.location, {
      country: 'us',
      types: ['place', 'locality', 'neighborhood']
    });

    if (features.length === 0) {
      throw new BadRequestException('Location not found');
    }

    const searchFeature = features[0];
    const [searchLng, searchLat] = searchFeature.center;
    
    // Find sitters within radius using PostGIS spatial functions
    const sitters = await this.prisma.$queryRaw`
      SELECT sp.*, u.firstName, u.lastName, u.profilePicture,
        ST_Distance(
          sp.location::geography,
          ST_SetSRID(ST_MakePoint(${searchLng}, ${searchLat}), 4326)::geography
        ) / 1000 AS distance_km
      FROM sitter_profiles sp
      JOIN users u ON sp.userId = u.id
      WHERE sp.isActive = true
      AND (
        (${query.petType} = 'dog' AND sp.acceptsDogs = true) OR
        (${query.petType} = 'cat' AND sp.acceptsCats = true) OR
        (${query.petType} = 'other' AND sp.acceptsOtherPets = true)
      )
      AND ST_DWithin(
        sp.location::geography,
        ST_SetSRID(ST_MakePoint(${searchLng}, ${searchLat}), 4326)::geography,
        ${query.radius} * 1609.34  -- Convert miles to meters
      )
      ORDER BY distance_km ASC
      LIMIT 50
    `;

    return {
      sitters,
      total: sitters.length,
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

### 8. File Upload System

**Objective:** Secure file upload for profile pictures with proper validation.

**Backend Upload Service:**
```typescript
// Upload endpoint
POST /upload/profile-picture
- Multipart form data with image file
- User authentication required
- File validation (type, size, dimensions)
- Local file storage with organized directory structure
- Return public URL for saved image

// File validation rules
- Allowed types: JPEG, PNG, WebP
- Maximum size: 5MB
- Automatic resizing to standard dimensions (400x400)
- Unique filename generation to prevent conflicts
```

**Frontend Upload Component:**
- Drag and drop file selection
- Click to browse file picker
- Image preview before upload
- Upload progress indicator
- Error handling for failed uploads
- Integration with profile creation form

**Security Considerations:**
- File type validation on both client and server
- Virus scanning (basic implementation)
- Prevent script file uploads
- Rate limiting on upload endpoints
- Proper CORS configuration

**Validation Criteria:**
- Images upload successfully and display correctly
- File validation prevents malicious uploads
- Upload progress provides user feedback
- Error messages are clear and helpful
- Uploaded images are properly sized and optimized

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
    "db:seed": "tsx prisma/seed.ts"
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

## API Documentation

### Authentication Endpoints
```typescript
POST /auth/register
POST /auth/login
GET /auth/profile (Protected)
POST /auth/logout (Protected)
```

### User Management Endpoints
```typescript
GET /users/profile (Protected)
PUT /users/profile (Protected)
POST /users/become-sitter (Protected)
```

### Sitter Profile Endpoints
```typescript
POST /sitters/profile (Protected, Sitter role)
GET /sitters/:id
PUT /sitters/profile (Protected, Sitter role)
GET /sitters/dashboard (Protected, Sitter role)
```

### Search Endpoints
```typescript
GET /search/sitters
GET /search/locations (Google Places proxy)
```

### Upload Endpoints
```typescript
POST /upload/profile-picture (Protected)
GET /uploads/:filename (Public static files)
```

---

## Testing Requirements

### Testing Philosophy
All tests must validate the actual implementation without mocking core business logic. Tests should use real database connections, actual API calls, and genuine user interactions to ensure the system works as intended in production.

### Test Database Setup
```typescript
// test/setup/database.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL || 'postgresql://test:test@localhost:5433/petbnb_test'
    }
  }
});

export async function setupTestDatabase() {
  // Reset test database to clean state
  await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
  await prisma.$executeRaw`CREATE SCHEMA public`;
  
  // Run migrations
  execSync('npx prisma migrate deploy', { 
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_TEST_URL }
  });
  
  // Seed with minimal test data
  await seedTestData();
}

export async function cleanupTestDatabase() {
  await prisma.sitterProfile.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma as testDb };
```

### Unit Tests (No Mocking of Business Logic)

#### 1. Authentication Service Tests
**File:** `apps/backend/src/auth/auth.service.spec.ts`

**Dependencies:**
- Real test database with User table
- bcrypt for actual password hashing
- JWT library for token generation
- Real Prisma client (no mocking)

**Test Implementation:**
```typescript
describe('AuthService Integration Tests', () => {
  let authService: AuthService;
  let userService: UserService;
  
  beforeEach(async () => {
    await setupTestDatabase();
    // Use real services with test database
    authService = new AuthService(testDb, new JwtService({}));
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
      const dbUser = await testDb.user.findUnique({ 
        where: { email: userData.email } 
      });
      
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
  await execAsync('docker-compose -f docker-compose.test.yml up -d postgres-test redis-test');
  
  // Wait for database to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Run database migrations
  process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
  await execAsync('npx prisma migrate deploy');
  
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

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"

volumes:
  postgres_test_data:
```

#### Test Environment Variables
```env
# .env.test
DATABASE_TEST_URL="postgresql://test:test@localhost:5433/petbnb_test"
REDIS_TEST_URL="redis://localhost:6380"
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

## Outstanding Issues Between PRD and Implementation Plan

### 1. **Map/Location Service Provider Inconsistency** ✅ RESOLVED
- **PRD**: References "Google Places autocomplete" (line 63)
- **Implementation**: Uses Mapbox throughout (Mapbox Places, Mapbox Geocoding API, Mapbox GL JS)
- **Resolution**: Updated PRD to use Mapbox Places for consistency

### 2. **Map Implementation Timeline** ✅ RESOLVED
- **PRD**: Interactive map is part of Phase 1 with detailed requirements (toggle, clustering, heat maps, privacy offset)
- **Implementation**: Defers all map functionality to Phase 2, only includes toggle buttons as placeholders
- **Resolution**: Updated implementation plan to include full map functionality in Phase 1

### 3. **Database Technology** ✅ RESOLVED
- **PRD**: Implies PostGIS usage in CLAUDE.md but not explicitly in PRD
- **Implementation**: Uses standard PostgreSQL with Prisma ORM and Haversine formula instead of PostGIS spatial functions
- **Resolution**: Updated implementation to use PostGIS for all spatial operations

### 4. **Authentication Scope in Phase 1** ✅ RESOLVED
- **PRD**: Focuses on logged-out user stories (LO-US-01, LO-US-02, LO-US-03) for Phase 1
- **Implementation**: Includes full authentication system with JWT, registration, and login
- **Resolution**: Removed authentication from Phase 1, focusing on logged-out functionality only

### 5. **Search Algorithm Complexity** ✅ RESOLVED
- **PRD**: Specifies complex ranking algorithm with multiple factors (distance, rating, availability, response rate, repeat-client %)
- **Implementation**: Only implements simple distance-based search
- **Resolution**: Updated PRD to clarify Phase 1 uses simple distance-based search, complex algorithm deferred to Phase 4

### 6. **Missing PRD Features in Implementation** ✅ RESOLVED
- Response time badges (requires tracking sitter response times)
- Repeat-client % indicators (requires booking history)
- Star ratings (requires review system)
- Service radius overlays on map
- Heat-map density visualization
- Multi-pet pricing structure
- **Resolution**: Added mock data fields for badges/ratings in Phase 1 for visual appeal. Real data implementation deferred to later phases when booking/review systems exist.

### 7. **Technology Stack Alignment** ✅ RESOLVED
- **CLAUDE.md**: Specifies React 19 RC, Express 5 RC, SQL-first approach
- **Implementation Plan**: Uses React 18, NestJS 10, Prisma ORM
- **Resolution**: Updated implementation plan to use CLAUDE.md stack (React 19, Express 5, SQL-first with PostGIS)

### 8. **URL State for Filters** ✅ RESOLVED
- **PRD**: Specifies extended URL state for all filter parameters
- **Implementation**: Mentions URL state but doesn't implement extended filter parameters
- **Resolution**: Updated implementation to include full URL state for all filter parameters

### 9. **Trust & Safety Features** ✅ RESOLVED
- **PRD**: Includes background checks and platform guarantees as core features
- **Implementation**: No trust & safety implementation in Phase 1
- **Resolution**: Updated PRD to clarify Trust & Safety features are Phase 3

### 10. **Business Model Implementation** ✅ RESOLVED
- **PRD**: Details platform fees (15% sitter, 3-5% owner) and payment structure
- **Implementation**: No fee or payment implementation in Phase 1
- **Resolution**: Updated PRD to clarify Booking & Payments are Phase 3

### Summary of Resolutions:

All 10 outstanding issues have been resolved through the following decisions:

1. ✅ **Mapbox** is the chosen location service provider throughout
2. ✅ **Maps included in Phase 1** with full interactive functionality
3. ✅ **PostGIS** for all spatial database operations
4. ✅ **No authentication in Phase 1** - focus on logged-out functionality
5. ✅ **Simple distance-based search** for Phase 1, complex algorithm deferred
6. ✅ **Visual badges with mock data** included for better UI appeal
7. ✅ **CLAUDE.md tech stack** adopted (React 19, Express 5, SQL-first)
8. ✅ **Full URL state** for all filter parameters
9. ✅ **Trust & Safety deferred** to Phase 3
10. ✅ **Payments deferred** to Phase 3

The implementation plan and PRD are now fully aligned with clear phase boundaries and technology choices.

---

## Codebase vs Implementation Plan Differences

After examining the current codebase, the following differences were identified between what the implementation plan assumes and what actually exists:

### 1. **Application Domain Mismatch** ✅ RESOLVED
- **Plan**: PetBnB application for pet sitters and owners
- **Codebase**: Restaurant discovery application with spatial features
- **Resolution**: Replace entire restaurant domain with PetBnB domain model

### 2. **Frontend Technology Stack** ✅ RESOLVED
- **Plan**: React 19 (RC), Zustand, React Hook Form, Tailwind CSS, React Router
- **Codebase**: React 18, SWR for data fetching, plain CSS, no routing (SPA)
- **Resolution**: Keep the simpler existing stack (React 18, SWR, plain CSS)

### 3. **Backend Architecture** ✅ RESOLVED
- **Plan**: Express 5 with TypeScript
- **Codebase**: Express with plain JavaScript (`simplified-server.js`)
- **Resolution**: Keep JavaScript for backend (simpler, no compilation needed)

### 4. **Database Schema** ✅ RESOLVED
- **Plan**: Complex sitter profiles with user authentication
- **Codebase**: Simple restaurants table with PostGIS location
- **Resolution**: Drop existing schema and recreate with PetBnB sitter_profiles table

### 5. **API Endpoints** ✅ RESOLVED
- **Plan**: `/auth/*`, `/sitters/*`, `/search/*` endpoints
- **Codebase**: `/api/restaurants` and `/api/restaurants/nearby` only
- **Resolution**: Create new endpoint files for PetBnB API (keep restaurant code as reference)

### 6. **State Management** ✅ RESOLVED
- **Plan**: Zustand for global state
- **Codebase**: SWR for server state only
- **Resolution**: Use SWR for now, add global state solution later if needed

### 7. **Testing Setup** ✅ RESOLVED
- **Plan**: Separate Jest for API tests
- **Codebase**: Unified Vitest for all tests
- **Resolution**: Keep Vitest for all tests (simpler unified setup)

### 8. **Build Configuration** ✅ RESOLVED
- **Plan**: TypeScript compilation for backend
- **Codebase**: Direct JavaScript execution
- **Resolution**: Keep direct JavaScript execution (no build step needed)

### 9. **Environment Variables** ✅ RESOLVED
- **Plan**: `MAPBOX_ACCESS_TOKEN`
- **Codebase**: `MAPBOX_TOKEN`
- **Resolution**: Keep existing MAPBOX_TOKEN variable name

### 10. **Missing Features in Codebase** ✅ RESOLVED
- No authentication system - **Resolution**: Not needed for Phase 1 (logged-out only)
- No file upload capability - **Resolution**: Use placeholder images for sitter profiles
- No form validation beyond Zod schemas - **Resolution**: Zod is sufficient for Phase 1
- No monorepo structure - **Resolution**: Keep simple structure, no workspaces needed
- No Redis service - **Resolution**: Not needed for Phase 1 (no sessions/caching)

### Summary of Technology Decisions

All 10 codebase differences have been resolved with the following decisions:

1. ✅ **Replace restaurant domain** entirely with PetBnB
2. ✅ **Keep simpler frontend stack** (React 18, SWR, plain CSS)
3. ✅ **Keep JavaScript backend** (no TypeScript compilation)
4. ✅ **Drop and recreate database** with PetBnB schema
5. ✅ **Create new API endpoints** alongside existing code
6. ✅ **Use SWR only** for now, add global state if needed
7. ✅ **Keep Vitest** for all testing
8. ✅ **No build step** for backend JavaScript
9. ✅ **Keep MAPBOX_TOKEN** variable name
10. ✅ **Use placeholders** instead of file uploads, skip Redis/auth for Phase 1

The simplified technology choices from the existing codebase are well-suited for a Phase 1 MVP. The core PostGIS spatial functionality can be directly reused for the sitter location features.