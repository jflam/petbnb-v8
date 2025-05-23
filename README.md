# PetBnB - Find Trusted Pet Sitters Near You

PetBnB is a marketplace connecting pet owners with trusted pet sitters in their area. Think of it as Airbnb for pet care.

## Features

- 🗺️ Interactive map showing sitters near you
- 🔍 Location-based search with Mapbox integration
- 🎨 Studio Ghibli-style AI-generated sitter portraits
- ⭐ Ratings and reviews (mock data in Phase 1)
- 🏅 Visual badges for verified sitters
- 📱 Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React 18, SWR, Mapbox GL JS
- **Backend**: Express.js 5 (RC), PostgreSQL 15 with PostGIS
- **Build**: Vite 6
- **Testing**: Vitest, Playwright
- **Styling**: Plain CSS with BEM convention

## Prerequisites

- Node.js 20+
- PostgreSQL 15 with PostGIS extension
- Mapbox API token (get one free at https://mapbox.com)
- OpenAI API key (for image generation)

## Quick Start

```bash
# Clone the repository
git clone [your-repo-url]
cd petbnb-v8

# Install dependencies
npm install

# Create .env file with your API keys
cp .env.example .env
# Edit .env and add your API keys

# Start PostgreSQL with PostGIS (using Docker)
docker-compose up -d postgres

# Run database migrations
npm run migrate

# Generate Studio Ghibli images and seed data
npm run seed:full

# Start development servers
npm run dev
```

> **Note:** The app will be available at:
> - Frontend: http://localhost:5173
> - API: http://localhost:3001

## Development Commands

```bash
# Development
npm run dev                # Start both client and server
npm run dev:client         # Start Vite dev server only
npm run dev:server         # Start Express server only

# Database
npm run migrate            # Run database migrations
npm run seed              # Seed database with sample data
npm run generate-images   # Generate AI images for sitters
npm run seed:full         # Generate images + seed data

# Testing
npm run test              # Run unit tests
npm run test:client       # Run client tests only
npm run test:server       # Run server tests only
npm run test:e2e          # Run end-to-end tests

# Quality
npm run typecheck         # Run TypeScript type checking
npm run lint              # Run ESLint
```

## Project Structure

```
├── migrations/          # SQL migration files
├── scripts/            # Build and setup scripts
├── src/
│   ├── client/         # React frontend
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   └── utils/      # Utility functions
│   └── server/         # Express backend
│       └── db.js       # Database connection
├── tests/              # Test files
└── public/             # Static assets
```

## API Endpoints

- `GET /api/sitters/search` - Search for sitters by location
- `GET /api/sitters/:id` - Get sitter profile details
- `GET /api/mapbox/geocode` - Proxy for Mapbox geocoding

## Phase 1 Features (Current)

- Landing page with location search
- Search results with map/list view
- Sitter profile pages
- Distance-based search using PostGIS
- Mock data for ratings and reviews

## Future Phases

- Phase 2: Authentication, messaging, booking
- Phase 3: Payments, reviews, trust & safety

## License

MIT
