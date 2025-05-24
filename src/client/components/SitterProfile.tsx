import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './SitterProfile.css';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

// Separate fetcher for image that doesn't throw on error
const imageFetcher = (url: string) => 
  axios.get(url)
    .then(res => res.data)
    .catch(() => null); // Return null on error instead of throwing

interface Sitter {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string;
  experience: string;
  service_radius: number;
  hourly_rate: number;
  mock_rating: number;
  mock_review_count: number;
  mock_response_time: string;
  mock_repeat_client_percent: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  accepts_other_pets: boolean;
  has_fenced_yard: boolean;
  has_other_pets: boolean;
  is_smoke_free: boolean;
  profile_picture?: string;
}

const SitterProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  const { data: sitter, error, isLoading } = useSWR<Sitter>(
    id ? `/api/sitters/${id}` : null,
    fetcher
  );

  const { data: imageData } = useSWR<{ imageUrl: string } | null>(
    id ? `/api/sitters/${id}/image` : null,
    imageFetcher
  );

  // Initialize map when sitter data is loaded
  useEffect(() => {
    if (!mapContainer || !sitter || map) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const newMap = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [sitter.longitude, sitter.latitude],
      zoom: 11
    });

    // Add marker for sitter location
    new mapboxgl.Marker({ color: '#667eea' })
      .setLngLat([sitter.longitude, sitter.latitude])
      .addTo(newMap);

    // Add circle for service area
    newMap.on('load', () => {
      newMap.addSource('service-area', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [sitter.longitude, sitter.latitude]
          },
          properties: {}
        }
      });

      newMap.addLayer({
        id: 'service-area-fill',
        type: 'circle',
        source: 'service-area',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, sitter.service_radius * 80000] // Approximate pixels for miles
            ],
            base: 2
          },
          'circle-color': '#667eea',
          'circle-opacity': 0.1
        }
      });

      newMap.addLayer({
        id: 'service-area-stroke',
        type: 'circle',
        source: 'service-area',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, sitter.service_radius * 80000]
            ],
            base: 2
          },
          'circle-stroke-width': 2,
          'circle-stroke-color': '#667eea',
          'circle-stroke-opacity': 0.3,
          'circle-opacity': 0
        }
      });
    });

    setMap(newMap);

    return () => {
      newMap.remove();
      setMap(null);
    };
  }, [mapContainer, sitter, map]);

  if (isLoading) {
    return (
      <div className="sitter-profile__loading">
        <div className="sitter-profile__spinner"></div>
        <p>Loading sitter profile...</p>
      </div>
    );
  }

  if (error || !sitter) {
    return (
      <div className="sitter-profile__error">
        <h2>Oops! Something went wrong</h2>
        <p>We couldn&apos;t load this sitter&apos;s profile. Please try again later.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  const profileImageUrl = imageData?.imageUrl || sitter.profile_picture || '/images/placeholder-sitter.svg';

  return (
    <div className="sitter-profile">
      <div className="sitter-profile__container">
        {/* Header Section */}
        <section className="sitter-profile__header">
          <div className="sitter-profile__header-content">
            <img 
              src={profileImageUrl} 
              alt={`${sitter.first_name} ${sitter.last_name}`}
              className="sitter-profile__image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder-sitter.svg';
              }}
            />
            
            <div className="sitter-profile__header-info">
              <h1 className="sitter-profile__name">
                {sitter.first_name} {sitter.last_name}
              </h1>
              
              <p className="sitter-profile__location">
                {sitter.city}, {sitter.state}
              </p>

              <div className="sitter-profile__badges">
                <span className="sitter-profile__badge sitter-profile__badge--rating">
                  ⭐ {sitter.mock_rating} ({sitter.mock_review_count} reviews)
                </span>
                <span className="sitter-profile__badge sitter-profile__badge--response">
                  ⏱️ Responds in ~{sitter.mock_response_time}
                </span>
                <span className="sitter-profile__badge sitter-profile__badge--repeat">
                  🔄 {sitter.mock_repeat_client_percent}% repeat clients
                </span>
              </div>

              <div className="sitter-profile__rate">
                <span className="sitter-profile__rate-amount">${sitter.hourly_rate}</span>
                <span className="sitter-profile__rate-unit">per hour</span>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="sitter-profile__section">
          <h2 className="sitter-profile__section-title">About Me</h2>
          <p className="sitter-profile__bio">{sitter.bio}</p>
          
          <h3 className="sitter-profile__subsection-title">Experience</h3>
          <p className="sitter-profile__experience">{sitter.experience}</p>
        </section>

        {/* Services & Features */}
        <section className="sitter-profile__section">
          <h2 className="sitter-profile__section-title">Services & Home Features</h2>
          
          <div className="sitter-profile__features">
            <div className="sitter-profile__feature-group">
              <h3 className="sitter-profile__feature-title">Pets I Accept</h3>
              <div className="sitter-profile__feature-list">
                {sitter.accepts_dogs && (
                  <span className="sitter-profile__feature sitter-profile__feature--yes">
                    🐕 Dogs
                  </span>
                )}
                {sitter.accepts_cats && (
                  <span className="sitter-profile__feature sitter-profile__feature--yes">
                    🐈 Cats
                  </span>
                )}
                {sitter.accepts_other_pets && (
                  <span className="sitter-profile__feature sitter-profile__feature--yes">
                    🐰 Other Pets
                  </span>
                )}
              </div>
            </div>

            <div className="sitter-profile__feature-group">
              <h3 className="sitter-profile__feature-title">My Home</h3>
              <div className="sitter-profile__feature-list">
                <span className={`sitter-profile__feature ${sitter.has_fenced_yard ? 'sitter-profile__feature--yes' : 'sitter-profile__feature--no'}`}>
                  {sitter.has_fenced_yard ? '✅' : '❌'} Fenced Yard
                </span>
                <span className={`sitter-profile__feature ${sitter.has_other_pets ? 'sitter-profile__feature--yes' : 'sitter-profile__feature--no'}`}>
                  {sitter.has_other_pets ? '✅' : '❌'} Has Other Pets
                </span>
                <span className={`sitter-profile__feature ${sitter.is_smoke_free ? 'sitter-profile__feature--yes' : 'sitter-profile__feature--no'}`}>
                  {sitter.is_smoke_free ? '✅' : '❌'} Smoke-Free
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Service Area Map */}
        <section className="sitter-profile__section">
          <h2 className="sitter-profile__section-title">Service Area</h2>
          <p className="sitter-profile__service-info">
            I provide services within {sitter.service_radius} miles of my location in {sitter.city}.
          </p>
          <div className="sitter-profile__map" ref={setMapContainer}></div>
        </section>

        {/* Availability Calendar Placeholder */}
        <section className="sitter-profile__section">
          <h2 className="sitter-profile__section-title">Availability</h2>
          <div className="sitter-profile__placeholder">
            <p>📅 Calendar coming soon!</p>
            <p>Contact {sitter.first_name} directly to check availability.</p>
          </div>
        </section>

        {/* Reviews Placeholder */}
        <section className="sitter-profile__section">
          <h2 className="sitter-profile__section-title">Reviews</h2>
          <div className="sitter-profile__placeholder">
            <p>⭐ Reviews coming soon!</p>
            <p>{sitter.first_name} has a {sitter.mock_rating} star rating based on {sitter.mock_review_count} reviews.</p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="sitter-profile__section sitter-profile__contact">
          <h2 className="sitter-profile__section-title">Ready to Book?</h2>
          <p>Contact {sitter.first_name} to discuss your pet care needs.</p>
          <div className="sitter-profile__contact-buttons">
            <button className="sitter-profile__button sitter-profile__button--primary">
              Request Booking
            </button>
            <button className="sitter-profile__button sitter-profile__button--secondary">
              Send Message
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SitterProfile;