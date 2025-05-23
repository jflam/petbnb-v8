-- Drop existing restaurant-related tables
DROP TABLE IF EXISTS restaurants CASCADE;

-- Create sitter_profiles table
CREATE TABLE sitter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  profile_picture VARCHAR(500),
  bio TEXT,
  experience TEXT,
  service_radius INTEGER DEFAULT 10,
  hourly_rate DECIMAL(10,2) NOT NULL,
  mock_rating DECIMAL(2,1) DEFAULT 4.5,
  mock_review_count INTEGER DEFAULT 12,
  mock_response_time VARCHAR(50) DEFAULT '1 hour',
  mock_repeat_client_percent INTEGER DEFAULT 85,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  location GEOMETRY(Point, 4326),
  accepts_dogs BOOLEAN DEFAULT true,
  accepts_cats BOOLEAN DEFAULT true,
  accepts_other_pets BOOLEAN DEFAULT false,
  has_fenced_yard BOOLEAN DEFAULT false,
  has_other_pets BOOLEAN DEFAULT false,
  is_smoke_free BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on location column
CREATE INDEX sitter_profiles_location_gix ON sitter_profiles USING GIST (location);

-- Create function to update location geometry from lat/long
CREATE OR REPLACE FUNCTION update_sitter_location() RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update location geometry
CREATE TRIGGER update_sitter_location_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON sitter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_sitter_location();

-- Create index on email for faster lookups
CREATE INDEX idx_sitter_profiles_email ON sitter_profiles(email);

-- Create index on active status for filtering
CREATE INDEX idx_sitter_profiles_active ON sitter_profiles(is_active);

-- Create composite index for common queries
CREATE INDEX idx_sitter_profiles_active_city ON sitter_profiles(is_active, city);