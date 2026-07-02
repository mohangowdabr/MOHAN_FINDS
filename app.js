/* ============================================
   RideFinder — Application Logic
   Fare Engine · Map · Geocoding · Routing · UI
   ============================================ */

// ──────────────────────────────────────────────
//  PLATFORM DATA & FARE RATES
// ──────────────────────────────────────────────

const PLATFORMS = {
  uber: {
    name: 'Uber',
    color: '#1a1a1a',
    accentColor: '#276ef1',
    textColor: '#ffffff',
    icon: 'U',
    platformFee: 5,
    taxPercent: 5,
    vehicles: {
      moto:    { name: 'Moto',    type: 'bike', base: 15, perKm: 5,  perMin: 0.5,  minFare: 25,  etaRange: [2, 6] },
      auto:    { name: 'Auto',    type: 'auto', base: 25, perKm: 9,  perMin: 1,    minFare: 35,  etaRange: [3, 8] },
      go:      { name: 'UberGo',  type: 'car',  base: 40, perKm: 12, perMin: 1.5,  minFare: 60,  etaRange: [3, 10] },
      premier: { name: 'Premier', type: 'car',  base: 60, perKm: 16, perMin: 2,    minFare: 100, etaRange: [5, 15] },
    },
    surgePattern: 'aggressive',
  },
  ola: {
    name: 'Ola',
    color: '#4caf50',
    accentColor: '#4caf50',
    textColor: '#ffffff',
    icon: 'O',
    platformFee: 5,
    taxPercent: 5,
    vehicles: {
      bike:  { name: 'Bike',  type: 'bike', base: 15, perKm: 5.5,  perMin: 0.5,  minFare: 25,  etaRange: [2, 7] },
      auto:  { name: 'Auto',  type: 'auto', base: 30, perKm: 9,    perMin: 1,    minFare: 40,  etaRange: [3, 9] },
      mini:  { name: 'Mini',  type: 'car',  base: 50, perKm: 11,   perMin: 1.5,  minFare: 70,  etaRange: [4, 10] },
      prime: { name: 'Prime', type: 'car',  base: 70, perKm: 14,   perMin: 2,    minFare: 110, etaRange: [5, 12] },
    },
    surgePattern: 'moderate',
  },
  rapido: {
    name: 'Rapido',
    color: '#FFCE00',
    accentColor: '#FFCE00',
    textColor: '#1a1a1a',
    icon: 'R',
    platformFee: 3,
    taxPercent: 5,
    vehicles: {
      bike:       { name: 'Bike',         type: 'bike', base: 10, perKm: 4,    perMin: 0.5,  minFare: 20,  etaRange: [1, 5] },
      auto:       { name: 'Auto',         type: 'auto', base: 25, perKm: 7,    perMin: 0.75, minFare: 30,  etaRange: [3, 8] },
      cabEconomy: { name: 'Cab Economy',  type: 'car',  base: 45, perKm: 10,   perMin: 1.25, minFare: 55,  etaRange: [4, 12] },
    },
    surgePattern: 'low',
  },
  blusmart: {
    name: 'BluSmart',
    color: '#0066FF',
    accentColor: '#0066FF',
    textColor: '#ffffff',
    icon: 'B',
    platformFee: 10,
    taxPercent: 5,
    vehicles: {
      sedan: { name: 'Electric Sedan', type: 'car', base: 55, perKm: 13, perMin: 1.75, minFare: 80, etaRange: [5, 15] },
    },
    surgePattern: 'none',
  },
  nammayatri: {
    name: 'Namma Yatri',
    color: '#FF6600',
    accentColor: '#FF6600',
    textColor: '#ffffff',
    icon: 'N',
    platformFee: 0,
    taxPercent: 0,
    vehicles: {
      auto: { name: 'Auto', type: 'auto', base: 30, perKm: 8,  perMin: 0.75, minFare: 30, etaRange: [3, 8] },
      cab:  { name: 'Cab',  type: 'car',  base: 45, perKm: 11, perMin: 1.25, minFare: 55, etaRange: [5, 12] },
    },
    surgePattern: 'none',
  },
};

// ──────────────────────────────────────────────
//  APPLICATION STATE
// ──────────────────────────────────────────────

const state = {
  pickup: { lat: null, lng: null, name: '' },
  drop:   { lat: null, lng: null, name: '' },
  routes: [],
  activeRouteIndex: 0,
  activeTab: 'all',      // 'all' | 'bike' | 'auto' | 'car'
  results: [],
  distanceKm: 0,
  durationMin: 0,
  isLoading: false,
};

// ──────────────────────────────────────────────
//  MAP INITIALIZATION
// ──────────────────────────────────────────────

// Default center: Bangalore
const DEFAULT_CENTER = [12.9716, 77.5946];
const DEFAULT_ZOOM = 13;

let map;
let pickupMarker = null;
let dropMarker = null;
let routeLayers = [];

function initMap() {
  map = L.map('map', {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Reposition zoom control
  map.zoomControl.setPosition('topright');
}

function createMarkerIcon(type) {
  const color = type === 'pickup' ? '#10b981' : '#ef4444';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="custom-marker__pulse custom-marker__pulse--${type}"></div>
      <div class="custom-marker__dot custom-marker__dot--${type}"></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function updateMarkers() {
  // Pickup marker
  if (state.pickup.lat && state.pickup.lng) {
    if (pickupMarker) {
      pickupMarker.setLatLng([state.pickup.lat, state.pickup.lng]);
    } else {
      pickupMarker = L.marker([state.pickup.lat, state.pickup.lng], {
        icon: createMarkerIcon('pickup'),
      }).addTo(map).bindPopup(`<strong>Pickup</strong><br>${state.pickup.name}`);
    }
  }

  // Drop marker
  if (state.drop.lat && state.drop.lng) {
    if (dropMarker) {
      dropMarker.setLatLng([state.drop.lat, state.drop.lng]);
    } else {
      dropMarker = L.marker([state.drop.lat, state.drop.lng], {
        icon: createMarkerIcon('drop'),
      }).addTo(map).bindPopup(`<strong>Drop</strong><br>${state.drop.name}`);
    }
  }

  // Fit bounds if both markers exist
  if (state.pickup.lat && state.drop.lat) {
    const bounds = L.latLngBounds(
      [state.pickup.lat, state.pickup.lng],
      [state.drop.lat, state.drop.lng]
    );
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  } else if (state.pickup.lat) {
    map.setView([state.pickup.lat, state.pickup.lng], 15);
  } else if (state.drop.lat) {
    map.setView([state.drop.lat, state.drop.lng], 15);
  }
}

function clearRoutes() {
  routeLayers.forEach(layer => map.removeLayer(layer));
  routeLayers = [];
}

function drawRoutes(routes) {
  clearRoutes();
  const colors = ['#6366f1', '#22d3ee', '#f59e0b'];
  const weights = [5, 4, 4];
  const opacities = [0.9, 0.5, 0.5];

  routes.forEach((route, i) => {
    const coords = decodePolyline(route.geometry);
    const polyline = L.polyline(coords, {
      color: colors[i] || '#64748b',
      weight: weights[i] || 3,
      opacity: opacities[i] || 0.4,
      smoothFactor: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeLayers.push(polyline);
  });
}

function highlightRoute(index) {
  const colors = ['#6366f1', '#22d3ee', '#f59e0b'];
  routeLayers.forEach((layer, i) => {
    if (i === index) {
      layer.setStyle({ weight: 5, opacity: 0.9, color: colors[i] || '#6366f1' });
      layer.bringToFront();
    } else {
      layer.setStyle({ weight: 3, opacity: 0.35, color: colors[i] || '#64748b' });
    }
  });
}

// Decode OSRM polyline (polyline6 encoding)
function decodePolyline(encoded) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

// ──────────────────────────────────────────────
//  GEOCODING (Nominatim)
// ──────────────────────────────────────────────

let geocodeAbortController = null;

async function geocodeSearch(query) {
  if (query.length < 3) return [];

  if (geocodeAbortController) geocodeAbortController.abort();
  geocodeAbortController = new AbortController();

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '6',
      countrycodes: 'in',
    });

    // Bias results toward the current map viewport for better local results
    if (map) {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      params.set('viewbox', `${sw.lng},${ne.lat},${ne.lng},${sw.lat}`);
      params.set('bounded', '0'); // prefer but don't restrict to viewbox
    }

    // If we already have a pickup location, bias drop search near it
    if (state.pickup.lat && !state.drop.lat) {
      const lat = state.pickup.lat;
      const lng = state.pickup.lng;
      const delta = 0.3; // ~30km radius
      params.set('viewbox', `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`);
    }

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      signal: geocodeAbortController.signal,
      headers: { 'Accept-Language': 'en' },
    });

    if (!res.ok) throw new Error('Geocoding failed');
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return [];
    console.error('Geocoding error:', err);
    return [];
  }
}

// ──────────────────────────────────────────────
//  ROUTING (OSRM)
// ──────────────────────────────────────────────

async function fetchRoutes(pickupLng, pickupLat, dropLng, dropLat) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${dropLng},${dropLat}?overview=full&alternatives=3&steps=false&geometries=polyline`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Routing failed');
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes.length) {
      throw new Error('No routes found');
    }

    return data.routes.map((r, i) => ({
      index: i,
      distanceKm: +(r.distance / 1000).toFixed(1),
      durationMin: +(r.duration / 60).toFixed(0),
      geometry: r.geometry,
    }));
  } catch (err) {
    console.error('Routing error:', err);
    return [];
  }
}

// ──────────────────────────────────────────────
//  FARE CALCULATION ENGINE
// ──────────────────────────────────────────────

function getSurgeMultiplier(surgePattern) {
  const hour = new Date().getHours();

  const patterns = {
    aggressive: () => {
      if (hour >= 7 && hour <= 10) return randomBetween(1.3, 1.8);
      if (hour >= 17 && hour <= 21) return randomBetween(1.4, 2.0);
      if (hour >= 23 || hour <= 5) return randomBetween(1.2, 1.5);
      return randomBetween(1.0, 1.1);
    },
    moderate: () => {
      if (hour >= 7 && hour <= 10) return randomBetween(1.1, 1.4);
      if (hour >= 17 && hour <= 21) return randomBetween(1.2, 1.6);
      if (hour >= 23 || hour <= 5) return randomBetween(1.1, 1.3);
      return randomBetween(1.0, 1.05);
    },
    low: () => {
      if (hour >= 7 && hour <= 10) return randomBetween(1.0, 1.2);
      if (hour >= 17 && hour <= 21) return randomBetween(1.1, 1.3);
      return 1.0;
    },
    none: () => 1.0,
  };

  return +(patterns[surgePattern] || patterns.none)().toFixed(1);
}

function calculateFare(platformKey, vehicleKey, distanceKm, durationMin) {
  const platform = PLATFORMS[platformKey];
  const vehicle = platform.vehicles[vehicleKey];
  if (!vehicle) return null;

  const surge = getSurgeMultiplier(platform.surgePattern);

  const baseFare = vehicle.base;
  const distanceCharge = distanceKm * vehicle.perKm;
  const timeCharge = durationMin * vehicle.perMin;
  const subtotal = (baseFare + distanceCharge + timeCharge) * surge;
  const platformFee = platform.platformFee;
  const tax = subtotal * (platform.taxPercent / 100);
  let total = subtotal + platformFee + tax;

  // Apply minimum fare
  total = Math.max(total, vehicle.minFare);

  // Add ±8% random variance for realism
  const variance = randomBetween(0.92, 1.08);
  total = total * variance;

  // Generate ETA
  const eta = Math.floor(randomBetween(vehicle.etaRange[0], vehicle.etaRange[1]));

  return {
    platformKey,
    platformName: platform.name,
    platformColor: platform.color,
    platformAccentColor: platform.accentColor,
    platformTextColor: platform.textColor,
    platformIcon: platform.icon,
    vehicleKey,
    vehicleName: vehicle.name,
    vehicleType: vehicle.type,
    fare: Math.round(total),
    surge,
    eta,
    breakdown: {
      baseFare: Math.round(baseFare),
      distanceCharge: Math.round(distanceCharge),
      timeCharge: Math.round(timeCharge),
      surgeMultiplier: surge,
      platformFee: Math.round(platformFee),
      tax: Math.round(tax),
    },
  };
}

function calculateAllFares(distanceKm, durationMin) {
  const results = [];

  for (const [platformKey, platform] of Object.entries(PLATFORMS)) {
    for (const [vehicleKey, vehicle] of Object.entries(platform.vehicles)) {
      const result = calculateFare(platformKey, vehicleKey, distanceKm, durationMin);
      if (result) results.push(result);
    }
  }

  // Sort by fare (cheapest first)
  results.sort((a, b) => a.fare - b.fare);

  return results;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// ──────────────────────────────────────────────
//  UI RENDERING
// ──────────────────────────────────────────────

function renderAutocompleteResults(results, dropdownEl) {
  if (!results.length) {
    dropdownEl.classList.remove('active');
    return;
  }

  dropdownEl.innerHTML = results.map((r, i) => {
    const displayName = r.display_name.length > 60
      ? r.display_name.substring(0, 60) + '…'
      : r.display_name;
    return `
      <div class="autocomplete-item" data-index="${i}" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${escapeHtml(r.display_name)}" role="option">
        <span class="autocomplete-item__icon">📍</span>
        <span class="autocomplete-item__text">${escapeHtml(displayName)}</span>
      </div>
    `;
  }).join('');

  dropdownEl.classList.add('active');
}

function renderRideCards(results) {
  const container = document.getElementById('ride-cards-container');
  const resultsPanel = document.getElementById('results-panel');
  const welcomeState = document.getElementById('welcome-state');
  const countEl = document.getElementById('results-count');

  // Filter by active tab
  const filtered = state.activeTab === 'all'
    ? results
    : results.filter(r => r.vehicleType === state.activeTab);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="welcome-state" style="padding: 2rem 0;">
        <div class="welcome-state__icon">🔍</div>
        <p class="welcome-state__title">No ${state.activeTab} options</p>
        <p class="welcome-state__text">No ${state.activeTab} rides available for this route. Try another vehicle type.</p>
      </div>
    `;
    countEl.textContent = '0 results';
    resultsPanel.classList.add('visible');
    welcomeState.style.display = 'none';
    return;
  }

  countEl.textContent = `${filtered.length} options`;

  const cheapest = filtered[0].fare;
  const mostExpensive = filtered[filtered.length - 1].fare;

  container.innerHTML = filtered.map((r, i) => {
    const isBest = i === 0;
    const surgeHtml = r.surge > 1
      ? `<span class="surge-badge ${r.surge >= 1.5 ? 'surge-badge--high' : ''}">⚡ ${r.surge}x</span>`
      : '';

    return `
      <div class="ride-card ${isBest ? 'ride-card--best' : ''}" data-index="${i}" id="ride-card-${i}">
        ${isBest ? '<div class="ride-card__best-badge">✦ Best Price</div>' : ''}
        <div class="ride-card__main">
          <div class="ride-card__platform-icon" style="background:${r.platformColor};color:${r.platformTextColor}">
            ${r.platformIcon}
          </div>
          <div class="ride-card__info">
            <div class="ride-card__platform-name">
              ${escapeHtml(r.platformName)} ${surgeHtml}
            </div>
            <div class="ride-card__vehicle-name">${getVehicleEmoji(r.vehicleType)} ${escapeHtml(r.vehicleName)}</div>
          </div>
          <div class="ride-card__pricing">
            <div class="ride-card__price">₹${r.fare}</div>
            <div class="ride-card__eta">${r.eta} min away</div>
          </div>
        </div>
        <div class="ride-card__details">
          <div class="ride-card__breakdown">
            <div class="breakdown-item">
              <span>Base fare</span>
              <span class="breakdown-item__value">₹${r.breakdown.baseFare}</span>
            </div>
            <div class="breakdown-item">
              <span>Distance (${state.distanceKm} km)</span>
              <span class="breakdown-item__value">₹${r.breakdown.distanceCharge}</span>
            </div>
            <div class="breakdown-item">
              <span>Time (${state.durationMin} min)</span>
              <span class="breakdown-item__value">₹${r.breakdown.timeCharge}</span>
            </div>
            <div class="breakdown-item">
              <span>Surge</span>
              <span class="breakdown-item__value">${r.breakdown.surgeMultiplier}x</span>
            </div>
            <div class="breakdown-item">
              <span>Platform fee</span>
              <span class="breakdown-item__value">₹${r.breakdown.platformFee}</span>
            </div>
            <div class="breakdown-item">
              <span>Tax</span>
              <span class="breakdown-item__value">₹${r.breakdown.tax}</span>
            </div>
            <div class="breakdown-item breakdown-item--total">
              <span>Total</span>
              <span class="breakdown-item__value">₹${r.fare}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  resultsPanel.classList.add('visible');
  welcomeState.style.display = 'none';

  // Attach expand listeners
  container.querySelectorAll('.ride-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });
  });

  // Update trip summary
  updateTripSummary(cheapest, mostExpensive);
}

function renderRouteOptions(routes) {
  const panel = document.getElementById('route-panel');
  const list = document.getElementById('route-options-list');

  if (!routes.length) {
    panel.classList.remove('visible');
    return;
  }

  const colors = ['#6366f1', '#22d3ee', '#f59e0b'];
  const fastest = routes.reduce((a, b) => a.durationMin < b.durationMin ? a : b);
  const shortest = routes.reduce((a, b) => a.distanceKm < b.distanceKm ? a : b);

  list.innerHTML = routes.map((r, i) => {
    let badge = '';
    if (r === fastest && r === shortest) {
      badge = '<span class="route-option__badge route-option__badge--fastest">Best</span>';
    } else if (r === fastest) {
      badge = '<span class="route-option__badge route-option__badge--fastest">Fastest</span>';
    } else if (r === shortest) {
      badge = '<span class="route-option__badge route-option__badge--shortest">Shortest</span>';
    }

    return `
      <div class="route-option ${i === state.activeRouteIndex ? 'active' : ''}" data-route-index="${i}">
        <div class="route-option__color" style="background:${colors[i] || '#64748b'}"></div>
        <div class="route-option__info">
          <div class="route-option__name">Route ${i + 1}</div>
          <div class="route-option__details">${r.distanceKm} km · ${r.durationMin} min</div>
        </div>
        ${badge}
      </div>
    `;
  }).join('');

  panel.classList.add('visible');

  // Attach route click handlers
  list.querySelectorAll('.route-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const idx = parseInt(opt.dataset.routeIndex);
      state.activeRouteIndex = idx;
      state.distanceKm = routes[idx].distanceKm;
      state.durationMin = routes[idx].durationMin;

      // Re-render
      list.querySelectorAll('.route-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      highlightRoute(idx);

      // Recalculate fares for new route
      state.results = calculateAllFares(state.distanceKm, state.durationMin);
      renderRideCards(state.results);
      updateMapStats();
    });
  });
}

function updateMapStats() {
  const distEl = document.getElementById('stat-distance');
  const durEl = document.getElementById('stat-duration');
  const distValEl = document.getElementById('stat-distance-value');
  const durValEl = document.getElementById('stat-duration-value');

  if (state.distanceKm > 0) {
    distValEl.textContent = `${state.distanceKm} km`;
    durValEl.textContent = `${state.durationMin} min`;
    distEl.classList.add('visible');
    durEl.classList.add('visible');
  } else {
    distEl.classList.remove('visible');
    durEl.classList.remove('visible');
  }
}

function updateTripSummary(cheapest, mostExpensive) {
  const summary = document.getElementById('trip-summary');
  document.getElementById('summary-distance').textContent = `${state.distanceKm} km`;
  document.getElementById('summary-duration').textContent = `${state.durationMin} min`;
  document.getElementById('summary-best-price').textContent = `₹${cheapest}`;

  const savings = mostExpensive - cheapest;
  if (savings > 0) {
    document.getElementById('summary-savings-value').textContent = `₹${savings}`;
    document.getElementById('summary-savings').style.display = '';
  } else {
    document.getElementById('summary-savings').style.display = 'none';
  }

  summary.classList.add('visible');
}

function updateSurgeBanner() {
  const hour = new Date().getHours();
  const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21) || hour >= 23 || hour <= 5;
  const banner = document.getElementById('surge-banner');
  const bannerText = document.getElementById('surge-banner-text');

  if (isPeak) {
    if (hour >= 7 && hour <= 10) {
      bannerText.textContent = '⚡ Morning rush hour — surge pricing active on Uber & Ola';
    } else if (hour >= 17 && hour <= 21) {
      bannerText.textContent = '⚡ Evening peak — higher surge on most platforms';
    } else {
      bannerText.textContent = '⚡ Late night pricing — slightly elevated fares';
    }
    banner.classList.add('visible');
  } else {
    banner.classList.remove('visible');
  }
}

function showLoading(text) {
  state.isLoading = true;
  const overlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  loadingText.textContent = text || 'Comparing prices across platforms...';
  overlay.classList.add('active');
}

function hideLoading() {
  state.isLoading = false;
  document.getElementById('loading-overlay').classList.remove('active');
}

function getVehicleEmoji(type) {
  switch (type) {
    case 'bike': return '🏍️';
    case 'auto': return '🛺';
    case 'car':  return '🚗';
    default:     return '🚕';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ──────────────────────────────────────────────
//  MAIN SEARCH FLOW
// ──────────────────────────────────────────────

async function performSearch() {
  if (!state.pickup.lat || !state.drop.lat) {
    alert('Please enter both pickup and drop locations');
    return;
  }

  showLoading('Finding best routes...');

  // Fetch routes
  const routes = await fetchRoutes(
    state.pickup.lng, state.pickup.lat,
    state.drop.lng, state.drop.lat
  );

  if (!routes.length) {
    hideLoading();
    alert('Could not find a route between these locations. Please try different locations.');
    return;
  }

  state.routes = routes;
  state.activeRouteIndex = 0;
  state.distanceKm = routes[0].distanceKm;
  state.durationMin = parseInt(routes[0].durationMin);

  // Draw routes on map
  updateMarkers();
  drawRoutes(routes);
  highlightRoute(0);

  // Render route options
  renderRouteOptions(routes);

  // Update loading text
  document.getElementById('loading-text').textContent = 'Comparing prices across 5 platforms...';

  // Simulate network delay for realism
  await sleep(600);

  // Calculate fares
  state.results = calculateAllFares(state.distanceKm, state.durationMin);

  // Update UI
  renderRideCards(state.results);
  updateMapStats();
  updateSurgeBanner();

  hideLoading();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
//  EVENT LISTENERS
// ──────────────────────────────────────────────

function initEventListeners() {
  const pickupInput = document.getElementById('pickup-input');
  const dropInput = document.getElementById('drop-input');
  const pickupDropdown = document.getElementById('pickup-dropdown');
  const dropDropdown = document.getElementById('drop-dropdown');
  const swapBtn = document.getElementById('swap-btn');
  const searchBtn = document.getElementById('btn-search');
  const locateBtn = document.getElementById('btn-locate');

  // --- Autocomplete for Pickup ---
  let pickupDebounce = null;
  pickupInput.addEventListener('input', () => {
    clearTimeout(pickupDebounce);
    pickupDebounce = setTimeout(async () => {
      const results = await geocodeSearch(pickupInput.value.trim());
      renderAutocompleteResults(results, pickupDropdown);
    }, 400);
  });

  pickupDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;
    state.pickup = {
      lat: parseFloat(item.dataset.lat),
      lng: parseFloat(item.dataset.lng),
      name: item.dataset.name,
    };
    pickupInput.value = item.dataset.name;
    pickupDropdown.classList.remove('active');
    updateMarkers();
  });

  // --- Autocomplete for Drop ---
  let dropDebounce = null;
  dropInput.addEventListener('input', () => {
    clearTimeout(dropDebounce);
    dropDebounce = setTimeout(async () => {
      const results = await geocodeSearch(dropInput.value.trim());
      renderAutocompleteResults(results, dropDropdown);
    }, 400);
  });

  dropDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;
    state.drop = {
      lat: parseFloat(item.dataset.lat),
      lng: parseFloat(item.dataset.lng),
      name: item.dataset.name,
    };
    dropInput.value = item.dataset.name;
    dropDropdown.classList.remove('active');
    updateMarkers();
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#pickup-group')) pickupDropdown.classList.remove('active');
    if (!e.target.closest('#drop-group')) dropDropdown.classList.remove('active');
  });

  // --- Swap Button ---
  swapBtn.addEventListener('click', () => {
    const tmpLoc = { ...state.pickup };
    state.pickup = { ...state.drop };
    state.drop = tmpLoc;
    pickupInput.value = state.pickup.name;
    dropInput.value = state.drop.name;

    // Remove old markers and re-add
    if (pickupMarker) { map.removeLayer(pickupMarker); pickupMarker = null; }
    if (dropMarker) { map.removeLayer(dropMarker); dropMarker = null; }
    updateMarkers();

    // If we had results, recalculate
    if (state.results.length) {
      performSearch();
    }
  });

  // --- Search Button ---
  searchBtn.addEventListener('click', performSearch);

  // Enter key triggers search
  pickupInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      pickupDropdown.classList.remove('active');
      if (state.pickup.lat && state.drop.lat) performSearch();
      else dropInput.focus();
    }
  });

  dropInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      dropDropdown.classList.remove('active');
      if (state.pickup.lat && state.drop.lat) performSearch();
    }
  });

  // --- My Location Button ---
  locateBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    locateBtn.disabled = true;
    locateBtn.innerHTML = '<span>⏳</span> Locating...';

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        state.pickup = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My Location',
        };

        // Reverse geocode for better name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          if (data.display_name) {
            state.pickup.name = data.display_name;
          }
        } catch (err) {
          // Keep "My Location" as fallback
        }

        pickupInput.value = state.pickup.name;
        updateMarkers();
        locateBtn.disabled = false;
        locateBtn.innerHTML = '<span>📍</span> My Location';
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Could not get your location. Please enter it manually.');
        locateBtn.disabled = false;
        locateBtn.innerHTML = '<span>📍</span> My Location';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // --- Vehicle Type Tabs ---
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.activeTab = tab.dataset.type;

      if (state.results.length) {
        renderRideCards(state.results);
      }
    });
  });

  // --- Map click to set locations ---
  map.on('click', (e) => {
    if (!state.pickup.lat) {
      state.pickup = { lat: e.latlng.lat, lng: e.latlng.lng, name: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}` };
      pickupInput.value = state.pickup.name;

      // Reverse geocode
      reverseGeocode(e.latlng.lat, e.latlng.lng).then(name => {
        if (name) {
          state.pickup.name = name;
          pickupInput.value = name;
          if (pickupMarker) pickupMarker.setPopupContent(`<strong>Pickup</strong><br>${name}`);
        }
      });
    } else if (!state.drop.lat) {
      state.drop = { lat: e.latlng.lat, lng: e.latlng.lng, name: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}` };
      dropInput.value = state.drop.name;

      reverseGeocode(e.latlng.lat, e.latlng.lng).then(name => {
        if (name) {
          state.drop.name = name;
          dropInput.value = name;
          if (dropMarker) dropMarker.setPopupContent(`<strong>Drop</strong><br>${name}`);
        }
      });
    }

    // Remove old markers to re-create with new positions
    if (pickupMarker) { map.removeLayer(pickupMarker); pickupMarker = null; }
    if (dropMarker) { map.removeLayer(dropMarker); dropMarker = null; }
    updateMarkers();
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
//  INITIALIZATION
// ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initEventListeners();
  updateSurgeBanner();

  // Focus pickup input
  setTimeout(() => {
    document.getElementById('pickup-input').focus();
  }, 300);
});
