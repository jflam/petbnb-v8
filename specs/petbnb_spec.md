# PetBnB – Product Specification (v1.1 – Rover‑informed)

## Overview

PetBnB is an Airbnb‑style, two‑sided marketplace that connects pet owners with background‑checked, verified sitters for in‑home or in‑sitter‑home pet care.  Owners can quickly discover nearby sitters who match their pets' needs, review sitter profiles, and book securely through the platform.  Sitters gain a flexible income stream while PetBnB handles marketing, trust & safety, and payment processing.

This revision incorporates **deep competitive research on Rover** to sharpen our sitter‑discovery MVP and ensure feature‑parity—or strategic differentiation—at launch.

---

## Competitive Landscape

### Rover (Deep‑dive)

- **Founded / Scale** – 2011; > 2 million pet parents, 500 K+ sitters globally. Revenue from 20 % marketplace fee.
- **Core Services** – Boarding, House Sitting, Drop‑in Visits, Doggy Day Care, Dog Walking.
- **Search UX**
  - Unified **location/date** search bar with auto‑complete.
  - Toggleable **Map + List** view.
  - Extensive filters: pet type & size, age, special needs, service type, price range, home features (fenced yard, children‑free), sitter attributes (home full‑time, accepts last‑minute bookings).
- **Listing Card Elements** – Hero image; sitter name; ★ average rating + review count; starting price; response time ("Responds within 15 min"); repeat‑client %; distance badge.
- **Ranking Signals** – Distance & availability → reputation factors (rating, response rate/time, repeat‑client %, booking rate) → profile completeness; new sitters receive temporary exposure boost.
- **Trust & Safety** – Mandatory basic background check (U.S.), Rover Guarantee (24/7 vet assistance), SECURE payments, photo updates.
- **Pain Points (Opportunities)** – Algorithm opacity; high fees; limited license verification for specialised care; complaints around requests outside sitter radius.

### Wag! / TrustedHousesitters

*Placeholders – to be completed later.*

---

## Features

### 1  Sitter Discovery & Search (MVP – Rover‑informed)

#### Motivation

Pet owners must evaluate sitter options instantly—without account friction—while receiving confidence‑building data (rating, response time, repeat clients) pioneered by market leader Rover.  Leveraging these patterns speeds user trust and increases conversion.

#### User Stories (additions highlighted)

- **LO‑US‑01** As a *logged‑out owner*, I can enter a location and date range on the landing page so that I can begin searching for sitters.
- **LO‑US‑02** As a *logged‑out owner*, I can view search results with basic sitter information so that I can evaluate options without creating an account.
- **LO‑US‑03** As a *logged‑out owner*, I can switch between **List** and **Map** view so that I visualise sitter proximity.
- **LI‑US‑01** As a *logged‑in owner*, I can save favorite sitters so that I can easily find them for future bookings.
- **LI‑US‑02** As a *logged‑in owner*, I can view my search history so that I can quickly repeat previous searches.
- **LI‑US‑03** As a *logged‑in owner*, I can set up saved searches with alerts so that I'm notified when new sitters match my criteria.
- **LI‑US‑04** As a *logged‑in owner*, I can filter sitters by **pet size** (XS–XL) and **special needs** (medication, senior care) so that my unique requirements are met.
- **LI‑US‑05** As a *logged‑in owner*, I can sort results by **rating**, **price**, or **distance** so that I can prioritise what matters most.

#### Sitter User Stories

- **S‑US‑01** As a *new sitter*, I can create a profile with photos, bio, and experience so that owners can learn about me.
- **S‑US‑02** As a *sitter*, I can set my service offerings and base prices so that owners know what I provide.
- **S‑US‑03** As a *sitter*, I can define my service area radius so that I only receive relevant requests.
- **S‑US‑04** As a *sitter*, I can specify which pet types, sizes, and special needs I accept so that I get compatible bookings.
- **S‑US‑05** As a *sitter*, I can set additional pet pricing so that multi-pet households see accurate rates.
- **S‑US‑06** As a *sitter*, I can add my home details (fenced yard, other pets) so that owners can assess compatibility.

#### Requirements (delta additions)

0. **Landing Page Search**
   - Location input with Google Places autocomplete
   - Date range picker (Check‑in / Check‑out)
   - Pet type selector (Dog, Cat, Other)
   - Number of pets (with "+" button to add additional pets with type/size)
   - Primary service type (Boarding, House Sitting, Drop‑in Visits, Day Care, Dog Walking)
   - "Search" CTA button
1. **View Toggle** – Add Map/List switch (default List).  Map pins cluster on zoom out.
2. **Expanded Filters**
   - **Pet Type** (Dog, Cat, Bird, Rabbit, Other)
   - **Pet Size** (XS <15 lb, S 15‑39 lb, M 40‑69 lb, L 70‑99 lb, XL ≥100 lb) - shown only for dogs
   - **Special Needs** checkbox group (Puppy <1 yr, Senior >8 yr, Medication‑required, Reactive).
   - **Home Features** (Fenced Yard, Smoke‑free, No other pets).
   - **Service Types** multi‑select (Boarding, House Sitting, Drop‑in Visits, Day Care, Dog Walking)
   - **Price Range** slider ($0 - $200/night)
3. **Listing Card Enhancements**
   - ★ Rating displayed with tooltip showing review count.
   - **Response Time** badge (derived from median of last 30 enquiries; new sitters show "New Sitter" badge instead).
   - **Repeat‑client %** indicator (calculated from last 12 months; minimum 5 bookings to display).
   - Two service price points shown if sitter offers multiple services (e.g., Boarding from \$45 · Day Care from \$30).
4. **Ranking Algorithm (v0.5)** – Score = 0.4 × Distance (normalised 0-1 where 0 = 0 miles, 1 = 50+ miles) + 0.25 × Rating + 0.15 × Availability match + 0.1 × Response Rate + 0.1 × Repeat‑client %.  Tunable weights stored in Config.
5. **Sort Options** – Distance (default), Price (asc), Rating (desc).
6. **URL‑driven State** extended to `petSize`, `specialNeeds[]`, `sort`, `petType`, `services[]`, `priceMin`, `priceMax`.

#### Acceptance Criteria (additions)

```gherkin
  Scenario: Toggle to map view
    Given I have performed a sitter search
    When I click the "Map" toggle
    Then the results grid is replaced by an interactive map with clustered sitter pins
    And the List/Map toggle indicates "List" as the alternate view

  Scenario: Filter by pet size and special needs
    Given I have performed a search
    When I select pet size "M" and special need "Medication‑required"
    Then only sitters who accept medium dogs and administer medication are shown

  Scenario: Sort by rating
    Given results are displayed
    When I choose the "Rating" sort option
    Then sitter cards are ordered by rating descending
```

#### Testing (Playwright additions)

- **mapToggle.spec.ts** – Assert map renders via Mapbox GL JS, clusters when > 50 sitters in viewport.
- **petSizeFilter.spec.ts** – Seed two sitters (S, M); apply size filter; assert correct filtering.
- **sortRating.spec.ts** – Ensure sorting toggles query param and order.

### 2  Interactive Map Behavior & Sitter Visibility

#### Core Map Features
- **Map / List Synchronisation**  
  - Toggle sits in the results header (default **List**).  
  - In **Map** view, list remains visible in split‑screen on desktop (map 60%, list 40%); mobile shows map‑only with bottom sheet for results.
  - In **Map** view, panning/zooming does **not** auto‑refresh; instead a sticky **Search this area** button appears top‑right.  
  - An optional *Auto‑update as map moves* checkbox triggers live updates (mirrors Rover UX). [1]
- **Initial Viewport** – Centered on the user‑entered location; zoom calibrated to include ~50 closest matches (fallback: 15‑mile radius).
- **Pins & Clustering**  
  - Pins are **numbered** to match their card order in the list view (when visible in split‑screen mode).  
  - Marker clustering activates when > 50 sitters share the viewport; cluster bubbles display count and "explode" on zoom.
- **Heat‑Map Shading** – When the total sitter count in the current viewport exceeds **200**, render a translucent red‑to‑yellow density overlay beneath the pins.  Heat disappears when zoomed in beyond level 13 to avoid visual clutter.
- **Pin Metadata** – Overlays display nightly price, ★ rating, **repeat‑client %**, and Star‑Sitter badge (earned at 4.8+ rating with 50+ reviews). Hover reveals a mini‑profile tooltip (photo, name, distance, *View Profile*).
- **Privacy‑First Geocoding** – Apply ±400 ft random offset before rendering pins, constrained to valid land areas using reverse geocoding validation; the true address is shown only after a booking is confirmed, improving on Rover's exact pins. [2]
- **Service Radius Overlay (Optional)** – Toggle a dashed circle showing each sitter's travel radius; compensates for Rover's fixed ~1‑mile halo. [3]
- **Filter Coupling** – Active filters (pet size, special needs, price, etc.) limit visible pins; filtered‑out sitters fade to 30 % opacity and are non‑interactive.
- **Accessibility & Keyboard Support** – Map is fully navigable via arrow keys + Enter; an ARIA‑live region announces the top three visible sitters whenever the viewport changes.
- **Performance Targets** – Initial map bundle ≤ 250 kB (gzipped); first pin render ≤ 1 s on 4 G using Mapbox GL JS with lazy‑loaded vector tiles.
- **Analytics Hooks** – Emit `map_viewport_changed`, `map_pin_clicked`, `search_this_area`, and `heatmap_rendered` events with bounding‑box and result count.

#### Acceptance Criteria
```gherkin
Scenario: Map search updates only after user confirmation
  Given I have toggled to Map view
  When I drag the map 10 miles south
  Then the "Search this area" button becomes enabled
  And sitter pins do not change until I press the button

Scenario: Privacy offset on pins
  Given a sitter's geocoded address at LAT 47.6205, LNG -122.3493
  When the map renders pins
  Then the sitter's pin latitude and longitude differ by at least 50 ft and no more than 400 ft from the true address
```



### 3  Trust & Safety

#### Background Checks
- **Sitter Requirements**
  - Identity verification (government ID)
  - Criminal background check (U.S. only initially)
  - Reference check (2 references required)
  - Optional: Professional certifications (pet first aid, grooming, etc.)

#### Platform Guarantees
- **PetBnB Protection** – Up to $25,000 property damage protection
- **24/7 Support** – Emergency vet helpline and customer support
- **Secure Payments** – All payments processed through platform, held in escrow until 24h after service starts
- **Review System** – Two‑way reviews after each booking completion

### 4  Booking & Payments

#### Booking Flow
1. **Service Selection** – Choose service type, dates, and add pet details
2. **Request to Book** – Send message to sitter with booking request
3. **Sitter Response** – Accept/decline within 24 hours
4. **Payment** – Secure payment upon acceptance
5. **Confirmation** – Both parties receive confirmation with full details

#### Payment Structure
- **Platform Fee** – 15% service fee from sitters (vs Rover's 20%)
- **Guest Fee** – 3-5% processing fee for owners (vs Rover's 5-7%)
- **Payouts** – Sitters paid 24h after service starts via Stripe
- **Multi-pet Pricing** – Sitters set their own additional pet rates (displayed as "+$X per additional dog/cat")
- **Cancellations**
  - Owner cancels >7 days: Full refund
  - Owner cancels 3-7 days: 50% refund
  - Owner cancels <3 days: No refund
  - Sitter cancels: Full refund + platform penalty

### 5  Owner ↔ Sitter Messaging

*To be specified in next iteration.*

### 15  Competitive Differentiation

#### Key Differentiators vs Rover

1. **Lower Platform Fees**
   - **Sitter Fee** – 15% (vs Rover's 20%)
   - **Owner Fee** – 3-5% (vs Rover's 5-7%)
   - **Marketing Message** – "Keep more of what you earn" / "Pay less for quality care"

2. **Fee Transparency**
   - Show fee breakdown before booking
   - No hidden charges for premium features
   - All basic features included (messaging, calendar sync, etc.)

3. **Sitter Benefits Program**
   - Milestone bonuses at 10, 50, 100 bookings
   - Top sitter spotlight in search results
   - Free professional photoshoot at 25 bookings
   - Quarterly sitter appreciation perks

4. **Algorithm Transparency**
   - Show sitters why they rank where they do
   - Provide improvement suggestions
   - Clear path to better visibility

5. **Community Focus**
   - Local sitter meetups/training events
   - Sitter referral bonuses
   - Pet owner loyalty rewards (every 10th booking discounted)



####


## References
[1] Rover.com Community Q&A: "Can I search for a service member by neighborhood?" — details Rover's *Search this area* UX (accessed 29 Apr 2025).

[2] Reddit thread r/RoverPetSitting: "Rover search shows home addresses of sitters" — discusses privacy concerns around exact pin locations (accessed 29 Apr 2025).

[3] Rover.com Community Q&A: "Pet sitters service area map is not accurate anymore" — notes loss of adjustable service‑radius halo (accessed 29 Apr 2025).

---

## Outstanding Issues and Gaps

### ✅ ALL MAJOR ISSUES RESOLVED

The specification is now complete with:
- Full user stories for both owners and sitters
- Complete feature definitions including search, booking, payments, messaging
- Technical architecture decisions (REST API, responsive web)
- Business model with competitive differentiation (lower fees)
- Trust & safety framework
- Mobile-first responsive design
- Review and notification systems
- Data retention and privacy policies

### Remaining Minor Items for Future Iterations

1. **Owner ↔ Sitter Messaging** (Section 5) - Detailed messaging features to be specified
2. **Enhanced Sitter Features** - Dashboard, earnings reports, tax documents
3. **Admin Panel** - Content moderation, dispute resolution, analytics
4. **Internationalization** - Multi-currency, language support
5. **Advanced Features** - Pet health records, vet integration, GPS tracking