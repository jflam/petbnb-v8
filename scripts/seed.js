const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/petbnb'
});

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Check if we have generated images, otherwise use regular seed data
    let sitterDataPath = path.join(__dirname, './seed-data/sitters-with-images.json');
    if (!fs.existsSync(sitterDataPath)) {
      console.log('No generated images found, using base seed data...');
      sitterDataPath = path.join(__dirname, './seed-data/sitters.json');
    }
    
    const sitterData = require(sitterDataPath);
    
    // Clear existing data
    console.log('Clearing existing sitter profiles...');
    await pool.query('DELETE FROM sitter_profiles');
    
    // Insert sitters
    console.log(`Inserting ${sitterData.length} sitter profiles...`);
    
    for (const sitter of sitterData) {
      // Parse name into first and last name
      const nameParts = sitter.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // Generate random address
      const streetNumber = Math.floor(Math.random() * 9000) + 100;
      const streets = ['Maple St', 'Oak Ave', 'Pine Dr', 'Cedar Ln', 'Elm Way'];
      const street = streets[Math.floor(Math.random() * streets.length)];
      const address = `${streetNumber} ${street}`;
      
      // Generate zip code based on city
      const zipCode = sitter.city === 'Seattle' ? `9810${Math.floor(Math.random() * 10)}` : `7870${Math.floor(Math.random() * 10)}`;
      
      // Check home features for relevant boolean fields
      const hasFencedYard = sitter.homeFeatures?.includes('Fenced Yard') || false;
      const hasOtherPets = sitter.homeFeatures?.includes('Other Pets') || false;
      const isSmokeFree = !sitter.homeFeatures?.includes('Smoking') ?? true;
      
      const query = `
        INSERT INTO sitter_profiles (
          first_name, last_name, email, phone, profile_picture,
          bio, experience, service_radius, hourly_rate,
          mock_rating, mock_review_count, mock_response_time, mock_repeat_client_percent,
          address, city, state, zip_code, latitude, longitude,
          accepts_dogs, accepts_cats, accepts_other_pets,
          has_fenced_yard, has_other_pets, is_smoke_free,
          is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26
        )
      `;
      
      const values = [
        firstName,
        lastName,
        sitter.email,
        sitter.phone || null,
        sitter.profilePicture || `/images/placeholder-sitter.jpg`,
        sitter.bio,
        sitter.experience,
        sitter.serviceRadius || 10,
        sitter.hourlyRate,
        sitter.rating || 4.5,
        sitter.reviewCount || Math.floor(Math.random() * 50) + 10,
        sitter.responseTime || '1 hour',
        sitter.repeatClientPercent || Math.floor(Math.random() * 30) + 70,
        address,
        sitter.city,
        sitter.state,
        zipCode,
        sitter.lat,
        sitter.lng,
        true, // accepts_dogs
        true, // accepts_cats
        Math.random() > 0.5, // accepts_other_pets
        hasFencedYard,
        hasOtherPets,
        isSmokeFree,
        true // is_active
      ];
      
      await pool.query(query, values);
      console.log(`✓ Inserted sitter: ${firstName} ${lastName} (${sitter.city})`);
    }
    
    console.log('\nDatabase seeding completed successfully!');
    console.log(`Total sitters: ${sitterData.length}`);
    
    // Show distribution
    const seattleCount = sitterData.filter(s => s.city === 'Seattle').length;
    const austinCount = sitterData.filter(s => s.city === 'Austin').length;
    console.log(`Seattle sitters: ${seattleCount}`);
    console.log(`Austin sitters: ${austinCount}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seeding
seedDatabase().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});