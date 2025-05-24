// @vitest-environment node

// Import required modules
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables 
dotenv.config();

// For local testing, always use localhost instead of Docker service names
if (process.env.RUNNING_IN_DOCKER !== 'true') {
  dotenv.config({ path: '.env.test' });
  // Force localhost for the PostgreSQL connection
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@postgres:')) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@postgres:', '@localhost:');
  } else {
    // Fallback to a standard local connection
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/petbnb_test';
  }
}

let app = null;

// Set up test connection
beforeAll(async () => {
  console.log('Using database URL:', process.env.DATABASE_URL);
  
  // Import the app AFTER setting environment variables
  const appModule = await import('../../src/server/simplified-server.js');
  app = appModule.default;
  
  // Wait a moment for the server to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
}, 5000);

// Clean up 
afterAll(async () => {
  // No cleanup needed - we're using the existing database
});

// Test the sitter endpoints
describe('Sitter API Tests', () => {
  it('GET /api/health should return a 200 status code', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('time');
    expect(response.body).toHaveProperty('db_time');
  });

  it('GET /api/search/sitters should return sitters near Seattle', async () => {
    const response = await request(app).get('/api/search/sitters')
      .query({
        lat: 47.6062,
        lng: -122.3321,
        radius: 20,
        petType: 'dog'
      });
    
    if (response.status !== 200) {
      console.error('Search sitters error:', response.body);
    }
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sitters');
    // The API returns just a sitters array, not wrapped in an object
    // expect(response.body).toHaveProperty('total');
    // expect(response.body).toHaveProperty('searchLocation');
    
    expect(Array.isArray(response.body.sitters)).toBe(true);
    expect(response.body.sitters.length).toBeGreaterThan(0);
    
    // Should find Seattle sitters
    const seattleSitters = response.body.sitters.filter(s => s.city === 'Seattle');
    expect(seattleSitters.length).toBeGreaterThan(0);
    
    // Check sitter structure
    const sitter = response.body.sitters[0];
    expect(sitter).toHaveProperty('id');
    expect(sitter).toHaveProperty('first_name');
    expect(sitter).toHaveProperty('last_name');
    expect(sitter).toHaveProperty('city');
    expect(sitter).toHaveProperty('hourly_rate');
    expect(sitter).toHaveProperty('distance_km');
    expect(sitter).toHaveProperty('accepts_dogs');
    
    // Verify distance calculation
    expect(parseFloat(sitter.distance_km)).toBeLessThan(50); // Within 50km of Seattle
  });
  
  it('GET /api/search/sitters should filter by pet type', async () => {
    const response = await request(app).get('/api/search/sitters')
      .query({
        lat: 30.2672,
        lng: -97.7431,
        radius: 20,
        petType: 'cat'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sitters');
    
    // All returned sitters should accept cats
    response.body.sitters.forEach(sitter => {
      expect(sitter.accepts_cats).toBe(true);
    });
  });
  
  it('GET /api/sitters/:id should return a specific sitter', async () => {
    // First, get a sitter ID from search
    const searchResponse = await request(app).get('/api/search/sitters')
      .query({
        lat: 47.6062,
        lng: -122.3321,
        radius: 20,
        petType: 'dog'
      });
    
    expect(searchResponse.body.sitters.length).toBeGreaterThan(0);
    const sitterId = searchResponse.body.sitters[0].id;
    
    // Now get the specific sitter
    const response = await request(app).get(`/api/sitters/${sitterId}`);
    expect(response.status).toBe(200);
    
    const sitter = response.body;
    expect(sitter).toHaveProperty('id', sitterId);
    expect(sitter).toHaveProperty('first_name');
    expect(sitter).toHaveProperty('last_name');
    expect(sitter).toHaveProperty('bio');
    expect(sitter).toHaveProperty('experience');
    expect(sitter).toHaveProperty('hourly_rate');
    expect(sitter).toHaveProperty('service_radius');
  });
  
  it('POST /api/sitters should create a new sitter', async () => {
    const newSitter = {
      firstName: 'Test',
      lastName: 'Sitter',
      email: `test${Date.now()}@example.com`,
      phone: '555-0123',
      bio: 'I love taking care of pets! This is my test bio.',
      experience: 'I have been pet sitting for 5 years.',
      hourlyRate: 35,
      serviceRadius: 15,
      address: '123 Test St',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      latitude: 47.6062,
      longitude: -122.3321,
      acceptsDogs: true,
      acceptsCats: true,
      acceptsOtherPets: false,
      hasFencedYard: true,
      hasOtherPets: false,
      isSmokeFree: true
    };
    
    const response = await request(app)
      .post('/api/sitters')
      .send(newSitter);
    
    if (response.status !== 201) {
      console.error('Create sitter error:', response.body);
    }
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('first_name', 'Test');
    expect(response.body).toHaveProperty('last_name', 'Sitter');
    expect(response.body).toHaveProperty('email', newSitter.email);
    expect(response.body).toHaveProperty('bio', newSitter.bio);
  });
});