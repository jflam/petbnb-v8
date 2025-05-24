import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { debounce } from '../utils/debounce';
import './LandingPage.css';

interface LocationResult {
  place_name: string;
  center: [number, number];
  text: string;
}

interface SearchFormData {
  location: string;
  locationCoords?: [number, number];
  checkIn: string;
  checkOut: string;
  petType: 'dog' | 'cat' | 'other';
  petCount: number;
  serviceType: string;
}

const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState<SearchFormData>({
    location: '',
    checkIn: '',
    checkOut: '',
    petType: 'dog',
    petCount: 1,
    serviceType: 'boarding'
  });

  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Debounced location search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchLocations = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setLocationResults([]);
        return;
      }

      setIsLoadingLocations(true);
      try {
        const response = await axios.get('/api/search/locations', {
          params: { q: query }
        });
        setLocationResults(response.data);
        setShowLocationDropdown(true);
      } catch (error) {
        console.error('Failed to search locations:', error);
        setLocationResults([]);
      } finally {
        setIsLoadingLocations(false);
      }
    }, 300),
    []
  );

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value, locationCoords: undefined });
    searchLocations(value);
  };

  const selectLocation = (result: LocationResult) => {
    setFormData({
      ...formData,
      location: result.place_name,
      locationCoords: result.center
    });
    setShowLocationDropdown(false);
    setLocationResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build URL params
    const params = new URLSearchParams({
      location: formData.location,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      petType: formData.petType,
      petCount: formData.petCount.toString(),
      serviceType: formData.serviceType
    });
    
    // Add coordinates if available
    if (formData.locationCoords) {
      params.append('lat', formData.locationCoords[1].toString());
      params.append('lng', formData.locationCoords[0].toString());
    }

    // Navigate to search results
    window.location.href = `/search?${params.toString()}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get min date for check-in (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get min date for check-out (day after check-in)
  const getMinCheckOut = () => {
    if (!formData.checkIn) return today;
    const checkIn = new Date(formData.checkIn);
    checkIn.setDate(checkIn.getDate() + 1);
    return checkIn.toISOString().split('T')[0];
  };

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="landing__hero">
        <div className="landing__hero-content">
          <h1 className="landing__title">Find trusted pet care in your neighborhood</h1>
          <p className="landing__subtitle">
            Connect with loving, verified pet sitters who treat your furry friends like family
          </p>

          {/* Search Form */}
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-form__row">
              <div className="search-form__field search-form__field--location" ref={locationInputRef}>
                <label htmlFor="location" className="search-form__label">Location</label>
                <input
                  type="text"
                  id="location"
                  className="search-form__input"
                  placeholder="Enter city or neighborhood"
                  value={formData.location}
                  onChange={handleLocationChange}
                  required
                  autoComplete="off"
                />
                {isLoadingLocations && (
                  <div className="search-form__loading">Searching...</div>
                )}
                {showLocationDropdown && locationResults.length > 0 && (
                  <div className="search-form__dropdown">
                    {locationResults.map((result, index) => (
                      <div
                        key={index}
                        className="search-form__dropdown-item"
                        onClick={() => selectLocation(result)}
                      >
                        {result.place_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="search-form__field">
                <label htmlFor="checkIn" className="search-form__label">Check-in</label>
                <input
                  type="date"
                  id="checkIn"
                  className="search-form__input"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  min={today}
                  required
                />
              </div>

              <div className="search-form__field">
                <label htmlFor="checkOut" className="search-form__label">Check-out</label>
                <input
                  type="date"
                  id="checkOut"
                  className="search-form__input"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  min={getMinCheckOut()}
                  required
                />
              </div>
            </div>

            <div className="search-form__row">
              <div className="search-form__field">
                <label htmlFor="petType" className="search-form__label">Pet Type</label>
                <select
                  id="petType"
                  className="search-form__select"
                  value={formData.petType}
                  onChange={(e) => setFormData({ ...formData, petType: e.target.value as 'dog' | 'cat' | 'other' })}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="search-form__field">
                <label htmlFor="petCount" className="search-form__label">Number of Pets</label>
                <div className="search-form__counter">
                  <button
                    type="button"
                    className="search-form__counter-btn"
                    onClick={() => setFormData({ ...formData, petCount: Math.max(1, formData.petCount - 1) })}
                    disabled={formData.petCount <= 1}
                  >
                    -
                  </button>
                  <span className="search-form__counter-value">{formData.petCount}</span>
                  <button
                    type="button"
                    className="search-form__counter-btn"
                    onClick={() => setFormData({ ...formData, petCount: formData.petCount + 1 })}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="search-form__field">
                <label htmlFor="serviceType" className="search-form__label">Service Type</label>
                <select
                  id="serviceType"
                  className="search-form__select"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                >
                  <option value="boarding">Boarding</option>
                  <option value="house-sitting">House Sitting</option>
                  <option value="drop-in">Drop-in Visits</option>
                  <option value="day-care">Day Care</option>
                  <option value="dog-walking">Dog Walking</option>
                </select>
              </div>

              <button type="submit" className="search-form__submit">
                Search Sitters
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing__features">
        <div className="container">
          <h2 className="landing__section-title">Why Choose PetBnB?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card__icon">🛡️</div>
              <h3 className="feature-card__title">Background-Checked Sitters</h3>
              <p className="feature-card__description">
                All our sitters undergo thorough background checks and verification for your peace of mind
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">💰</div>
              <h3 className="feature-card__title">Lower Fees</h3>
              <p className="feature-card__description">
                We charge 25% less than competitors, saving you money while supporting sitters
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">🏥</div>
              <h3 className="feature-card__title">24/7 Support</h3>
              <p className="feature-card__description">
                Emergency vet helpline and customer support available around the clock
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">🎨</div>
              <h3 className="feature-card__title">Unique Profiles</h3>
              <p className="feature-card__description">
                Beautiful Studio Ghibli-style portraits help you connect with the perfect sitter
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing__cta">
        <div className="container">
          <h2 className="landing__section-title">Love pets? Become a sitter!</h2>
          <p className="landing__cta-text">
            Turn your passion for pets into extra income. Set your own schedule, 
            choose your clients, and get paid doing what you love.
          </p>
          <button className="landing__cta-button" onClick={() => window.location.href = '/become-sitter'}>
            Get Started as a Sitter
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;