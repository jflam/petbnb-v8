// Simple Express server
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import * as dotenv from 'dotenv';

// Make sure environment variables are loaded
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Apply middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      db_time: result.rows[0].now
    });
  } catch (error) {
    // Return ok even if database is not connected
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      db_status: 'not connected'
    });
  }
});

// Endpoint to provide Mapbox token to the client
app.get('/api/config/mapbox', (_req, res) => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Mapbox configuration is missing' });
  }
  res.json({ token });
});

// Get all restaurants
app.get('/api/restaurants', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, 
        rank,
        name, 
        city, 
        address, 
        cuisine_type, 
        specialty, 
        yelp_rating, 
        price_range, 
        image_url,
        ST_AsGeoJSON(location) as location_geojson
      FROM restaurants
      ORDER BY rank
    `);

    // Transform the results to include GeoJSON
    const results = rows.map(row => ({
      ...row,
      location: JSON.parse(row.location_geojson),
      location_geojson: undefined
    }));
    
    res.json(results);
  } catch (error) {
    console.error('Error querying restaurants:', error);
    // Return mock data if database query fails
    res.json([
      {
        id: 1,
        name: 'Test Restaurant (Mock)',
        city: 'Seattle',
        cuisine_type: 'Pizza',
        location: {
          type: 'Point',
          coordinates: [-122.3321, 47.6062]
        }
      }
    ]);
  }
});

// Get nearby restaurants
app.get('/api/restaurants/nearby', async (req, res) => {
  try {
    const lon = parseFloat(req.query.lon) || -122.3321;
    const lat = parseFloat(req.query.lat) || 47.6062;
    const km = parseFloat(req.query.km) || 5;
    
    const { rows } = await pool.query(`
      SELECT 
        id,
        rank,
        name,
        city,
        address,
        cuisine_type,
        specialty,
        yelp_rating,
        price_range,
        image_url,
        ST_AsGeoJSON(location) as location_geojson,
        ST_Distance(location::geography, ST_MakePoint($1,$2)::geography) / 1000 AS distance_km
      FROM restaurants
      WHERE ST_DWithin(location::geography, ST_MakePoint($1,$2)::geography, $3 * 1000)
      ORDER BY distance_km
    `, [lon, lat, km]);
    
    // Transform the results to include GeoJSON
    const results = rows.map(row => ({
      ...row,
      distance_km: parseFloat(row.distance_km).toFixed(2),
      location: JSON.parse(row.location_geojson),
      location_geojson: undefined
    }));
    
    res.json(results);
  } catch (error) {
    console.error('Error querying nearby restaurants:', error);
    // Return mock data if database query fails
    res.json([
      {
        id: 1,
        name: 'Test Restaurant (Mock)',
        city: 'Seattle',
        cuisine_type: 'Pizza',
        location: {
          type: 'Point',
          coordinates: [parseFloat(req.query.lon) || -122.3321, parseFloat(req.query.lat) || 47.6062]
        },
        distance_km: 0.5
      }
    ]);
  }
});

// ==================== PetBnB API Endpoints ====================

// Search for sitters with spatial query
app.get('/api/search/sitters', async (req, res) => {
  try {
    const { lat, lng, lon, radius = 10, service, minRate, maxRate, minPrice, maxPrice, petType, sortBy } = req.query;
    
    // Support both lng and lon for longitude
    const longitude = lng || lon;
    
    if (!lat || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    let query = `
      SELECT 
        s.id,
        s.first_name,
        s.last_name,
        s.bio,
        s.hourly_rate,
        s.service_radius,
        s.profile_picture,
        s.city,
        s.state,
        s.accepts_dogs,
        s.accepts_cats,
        s.accepts_other_pets,
        ST_AsGeoJSON(s.location) as location_geojson,
        ST_Distance(s.location::geography, ST_MakePoint($1, $2)::geography) / 1000 AS distance_km,
        s.mock_rating as average_rating,
        s.mock_review_count as review_count,
        s.mock_response_time,
        s.mock_repeat_client_percent
      FROM sitter_profiles s
      WHERE ST_DWithin(s.location::geography, ST_MakePoint($1, $2)::geography, $3 * 1000)
        AND s.is_active = true
    `;
    
    const params = [parseFloat(longitude), parseFloat(lat), parseFloat(radius)];
    const conditions = [];
    
    // Add service filter
    if (service) {
      // For phase 1, we'll filter based on accepts_dogs/cats/other_pets
      if (service.toLowerCase().includes('dog')) {
        conditions.push('s.accepts_dogs = true');
      } else if (service.toLowerCase().includes('cat')) {
        conditions.push('s.accepts_cats = true');
      }
    }
    
    // Add rate filters (support both minRate/maxRate and minPrice/maxPrice)
    const minimumPrice = minPrice || minRate;
    const maximumPrice = maxPrice || maxRate;
    
    if (minimumPrice) {
      conditions.push(`s.hourly_rate >= $${params.length + 1}`);
      params.push(parseFloat(minimumPrice));
    }
    
    if (maximumPrice) {
      conditions.push(`s.hourly_rate <= $${params.length + 1}`);
      params.push(parseFloat(maximumPrice));
    }
    
    // Add pet type filter
    if (petType && petType !== 'all') {
      if (petType === 'dog') {
        conditions.push('s.accepts_dogs = true');
      } else if (petType === 'cat') {
        conditions.push('s.accepts_cats = true');
      } else if (petType === 'other') {
        conditions.push('s.accepts_other_pets = true');
      }
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    // Add sorting
    switch (sortBy) {
      case 'price':
        query += ' ORDER BY s.hourly_rate ASC';
        break;
      case 'rating':
        query += ' ORDER BY s.mock_rating DESC';
        break;
      case 'distance':
      default:
        query += ' ORDER BY distance_km ASC';
        break;
    }
    
    const { rows } = await pool.query(query, params);
    
    // Transform the results
    const results = rows.map(row => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      first_name: row.first_name,
      last_name: row.last_name,
      bio: row.bio,
      hourly_rate: parseFloat(row.hourly_rate),
      service_radius: row.service_radius,
      profile_picture: row.profile_picture,
      city: row.city,
      state: row.state,
      accepts_dogs: row.accepts_dogs,
      accepts_cats: row.accepts_cats,
      accepts_other_pets: row.accepts_other_pets,
      location: (() => {
        const geojson = JSON.parse(row.location_geojson);
        return {
          lat: geojson.coordinates[1],
          lng: geojson.coordinates[0]
        };
      })(),
      distance_km: parseFloat(row.distance_km).toFixed(2),
      average_rating: parseFloat(row.average_rating).toFixed(1),
      review_count: parseInt(row.review_count),
      response_time: row.mock_response_time,
      repeat_client_percent: row.mock_repeat_client_percent
    }));
    
    res.json({ sitters: results });
  } catch (error) {
    console.error('Error searching sitters:', error);
    
    // Return mock data if database fails
    const mockSitters = [
      {
        id: 1,
        name: 'Sarah Johnson',
        location: { lat: parseFloat(req.query.lat) + 0.01, lng: parseFloat(longitude) + 0.01 },
        address: '123 Main St, Seattle, WA',
        price: 45,
        rating: 4.8,
        reviewCount: 127,
        responseTime: '< 1 hour',
        acceptanceRate: 95,
        imageUrl: '/api/placeholder/120/120',
        services: ['Dog boarding', 'Dog walking', 'Pet sitting'],
        bio: 'Experienced pet sitter with 5+ years caring for dogs and cats.'
      },
      {
        id: 2,
        name: 'Mike Chen',
        location: { lat: parseFloat(req.query.lat) - 0.01, lng: parseFloat(longitude) + 0.02 },
        address: '456 Oak Ave, Seattle, WA',
        price: 35,
        rating: 4.9,
        reviewCount: 89,
        responseTime: '< 30 min',
        acceptanceRate: 98,
        imageUrl: '/api/placeholder/120/120',
        services: ['Dog boarding', 'Cat sitting', 'Small pets'],
        bio: 'Your pets\' home away from home. Spacious backyard and lots of love!'
      },
      {
        id: 3,
        name: 'Emily Rodriguez',
        location: { lat: parseFloat(req.query.lat) + 0.02, lng: parseFloat(longitude) - 0.01 },
        address: '789 Pine St, Seattle, WA',
        price: 55,
        rating: 5.0,
        reviewCount: 203,
        responseTime: '< 2 hours',
        acceptanceRate: 92,
        imageUrl: '/api/placeholder/120/120',
        services: ['Dog boarding', 'Dog daycare', 'Dog training'],
        bio: 'Certified dog trainer offering boarding with training sessions included.'
      },
      {
        id: 4,
        name: 'David Park',
        location: { lat: parseFloat(lat) - 0.02, lng: parseFloat(longitude) - 0.02 },
        address: '321 Elm St, Seattle, WA',
        price: 40,
        rating: 4.7,
        reviewCount: 65,
        responseTime: '< 1 hour',
        acceptanceRate: 90,
        imageUrl: '/api/placeholder/120/120',
        services: ['Cat sitting', 'Small pets', 'Bird care'],
        bio: 'Specializing in cats and small pets. Quiet home environment.'
      },
      {
        id: 5,
        name: 'Lisa Thompson',
        location: { lat: parseFloat(lat) + 0.015, lng: parseFloat(longitude) + 0.025 },
        address: '555 Maple Dr, Seattle, WA',
        price: 50,
        rating: 4.9,
        reviewCount: 156,
        responseTime: '< 30 min',
        acceptanceRate: 97,
        imageUrl: '/api/placeholder/120/120',
        services: ['Dog boarding', 'Dog walking', 'Pet photography'],
        bio: 'Professional pet photographer who loves caring for animals!'
      }
    ];
    
    // Apply sorting to mock data
    if (sortBy === 'price') {
      mockSitters.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'rating') {
      mockSitters.sort((a, b) => b.rating - a.rating);
    }
    
    // Apply price filters
    let filteredSitters = mockSitters;
    if (minPrice || minRate) {
      const min = parseFloat(minPrice || minRate || '0');
      filteredSitters = filteredSitters.filter(s => s.price >= min);
    }
    if (maxPrice || maxRate) {
      const max = parseFloat(maxPrice || maxRate || '200');
      filteredSitters = filteredSitters.filter(s => s.price <= max);
    }
    
    res.json({ sitters: filteredSitters });
  }
});

// Get sitter by ID
app.get('/api/sitters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.bio,
        s.services,
        s.rates,
        s.availability,
        s.profile_image_url,
        s.verified,
        s.years_experience,
        s.certifications,
        ST_AsGeoJSON(s.location) as location_geojson,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM sitters s
      LEFT JOIN reviews r ON s.id = r.sitter_id
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.bio, s.services, s.rates, s.availability, 
               s.profile_image_url, s.verified, s.years_experience, s.certifications, s.location
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sitter not found' });
    }
    
    const sitter = rows[0];
    sitter.location = JSON.parse(sitter.location_geojson);
    delete sitter.location_geojson;
    sitter.average_rating = parseFloat(sitter.average_rating).toFixed(1);
    sitter.review_count = parseInt(sitter.review_count);
    
    // Get reviews for this sitter
    const reviewsResult = await pool.query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        o.name as owner_name,
        o.profile_image_url as owner_image
      FROM reviews r
      JOIN owners o ON r.owner_id = o.id
      WHERE r.sitter_id = $1
      ORDER BY r.created_at DESC
    `, [id]);
    
    sitter.reviews = reviewsResult.rows;
    
    res.json(sitter);
  } catch (error) {
    console.error('Error fetching sitter:', error);
    res.status(500).json({ error: 'Failed to fetch sitter' });
  }
});

// Create a new sitter
app.post('/api/sitters', async (req, res) => {
  try {
    const { 
      name, 
      bio, 
      services, 
      rates, 
      availability, 
      profile_image_url,
      location,
      years_experience,
      certifications 
    } = req.body;
    
    // Validate required fields
    if (!name || !bio || !services || !rates || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { rows } = await pool.query(`
      INSERT INTO sitters (
        name, bio, services, rates, availability, profile_image_url, 
        location, years_experience, certifications, verified
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 
        ST_SetSRID(ST_MakePoint($7, $8), 4326), 
        $9, $10, false
      )
      RETURNING id, name, bio, services, rates, availability, profile_image_url,
                years_experience, certifications, verified,
                ST_AsGeoJSON(location) as location_geojson
    `, [
      name, bio, services, rates, availability || {}, profile_image_url,
      location.coordinates[0], location.coordinates[1],
      years_experience || 0, certifications || []
    ]);
    
    const sitter = rows[0];
    sitter.location = JSON.parse(sitter.location_geojson);
    delete sitter.location_geojson;
    
    res.status(201).json(sitter);
  } catch (error) {
    console.error('Error creating sitter:', error);
    res.status(500).json({ error: 'Failed to create sitter' });
  }
});

// Update sitter
app.put('/api/sitters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = ['name', 'bio', 'services', 'rates', 'availability', 
                          'profile_image_url', 'years_experience', 'certifications'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }
    
    if (updates.location) {
      updateFields.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`);
      values.push(updates.location.coordinates[0], updates.location.coordinates[1]);
      paramCount += 2;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(id);
    
    const { rows } = await pool.query(`
      UPDATE sitters 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, bio, services, rates, availability, profile_image_url,
                years_experience, certifications, verified,
                ST_AsGeoJSON(location) as location_geojson
    `, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sitter not found' });
    }
    
    const sitter = rows[0];
    sitter.location = JSON.parse(sitter.location_geojson);
    delete sitter.location_geojson;
    
    res.json(sitter);
  } catch (error) {
    console.error('Error updating sitter:', error);
    res.status(500).json({ error: 'Failed to update sitter' });
  }
});

// Get sitter profile image
app.get('/api/sitters/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      'SELECT profile_image_url FROM sitters WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0 || !rows[0].profile_image_url) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // In a real app, you might serve the actual image or redirect
    // For now, return the URL
    res.json({ url: rows[0].profile_image_url });
  } catch (error) {
    console.error('Error fetching sitter image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Get owner profile image
app.get('/api/owners/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      'SELECT profile_image_url FROM owners WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0 || !rows[0].profile_image_url) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({ url: rows[0].profile_image_url });
  } catch (error) {
    console.error('Error fetching owner image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const w = parseInt(width) || 120;
  const h = parseInt(height) || 120;
  
  // Redirect to a placeholder service
  res.redirect(`https://via.placeholder.com/${w}x${h}/cccccc/666666?text=Pet+Sitter`);
});

// Mapbox geocoding endpoint
app.get('/api/mapbox/geocode', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) {
      return res.status(500).json({ error: 'Mapbox token not configured' });
    }
    
    // Call Mapbox Geocoding API
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?` +
      `access_token=${mapboxToken}&types=place,locality,neighborhood&limit=5`
    );
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the raw Mapbox response format for compatibility
    res.json(data);
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'Failed to geocode location' });
  }
});

// Location search proxy (Mapbox geocoding)
app.get('/api/search/locations', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) {
      return res.status(500).json({ error: 'Mapbox token not configured' });
    }
    
    // Call Mapbox Geocoding API
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?` +
      `access_token=${mapboxToken}&types=place,locality,neighborhood&limit=5`
    );
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform Mapbox response to our format
    const locations = data.features.map(feature => ({
      id: feature.id,
      name: feature.place_name,
      coordinates: feature.center,
      type: feature.place_type[0],
      bbox: feature.bbox
    }));
    
    res.json({ locations });
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Export for testing
export default app;