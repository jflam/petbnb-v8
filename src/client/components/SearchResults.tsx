import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token here
// You need to set VITE_MAPBOX_TOKEN in your .env file with a valid Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface Sitter {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  location: {
    lat: number;
    lng: number;
  };
  city: string;
  state: string;
  hourly_rate: number;
  average_rating: string;
  review_count: number;
  response_time: string;
  repeat_client_percent: number;
  profile_picture: string;
  bio: string;
  distance_km: string;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  accepts_other_pets: boolean;
}

interface SearchParams {
  lat?: number;
  lng?: number;
  startDate?: string;
  endDate?: string;
  petType?: string;
  service?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'rating' | 'distance';
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const SitterCard: React.FC<{ sitter: Sitter; isSelected?: boolean; onClick?: () => void; onNavigate?: () => void }> = ({ 
  sitter, 
  isSelected = false,
  onClick,
  onNavigate
}) => {
  return (
    <div 
      className={`sitter-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        padding: '1rem',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        marginBottom: '1rem',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#f0f8ff' : 'white',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', gap: '1rem' }}>
        <img 
          src={sitter.profile_picture || '/images/placeholder-sitter.jpg'} 
          alt={sitter.name}
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '8px',
            objectFit: 'cover'
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder-sitter.jpg';
          }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{sitter.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#ff5a5f' }}>★ {sitter.average_rating}</span>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>({sitter.review_count} reviews)</span>
          </div>
          <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
            {sitter.city}, {sitter.state} • {sitter.distance_km} km away
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
            <span>Response time: {sitter.response_time || 'N/A'}</span>
            <span>{sitter.repeat_client_percent || 0}% repeat clients</span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${sitter.hourly_rate}</span>
            <span style={{ color: '#666' }}>/hour</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {sitter.accepts_dogs && (
              <span 
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              >
                🐕 Dogs
              </span>
            )}
            {sitter.accepts_cats && (
              <span 
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              >
                🐈 Cats
              </span>
            )}
            {sitter.accepts_other_pets && (
              <span 
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}
              >
                🐰 Other pets
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.();
            }}
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ff5a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedSitter, setSelectedSitter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('distance');
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 200,
    petType: 'all',
    service: 'all'
  });
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Get location from URL params
  const locationParam = searchParams.get('location');
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');

  // Geocode location if needed
  useEffect(() => {
    const geocodeLocation = async () => {
      if (latParam && lngParam) {
        // Coordinates already provided
        setCoordinates({ lat: parseFloat(latParam), lng: parseFloat(lngParam) });
      } else if (locationParam) {
        // Need to geocode the location
        try {
          const response = await fetch(`/api/mapbox/geocode?q=${encodeURIComponent(locationParam)}`);
          if (!response.ok) throw new Error('Geocoding failed');
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            setCoordinates({ lat, lng });
          } else {
            setLocationError('Location not found. Showing results for Seattle.');
            setCoordinates({ lat: 47.6062, lng: -122.3321 }); // Default to Seattle
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          setLocationError('Unable to find location. Showing results for Seattle.');
          setCoordinates({ lat: 47.6062, lng: -122.3321 }); // Default to Seattle
        }
      } else {
        // No location provided, use default
        setCoordinates({ lat: 47.6062, lng: -122.3321 }); // Default to Seattle
      }
    };

    geocodeLocation();
  }, [locationParam, latParam, lngParam]);

  // Parse other search parameters
  const params: SearchParams = {
    lat: coordinates?.lat || 47.6062,
    lng: coordinates?.lng || -122.3321,
    startDate: searchParams.get('checkIn') || searchParams.get('startDate') || undefined,
    endDate: searchParams.get('checkOut') || searchParams.get('endDate') || undefined,
    petType: searchParams.get('petType') || undefined,
    service: searchParams.get('serviceType') || searchParams.get('service') || undefined,
    sortBy: (searchParams.get('sortBy') as 'price' | 'rating' | 'distance') || 'distance'
  };

  // Build API URL with filters
  const apiUrl = `/api/search/sitters?${new URLSearchParams({
    ...(params.lat && { lat: params.lat.toString() }),
    ...(params.lng && { lng: params.lng.toString() }),
    radius: '25', // Default 25km radius
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
    ...(filters.petType !== 'all' && { petType: filters.petType }),
    ...(filters.service !== 'all' && { service: filters.service }),
    minPrice: filters.minPrice.toString(),
    maxPrice: filters.maxPrice.toString(),
    sortBy: sortBy
  }).toString()}`;

  // Only fetch when we have coordinates
  const { data, error, isLoading } = useSWR<{ sitters: Sitter[] }>(
    coordinates ? apiUrl : null,
    fetcher
  );

  // Debug logging
  React.useEffect(() => {
    if (data?.sitters) {
      console.log('Sitter data received:', data.sitters[0]);
    }
  }, [data]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !data?.sitters.length) return;
    
    // Check if Mapbox token is set
    if (!mapboxgl.accessToken) {
      console.warn('Mapbox token not set. Please set VITE_MAPBOX_TOKEN in your .env file');
      return;
    }

    // Initialize map only once
    if (!map.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [params.lng || -122.4194, params.lat || 37.7749],
          zoom: 12
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl());
      } catch (error) {
        console.error('Error initializing map:', error);
        return;
      }
    }

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each sitter
    data.sitters.forEach(sitter => {
      // Validate coordinates
      if (!sitter.location || typeof sitter.location.lat !== 'number' || typeof sitter.location.lng !== 'number' ||
          isNaN(sitter.location.lat) || isNaN(sitter.location.lng)) {
        console.warn('Invalid coordinates for sitter:', sitter.name, sitter.location);
        return;
      }
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = selectedSitter === sitter.id ? '#ff5a5f' : '#333';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.style.cursor = 'pointer';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      el.innerHTML = `$${sitter.hourly_rate}`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([sitter.location.lng, sitter.location.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedSitter(sitter.id);
      });

      markers.current.push(marker);
    });

    // Fit map to markers
    const validSitters = data.sitters.filter(sitter => 
      sitter.location && 
      typeof sitter.location.lat === 'number' && 
      typeof sitter.location.lng === 'number' &&
      !isNaN(sitter.location.lat) && 
      !isNaN(sitter.location.lng)
    );
    
    if (validSitters.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validSitters.forEach(sitter => {
        bounds.extend([sitter.location.lng, sitter.location.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [data, selectedSitter, params.lat, params.lng]);

  // Update marker colors when selection changes
  useEffect(() => {
    if (!data?.sitters) return;
    
    markers.current.forEach((marker, index) => {
      const el = marker.getElement();
      if (el) {
        el.style.backgroundColor = data.sitters[index].id === selectedSitter ? '#ff5a5f' : '#333';
      }
    });
  }, [selectedSitter, data]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!coordinates || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>{!coordinates ? 'Finding location...' : 'Loading sitters...'}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Error loading sitters. Please try again.</div>
      </div>
    );
  }

  const sitters = data?.sitters || [];

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {/* Filter Bar */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <select 
          value={filters.petType}
          onChange={(e) => setFilters({...filters, petType: e.target.value})}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All pets</option>
          <option value="dog">Dogs</option>
          <option value="cat">Cats</option>
          <option value="bird">Birds</option>
          <option value="small">Small pets</option>
        </select>

        <select 
          value={filters.service}
          onChange={(e) => setFilters({...filters, service: e.target.value})}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All services</option>
          <option value="boarding">Boarding</option>
          <option value="daycare">Day care</option>
          <option value="walking">Dog walking</option>
          <option value="sitting">Pet sitting</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label>Price:</label>
          <input 
            type="range" 
            min="0" 
            max="200" 
            value={filters.maxPrice}
            onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
          />
          <span>${filters.maxPrice}</span>
        </div>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="distance">Distance</option>
          <option value="price">Price</option>
          <option value="rating">Rating</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setViewMode('list')}
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: viewMode === 'list' ? '#ff5a5f' : 'white',
              color: viewMode === 'list' ? 'white' : 'black',
              cursor: 'pointer'
            }}
          >
            List
          </button>
          <button 
            onClick={() => setViewMode('map')}
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: viewMode === 'map' ? '#ff5a5f' : 'white',
              color: viewMode === 'map' ? 'white' : 'black',
              cursor: 'pointer'
            }}
          >
            Map
          </button>
          <button 
            onClick={() => setViewMode('split')}
            style={{ 
              padding: '0.5rem 1rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: viewMode === 'split' ? '#ff5a5f' : 'white',
              color: viewMode === 'split' ? 'white' : 'black',
              cursor: 'pointer'
            }}
          >
            Split
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List View */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div style={{ 
            flex: viewMode === 'split' ? '0 0 50%' : '1',
            overflowY: 'auto',
            padding: '1rem',
            backgroundColor: '#f8f8f8'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{sitters.length} sitters found</h2>
              <p style={{ margin: '0.5rem 0', color: '#666' }}>
                Near {locationParam || 'Seattle, WA'}
              </p>
              {locationError && (
                <p style={{ margin: '0.5rem 0', color: '#ff6b6b', fontSize: '0.875rem' }}>
                  {locationError}
                </p>
              )}
            </div>
            {sitters.map(sitter => (
              <SitterCard 
                key={sitter.id} 
                sitter={sitter}
                isSelected={selectedSitter === sitter.id}
                onClick={() => setSelectedSitter(sitter.id)}
                onNavigate={() => navigate(`/sitters/${sitter.id}`)}
              />
            ))}
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div 
            ref={mapContainer} 
            style={{ 
              flex: viewMode === 'split' ? '0 0 50%' : '1',
              height: '100%',
              position: 'relative',
              backgroundColor: '#f0f0f0'
            }}
          >
            {!mapboxgl.accessToken && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3>Map not available</h3>
                <p>Please set VITE_MAPBOX_TOKEN in your .env file</p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  Get a free token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer">mapbox.com</a>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;