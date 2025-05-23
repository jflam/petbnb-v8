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
- Zustand for client state management
- React Query for server state
- Tailwind CSS for styling
- React Hook Form + Zod for form validation
- React Router v6 for navigation

**Backend:**
- NestJS 10 with Express adapter
- TypeScript throughout
- Prisma ORM with PostgreSQL 15
- Passport.js for authentication
- class-validator for API validation

**Infrastructure:**
- Docker for containerization
- pnpm workspaces for monorepo management
- GitHub Actions for CI/CD
- Azure deployment ready

---

## Core Database Schema

### Users & Authentication Tables
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  firstName   String
  lastName    String
  phone       String?
  profilePicture String?
  role        UserRole @default(OWNER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Business relations
  sitterProfile SitterProfile?
  bookings      Booking[]
  reviews       Review[]
  
  @@map("users")
}

model SitterProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  bio         String?
  experience  String?
  serviceRadius Int     @default(10) // miles
  hourlyRate  Decimal  @db.Decimal(10,2)
  
  // Location
  address     String
  city        String
  state       String
  zipCode     String
  latitude    Decimal  @db.Decimal(10,8)
  longitude   Decimal  @db.Decimal(11,8)
  
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

enum UserRole {
  OWNER
  SITTER
  ADMIN
}
```

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5433/petbnb"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="24h"

# Mapbox (for geocoding and mapping)
MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"
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
- Initialize Nx workspace with pnpm
- Create frontend React app with Vite
- Create backend NestJS app
- Set up shared TypeScript libraries (shared-types, ui-components)
- Configure ESLint, Prettier, and Husky pre-commit hooks
- Set up Docker Compose for local development (PostgreSQL + Redis)
- Configure GitHub Actions workflow for CI/CD

**File Structure:**
```
petbnb/
├── apps/
│   ├── frontend/          # React app
│   └── backend/           # NestJS app
├── libs/
│   ├── shared-types/      # Shared TypeScript interfaces
│   └── ui-components/     # Reusable React components
├── docker-compose.yml     # Local development services
├── package.json           # Root package.json with workspace config
└── nx.json               # Nx configuration
```

**Validation Criteria:**
- `pnpm dev` starts both frontend and backend
- `pnpm test` runs all tests across workspace
- `pnpm lint` enforces code standards
- Database migrations run successfully
- Docker containers start without errors

### 2. Authentication System

**Objective:** Implement secure JWT-based authentication for users and sitters.

**Backend Requirements:**
- JWT authentication strategy with Passport.js
- User registration endpoint with email/password validation
- Login endpoint returning JWT tokens
- Protected route guards using JWT strategy
- Password hashing with bcrypt (minimum 12 rounds)
- Input validation using class-validator decorators

**Frontend Requirements:**
- Zustand store for authentication state management
- Login/Register forms with React Hook Form + Zod validation
- Automatic token storage in localStorage
- Axios interceptor for adding Authorization headers
- Protected route wrapper component
- Automatic redirect to login when unauthorized

**API Endpoints:**
```typescript
POST /auth/register
  Body: { email, password, firstName, lastName, role }
  Response: { user, accessToken }

POST /auth/login
  Body: { email, password }
  Response: { user, accessToken }

GET /auth/profile (Protected)
  Response: { user }
```

**Validation Criteria:**
- User can register with valid email/password
- User can login and receive JWT token
- Protected routes require valid authentication
- Invalid tokens return 401 status
- Passwords are properly hashed in database

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
- URL state management for search parameters
- Navigate to search results page on submit
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

### 6. Search Results & Sitter Listings

**Objective:** Display search results with filtering and basic sitter information.

**Search Results Page Layout:**
```typescript
// Header Section
- Search location and parameters display
- Results count ("X sitters found in [location]")
- View toggle buttons (List/Map - Map implementation in Phase 2)
- Sort dropdown (Distance, Price, Rating)

// Sitter Card Grid
- Responsive grid layout (1 col mobile, 2-3 cols tablet, 4 cols desktop)
- Each card shows: Profile photo, Name, Distance, Hourly rate, Bio preview, Pet type icons
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
    
    // Find sitters within radius using Haversine formula
    const sitters = await this.prisma.$queryRaw`
      SELECT sp.*, u.firstName, u.lastName, u.profilePicture,
        (
          6371 * acos(
            cos(radians(${searchLat})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${searchLng})) + 
            sin(radians(${searchLat})) * 
            sin(radians(latitude))
          )
        ) AS distance
      FROM sitter_profiles sp
      JOIN users u ON sp.userId = u.id
      WHERE sp.isActive = true
      AND (
        (${query.petType} = 'dog' AND sp.acceptsDogs = true) OR
        (${query.petType} = 'cat' AND sp.acceptsCats = true) OR
        (${query.petType} = 'other' AND sp.acceptsOtherPets = true)
      )
      AND (
        6371 * acos(
          cos(radians(${searchLat})) * 
          cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${searchLng})) + 
          sin(radians(${searchLat})) * 
          sin(radians(latitude))
        )
      ) <= ${query.radius}
      ORDER BY distance ASC
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
- Use Haversine formula for accurate distance calculation
- Raw SQL query for performance with large datasets
- Filter sitters within specified radius
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