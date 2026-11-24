(() => {
  'use strict';

  const COUNTRY = 'India';
  const LOCATION_API = 'https://countriesnow.space/api/v0.1';
  const PHOTON_API = 'https://photon.komoot.io/api/';
  const PHOTON_REVERSE_API = 'https://photon.komoot.io/reverse';

  const OVERPASS_ENDPOINTS = [
    'https://ovp.dresel.systems/api-as/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass-api.de/api/interpreter'
  ];

  const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
  const REQUEST_TIMEOUT = 12000;
  const OVERPASS_TIMEOUT = 25000;

  let indiaStates = [];
  let currentCinemas = [];
  let selectedLocation = { state: '', city: '' };

  const cityCache = new Map();

  const elements = {
    stateFilter: document.querySelector('#state-filter'),
    cityFilter: document.querySelector('#city-filter'),
    openCityListings: document.querySelector('#open-city-listings'),
    movieFilter: document.querySelector('#movie-filter'),
    dateFilter: document.querySelector('#date-filter'),
    formatFilter: document.querySelector('#format-filter'),
    listingSearch: document.querySelector('#listing-search'),
    headerSearch: document.querySelector('#header-search'),
    cinemaResults: document.querySelector('#cinema-results'),
    locationEmpty: document.querySelector('#location-empty'),
    refreshListings: document.querySelector('#refresh-listings'),
    detectLocation: document.querySelector('#detect-location'),
    heroLocationButton: document.querySelector('#hero-location-button'),
    headerLocation: document.querySelector('#header-location'),
    locationFeedback: document.querySelector('#location-feedback'),
    sourceIndicator: document.querySelector('#source-indicator'),
    sourceLabel: document.querySelector('#source-label'),
    sourceDetail: document.querySelector('#source-detail'),
    lastUpdated: document.querySelector('#last-updated'),
    cinemaCount: document.querySelector('#cinema-count'),
    movieCount: document.querySelector('#movie-count'),
    resultsDetail: document.querySelector('#results-detail'),
    emptyTitle: document.querySelector('#empty-title'),
    emptyCopy: document.querySelector('#empty-copy'),
    realMovieGrid: document.querySelector('#real-movie-grid'),
    upcomingMovieGrid: document.querySelector('#upcoming-movie-grid')
  };

  const escapeHTML = (val) => String(val ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const norm = (val) => String(val ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  function storageGet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.timestamp || Date.now() - parsed.timestamp > CACHE_DURATION) return null;
      return parsed.data;
    } catch { return null; }
  }

  function storageSet(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch { /* ignore */ }
  }

  async function fetchJSON(url, options = {}, timeout = REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return JSON.parse(text);
    } finally {
      clearTimeout(timer);
    }
  }

  function updateFeedback(msg, type = 'info') {
    if (elements.locationFeedback) {
      elements.locationFeedback.textContent = msg;
      elements.locationFeedback.className = `location-feedback ${type}`;
    }
  }

  function updateStatus(status, detail) {
    if (elements.sourceIndicator) elements.sourceIndicator.dataset.status = status;
    if (elements.sourceLabel) elements.sourceLabel.textContent = status === 'loading' ? 'Searching...' : 'CineBuzz Cinema Listings';
    if (elements.sourceDetail) elements.sourceDetail.textContent = detail;
    if (elements.lastUpdated) elements.lastUpdated.textContent = new Date().toLocaleTimeString();
  }

  /* ==========================================================================
     UNIFIED FILTER ENGINE (Filters Movie Grids & Cinemas Simultaneously)
     ========================================================================== */
  function applyAllFilters() {
    const query = norm(elements.listingSearch?.value || elements.headerSearch?.value || '');
    const selectedMovieTitle = elements.movieFilter?.value || '';
    const selectedFormat = elements.formatFilter?.value || '';

    // 1. Filter Now Showing Cards
    const nowShowingCards = elements.realMovieGrid?.querySelectorAll('.real-movie-card') || [];
    let visibleNowShowing = 0;

    nowShowingCards.forEach((card) => {
      const title = norm(card.querySelector('h3')?.textContent);
      const textContent = norm(card.textContent);
      const cardMovieId = card.dataset.movieId;
      const movieObj = (window.CINEBUZZ_MOVIES || []).find((m) => m.id === cardMovieId || norm(m.title) === title);

      const matchesSearch = !query || textContent.includes(query);
      const matchesMovie = !selectedMovieTitle || title === norm(selectedMovieTitle);
      const matchesFormat = !selectedFormat || (movieObj?.formats || ['2D']).includes(selectedFormat);

      const isVisible = matchesSearch && matchesMovie && matchesFormat;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleNowShowing++;
    });

    // Handle empty state for Now Showing
    let nowShowingEmpty = document.querySelector('#now-showing-empty-msg');
    if (visibleNowShowing === 0) {
      if (!nowShowingEmpty && elements.realMovieGrid) {
        nowShowingEmpty = document.createElement('div');
        nowShowingEmpty.id = 'now-showing-empty-msg';
        nowShowingEmpty.className = 'glass-panel';
        nowShowingEmpty.style.cssText = 'grid-column: 1/-1; padding: 24px; text-align: center; margin: 12px 0;';
        nowShowingEmpty.innerHTML = `
          <p style="color:var(--muted);margin-bottom:10px;">No movies found matching "<strong>${escapeHTML(query || selectedMovieTitle || selectedFormat)}</strong>".</p>
          <button type="button" class="btn btn-ghost btn-sm" id="btn-clear-movie-filters">Clear filters</button>
        `;
        elements.realMovieGrid.after(nowShowingEmpty);
        document.querySelector('#btn-clear-movie-filters')?.addEventListener('click', resetFilters);
      }
    } else if (nowShowingEmpty) {
      nowShowingEmpty.remove();
    }

    // 2. Filter Upcoming Cards
    const upcomingCards = elements.upcomingMovieGrid?.querySelectorAll('.real-movie-card') || [];
    upcomingCards.forEach((card) => {
      const textContent = norm(card.textContent);
      const isVisible = !query || textContent.includes(query);
      card.style.display = isVisible ? '' : 'none';
    });

    // 3. Filter Cinema Venues & Showtimes
    renderCinemas();
  }

  function resetFilters() {
    if (elements.listingSearch) elements.listingSearch.value = '';
    if (elements.headerSearch) elements.headerSearch.value = '';
    if (elements.movieFilter) elements.movieFilter.value = '';
    if (elements.formatFilter) elements.formatFilter.value = '';
    applyAllFilters();
  }

  /* ==========================================================================
     Cinema Card & Showtime Rendering
     ========================================================================== */
  function renderCinemas() {
    const container = elements.cinemaResults;
    if (!container) return;

    container.innerHTML = '';
    const state = selectedLocation.state;
    const city = selectedLocation.city;

    if (!city) {
      if (elements.locationEmpty) elements.locationEmpty.hidden = false;
      container.hidden = true;
      if (elements.cinemaCount) elements.cinemaCount.textContent = '0';
      if (elements.movieCount) elements.movieCount.textContent = '0';
      return;
    }

    if (elements.locationEmpty) elements.locationEmpty.hidden = true;
    container.hidden = false;

    const query = norm(elements.listingSearch?.value || elements.headerSearch?.value || '');
    const movieFilterVal = elements.movieFilter?.value || '';
    const formatFilterVal = elements.formatFilter?.value || '';

    const allMovies = (window.CINEBUZZ_MOVIES || []).filter((m) => m.status === 'now-showing');

    // Filter which movies are eligible to show under cinemas
    let eligibleMovies = allMovies.filter((movie) => {
      const matchesSearch = !query || norm(movie.title).includes(query) || norm(movie.language).includes(query) || (movie.genres || []).some(g => norm(g).includes(query));
      const matchesMovie = !movieFilterVal || movie.title === movieFilterVal;
      const matchesFormat = !formatFilterVal || (movie.formats || ['2D']).includes(formatFilterVal);
      return matchesSearch && matchesMovie && matchesFormat;
    });

    // Filter cinemas by search query if applicable
    let eligibleCinemas = currentCinemas;
    if (query) {
      const matchedByCinema = currentCinemas.filter((c) => norm(c.name).includes(query) || norm(c.address).includes(query));
      if (matchedByCinema.length) {
        eligibleCinemas = matchedByCinema;
        // If user explicitly searched cinema name, display all movies for that cinema
        if (!movieFilterVal && !eligibleMovies.length) {
          eligibleMovies = allMovies;
        }
      }
    }

    if (elements.cinemaCount) elements.cinemaCount.textContent = String(eligibleCinemas.length);
    if (elements.movieCount) elements.movieCount.textContent = String(eligibleMovies.length);
    if (elements.resultsDetail) elements.resultsDetail.textContent = `Showing cinemas and showtimes in ${city}, ${state}`;

    if (!eligibleCinemas.length || !eligibleMovies.length) {
      container.innerHTML = `
        <div class="cinema-empty-state glass-panel" style="padding:24px;text-align:center;">
          <h3>No matching showtimes found</h3>
          <p style="color:var(--muted);margin-top:6px;">Try clearing your search query or selecting "All movies".</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-reset-cinemas" style="margin-top:12px;">Show all shows</button>
        </div>
      `;
      document.querySelector('#btn-reset-cinemas')?.addEventListener('click', resetFilters);
      return;
    }

    const showtimesList = ['10:30 AM', '01:45 PM', '05:00 PM', '08:15 PM', '10:45 PM'];

    eligibleCinemas.forEach((cinema) => {
      const card = document.createElement('article');
      card.className = 'venue-card glass-panel';
      card.style.marginBottom = '20px';

      let movieRowsHtml = '';
      eligibleMovies.slice(0, 4).forEach((movie) => {
        const format = formatFilterVal || movie.formats?.[0] || '2D';
        const price = format === 'IMAX' ? 450 : format === '4DX' ? 400 : format === '3D' ? 320 : 250;

        const showButtons = showtimesList.map((time) => `
          <button class="showtime-btn" type="button"
                  data-movie-id="${escapeHTML(movie.id)}"
                  data-movie-title="${escapeHTML(movie.title)}"
                  data-movie-poster="${escapeHTML(movie.poster)}"
                  data-venue="${escapeHTML(cinema.name)}"
                  data-address="${escapeHTML(cinema.address)}"
                  data-city="${escapeHTML(city)}"
                  data-state="${escapeHTML(state)}"
                  data-format="${escapeHTML(format)}"
                  data-price="${price}"
                  data-show="${time}">
            <b>${time}</b>
            <small>${format} · ₹${price}</small>
          </button>
        `).join('');

        movieRowsHtml += `
          <div class="venue-movie-row" style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px;">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">
              <strong style="font-size:1.05rem;">${escapeHTML(movie.title)}</strong>
              <span class="badge">${escapeHTML(format)}</span>
              <span style="font-size:.8rem;color:var(--muted);">${escapeHTML(movie.language)}</span>
            </div>
            <div class="showtimes-grid" style="display:flex;flex-wrap:wrap;gap:8px;">
              ${showButtons}
            </div>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="v-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="font-size:1.2rem;margin-bottom:4px;">${escapeHTML(cinema.name)}</h3>
            <p style="color:var(--muted);font-size:.85rem;">📍 ${escapeHTML(cinema.address)}</p>
          </div>
          <span class="badge" style="background:var(--brand-soft);color:var(--brand);font-weight:700;">M-TICKET</span>
        </div>
        ${movieRowsHtml}
      `;

      container.appendChild(card);
    });

    // Showtime Click -> Booking Flow Transition
    container.querySelectorAll('.showtime-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bookingData = {
          movieId: btn.dataset.movieId,
          movie: btn.dataset.movieTitle,
          poster: btn.dataset.moviePoster,
          venue: btn.dataset.venue,
          address: btn.dataset.address,
          city: btn.dataset.city,
          state: btn.dataset.state,
          format: btn.dataset.format,
          show: btn.dataset.show,
          ticketPrice: Number(btn.dataset.price),
          reclinerPrice: Number(btn.dataset.price) + 140,
          isoDate: elements.dateFilter?.value || new Date().toISOString().slice(0, 10),
          date: elements.dateFilter?.selectedOptions[0]?.textContent || 'Today'
        };

        if (window.saveBooking) {
          window.saveBooking(bookingData);
        } else {
          try { sessionStorage.setItem('cinebuzzBooking', JSON.stringify(bookingData)); } catch {}
        }

        window.location.href = 'booking.html';
      });
    });
  }

  /* ==========================================================================
     State and City Setup
     ========================================================================== */
  async function loadStates() {
    const cacheKey = 'cinebuzz_states_v4';
    const cached = storageGet(cacheKey);
    if (Array.isArray(cached) && cached.length) {
      indiaStates = cached;
      populateStates();
      return;
    }

    try {
      updateStatus('loading', 'Loading Indian states...');
      const res = await fetchJSON(`${LOCATION_API}/countries/states/q?country=${encodeURIComponent(COUNTRY)}`);
      const states = Array.isArray(res.data?.states) ? res.data.states : [];
      indiaStates = states.map((s) => s.name || s).filter(Boolean).sort((a, b) => a.localeCompare(b));
      if (!indiaStates.length) throw new Error('Empty state list');
      storageSet(cacheKey, indiaStates);
      populateStates();
      updateStatus('idle', `${indiaStates.length} states loaded.`);
    } catch {
      indiaStates = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Kerala', 'Punjab'];
      populateStates();
    }
  }

  function populateStates() {
    if (!elements.stateFilter) return;
    elements.stateFilter.innerHTML = '<option value="">Choose a state</option>';
    indiaStates.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      elements.stateFilter.appendChild(opt);
    });
  }

  async function loadCities(state) {
    if (!state) return [];
    const cacheKey = `cinebuzz_cities_${norm(state)}`;
    if (cityCache.has(cacheKey)) return cityCache.get(cacheKey);
    const cached = storageGet(cacheKey);
    if (cached) {
      cityCache.set(cacheKey, cached);
      return cached;
    }

    try {
      const res = await fetchJSON(`${LOCATION_API}/countries/state/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: COUNTRY, state })
      });
      const cities = (res.data || []).filter(Boolean).sort((a, b) => a.localeCompare(b));
      cityCache.set(cacheKey, cities);
      storageSet(cacheKey, cities);
      return cities;
    } catch {
      return ['Central ' + state, 'North ' + state, 'South ' + state];
    }
  }

  async function populateCities(preselect = '') {
    const state = elements.stateFilter?.value;
    if (!elements.cityFilter) return;

    if (!state) {
      elements.cityFilter.disabled = true;
      elements.cityFilter.innerHTML = '<option value="">Select a state first</option>';
      if (elements.openCityListings) elements.openCityListings.disabled = true;
      return;
    }

    elements.cityFilter.disabled = true;
    elements.cityFilter.innerHTML = '<option value="">Loading cities...</option>';

    const cities = await loadCities(state);
    elements.cityFilter.innerHTML = '<option value="">Select City</option>';
    cities.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      elements.cityFilter.appendChild(opt);
    });

    if (preselect) {
      const match = cities.find((c) => norm(c) === norm(preselect));
      if (match) {
        elements.cityFilter.value = match;
      } else {
        const customOpt = document.createElement('option');
        customOpt.value = preselect;
        customOpt.textContent = `${preselect} (detected)`;
        elements.cityFilter.appendChild(customOpt);
        elements.cityFilter.value = preselect;
      }
    }

    elements.cityFilter.disabled = false;
    if (elements.openCityListings) elements.openCityListings.disabled = !elements.cityFilter.value;
  }

  /* ==========================================================================
     Cinema Discovery (Overpass with failover)
     ========================================================================== */
  async function discoverCinemas(city, state) {
    let lat = 28.6139;
    let lon = 77.2090;

    try {
      const geo = await fetchJSON(`${PHOTON_API}?q=${encodeURIComponent(`${city}, ${state}, India`)}&limit=1`);
      if (geo.features?.[0]?.geometry?.coordinates) {
        [lon, lat] = geo.features[0].geometry.coordinates;
      }
    } catch { /* proceed */ }

    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="cinema"](around:12000,${lat},${lon});
        way["amenity"="cinema"](around:12000,${lat},${lon});
      );
      out center tags;
    `;

    for (const ep of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetchJSON(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: query })
        }, OVERPASS_TIMEOUT);

        if (Array.isArray(res.elements) && res.elements.length > 0) {
          return res.elements.map((el, i) => {
            const tags = el.tags || {};
            const name = tags.name || tags.brand || `Cinema ${i + 1}`;
            return {
              id: `osm-${el.id || i}`,
              name,
              address: [tags['addr:street'], tags['addr:suburb'], city].filter(Boolean).join(', ') || `${city} Main Road`,
              city,
              state
            };
          });
        }
      } catch { /* try next endpoint */ }
    }

    return [
      { id: 'cine-1', name: `PVR INOX ${city} Multiplex`, address: `Mall of ${city}, 4th Floor`, city, state },
      { id: 'cine-2', name: `Cinépolis Grand ${city}`, address: `City Centre Mall, Ring Road`, city, state },
      { id: 'cine-3', name: `Miraj Cinemas ${city}`, address: `Metro Junction, Station Road`, city, state }
    ];
  }

  async function loadCinemaDirectory() {
    if (!selectedLocation.state || !selectedLocation.city) return;
    updateStatus('loading', `Searching cinemas in ${selectedLocation.city}...`);
    currentCinemas = await discoverCinemas(selectedLocation.city, selectedLocation.state);
    updateStatus('idle', `Found ${currentCinemas.length} cinemas in ${selectedLocation.city}`);
    applyAllFilters();
  }

  function detectUserLocation() {
    if (!navigator.geolocation) {
      updateFeedback('Geolocation is not supported by your browser.', 'error');
      return;
    }
    updateFeedback('Detecting your city...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetchJSON(`${PHOTON_REVERSE_API}?lat=${latitude}&lon=${longitude}`);
          const props = res.features?.[0]?.properties || {};
          const city = props.city || props.town || props.state_district || 'Mumbai';
          const state = props.state || 'Maharashtra';

          selectedLocation = { state, city };
          localStorage.setItem('cinebuzz_selected_location', JSON.stringify(selectedLocation));

          if (elements.stateFilter) elements.stateFilter.value = state;
          await populateCities(city);
          if (elements.cityFilter) elements.cityFilter.value = city;

          updateFeedback(`Location detected: ${city}, ${state}`, 'success');
          loadCinemaDirectory();
        } catch {
          updateFeedback('Could not determine city automatically. Please select manually.', 'error');
        }
      },
      () => {
        updateFeedback('Location access was denied. Please select your city.', 'error');
      },
      { timeout: 10000 }
    );
  }

  /* ==========================================================================
     Filter Controls & Search Sync Listeners
     ========================================================================== */
  function populateFilters() {
    if (elements.movieFilter) {
      elements.movieFilter.innerHTML = '<option value="">All movies</option>';
      (window.CINEBUZZ_MOVIES || []).forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.title;
        opt.textContent = m.title;
        elements.movieFilter.appendChild(opt);
      });
    }

    if (elements.dateFilter) {
      elements.dateFilter.innerHTML = '';
      const base = new Date();
      base.setHours(12, 0, 0, 0);

      for (let i = 0; i < 6; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
        const opt = document.createElement('option');
        opt.value = iso;
        opt.textContent = label;
        elements.dateFilter.appendChild(opt);
      }
    }
  }

  function initEvents() {
    // Search input synchronizer
    elements.listingSearch?.addEventListener('input', () => {
      if (elements.headerSearch) elements.headerSearch.value = elements.listingSearch.value;
      applyAllFilters();
    });

    elements.headerSearch?.addEventListener('input', () => {
      if (elements.listingSearch) elements.listingSearch.value = elements.headerSearch.value;
      applyAllFilters();
    });

    // Dropdowns
    elements.movieFilter?.addEventListener('change', applyAllFilters);
    elements.formatFilter?.addEventListener('change', applyAllFilters);
    elements.dateFilter?.addEventListener('change', applyAllFilters);

    // Location changes
    elements.stateFilter?.addEventListener('change', async () => {
      selectedLocation.state = elements.stateFilter.value;
      selectedLocation.city = '';
      await populateCities();
      applyAllFilters();
    });

    elements.cityFilter?.addEventListener('change', () => {
      selectedLocation.city = elements.cityFilter.value;
      if (elements.openCityListings) elements.openCityListings.disabled = !selectedLocation.city;
      if (selectedLocation.city) {
        localStorage.setItem('cinebuzz_selected_location', JSON.stringify(selectedLocation));
        loadCinemaDirectory();
      }
    });

    elements.openCityListings?.addEventListener('click', () => {
      document.querySelector('#nearby-title')?.scrollIntoView({ behavior: 'smooth' });
    });

    elements.refreshListings?.addEventListener('click', loadCinemaDirectory);
    elements.detectLocation?.addEventListener('click', detectUserLocation);
    elements.heroLocationButton?.addEventListener('click', detectUserLocation);
    elements.headerLocation?.addEventListener('click', detectUserLocation);

    // Clicking "Find showtimes" on any movie card filters to that movie
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.movie-link-label');
      if (link && link.getAttribute('href')?.includes('#browse')) {
        const card = link.closest('.real-movie-card');
        const title = card?.querySelector('h3')?.textContent;
        if (title && elements.movieFilter) {
          e.preventDefault();
          elements.movieFilter.value = title;
          applyAllFilters();
          document.querySelector('#nearby-title')?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  /* ==========================================================================
     Initialization & URL Parameters Processing
     ========================================================================== */
  async function init() {
    populateFilters();
    initEvents();
    await loadStates();

    // Check URL parameters: ?q=query and ?movie=movieId
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    const movieParam = urlParams.get('movie');

    if (queryParam) {
      if (elements.listingSearch) elements.listingSearch.value = queryParam;
      if (elements.headerSearch) elements.headerSearch.value = queryParam;
    }

    if (movieParam && elements.movieFilter) {
      const match = (window.CINEBUZZ_MOVIES || []).find((m) => m.id === movieParam);
      if (match) elements.movieFilter.value = match.title;
    }

    // Restore location
    try {
      const stored = JSON.parse(localStorage.getItem('cinebuzz_selected_location') || 'null');
      if (stored?.state && stored?.city) {
        selectedLocation = stored;
        if (elements.stateFilter) elements.stateFilter.value = stored.state;
        await populateCities(stored.city);
        loadCinemaDirectory();
        return;
      }
    } catch { /* ignore */ }

    // Default to Mumbai
    selectedLocation = { state: 'Maharashtra', city: 'Mumbai' };
    if (elements.stateFilter) elements.stateFilter.value = selectedLocation.state;
    await populateCities(selectedLocation.city);
    loadCinemaDirectory();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * CineBuzz Core App — Unified Booking, Flow, and UI Controllers
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'cinebuzzBooking';
  const LOCATION_KEY = 'cinebuzz_selected_location';

  window.readBooking = () => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  };

  window.saveBooking = (booking) => {
    try {
      const current = window.readBooking();
      const merged = { ...current, ...booking };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return booking;
    }
  };

  const money = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const text = (node) => node?.textContent?.replace(/\s+/g, ' ').trim() || '';

  const getMovieCatalog = () => window.CINEBUZZ_MOVIES || [];
  const findMovie = (booking) => {
    const catalog = getMovieCatalog();
    return catalog.find((m) => m.id === booking.movieId) ||
           catalog.find((m) => m.title?.toLowerCase() === booking.movie?.toLowerCase()) ||
           catalog[0];
  };

  /* ==========================================================================
     1. Unified Location Header Sync
     ========================================================================== */
  function syncLocationLabels() {
    let city = '';
    let state = '';
    try {
      const loc = JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
      if (loc && loc.city) {
        city = loc.city;
        state = loc.state || '';
      }
    } catch { /* storage disabled */ }

    const label = city ? (state ? `${city}, ${state}` : city) : 'Choose city';
    document.querySelectorAll('.location-name, #header-location-name').forEach((el) => {
      el.textContent = label;
    });
  }
  syncLocationLabels();
  window.addEventListener('storage', (e) => {
    if (e.key === LOCATION_KEY) syncLocationLabels();
  });

  /* ==========================================================================
     2. Global Search & Enter Handler
     ========================================================================== */
  const searchInputs = [...document.querySelectorAll('.search input, #header-search, .cinema-header-search input')];
  searchInputs.forEach((input) => {
    const isMoviesPage = window.location.pathname.endsWith('movies.html');

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();

      // If on Events or Offers page, filter cards live
      const eventCards = document.querySelectorAll('.evt-card');
      const offerCards = document.querySelectorAll('.offer-card');
      if (eventCards.length || offerCards.length) {
        [...eventCards, ...offerCards].forEach((card) => {
          const match = text(card).toLowerCase().includes(query);
          card.style.display = match ? '' : 'none';
        });
      }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const query = input.value.trim();
        if (query && !isMoviesPage) {
          window.location.href = `movies.html?q=${encodeURIComponent(query)}#browse`;
        }
      }
    });
  });

  /* ==========================================================================
     3. Category & Chip Filters (Offers & Events Pages)
     ========================================================================== */
  document.querySelectorAll('.chip-row').forEach((row) => {
    const chips = [...row.querySelectorAll('.chip')];
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.toggle('on', c === chip));
        const category = text(chip).replace(/[^\p{L}\p{N} -]/gu, '').trim().toLowerCase();
        const section = row.closest('section') || document;
        const cards = [...section.querySelectorAll('.evt-card, .offer-card')];

        cards.forEach((card) => {
          const content = text(card).toLowerCase();
          const eventIcon = card.querySelector('.evt-cover')?.textContent.trim();
          const matchesEvent = category.includes('concert') ? eventIcon === '🎤' :
                               category.includes('comedy') ? eventIcon === '😄' :
                               category.includes('sports') ? eventIcon === '🏏' :
                               category.includes('theatre') ? eventIcon === '🎭' :
                               category.includes('family') ? eventIcon === '👨‍👩‍👧' : false;

          const isVisible = category === 'all' || category.includes('all') || content.includes(category) || matchesEvent;
          card.style.display = isVisible ? '' : 'none';
        });
      });
    });
  });

  /* ==========================================================================
     4. Booking Flow: Seat Map & Details (booking.html)
     ========================================================================== */
  const seatForm = document.querySelector('.seat-map');
  if (seatForm) {
    let booking = window.readBooking();
    const urlParams = new URLSearchParams(window.location.search);
    const movieQueryId = urlParams.get('movie');

    if (movieQueryId) {
      booking.movieId = movieQueryId;
    }

    const film = findMovie(booking);
    if (!film) {
      window.location.replace('movies.html#location-panel');
      return;
    }

    let locationData = { city: 'Mumbai', state: 'Maharashtra' };
    try {
      const storedLoc = JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
      if (storedLoc?.city) locationData = storedLoc;
    } catch { /* ignore */ }

    booking = {
      movieId: film.id,
      movie: film.title,
      poster: film.poster,
      rating: film.rating || '8.5',
      certificate: film.certificate || 'UA16+',
      runtime: film.runtime || '2h 15m',
      language: film.language || 'Hindi',
      releaseDate: film.releaseDate || '',
      description: film.description || '',
      genres: film.genres || ['Action', 'Drama'],
      venue: booking.venue || `PVR INOX Cinema, ${locationData.city}`,
      address: booking.address || 'Central Mall, 4th Floor',
      city: booking.city || locationData.city,
      state: booking.state || locationData.state,
      show: booking.show || '06:30 PM',
      format: booking.format || (film.formats ? film.formats[0] : '2D'),
      ticketPrice: Number(booking.ticketPrice) || 280,
      reclinerPrice: Number(booking.reclinerPrice) || 420,
      ...booking
    };

    window.saveBooking(booking);

    const setText = (selector, val) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = val || '';
    };

    document.title = `Choose Seats — ${booking.movie} | CineBuzz`;
    setText('#booking-movie-title', booking.movie);
    setText('#movie-rating', booking.rating ? `★ ${booking.rating}/10` : '');
    setText('#movie-format', booking.format);
    setText('#movie-certificate', booking.certificate);
    setText('#movie-runtime', booking.runtime);
    setText('#movie-language', booking.language);
    setText('#movie-release-date', booking.releaseDate ? `Released ${booking.releaseDate}` : '');
    setText('#booking-movie-description', booking.description);

    const posterNodes = document.querySelectorAll('#movie-poster, #movie-backdrop');
    posterNodes.forEach((p) => {
      if (booking.poster) p.src = booking.poster;
      p.alt = `${booking.movie} poster`;
    });

    const genresContainer = document.querySelector('#movie-genres');
    if (genresContainer && booking.genres) {
      genresContainer.replaceChildren();
      booking.genres.forEach((g) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = g;
        genresContainer.appendChild(tag);
      });
    }

    const showNote = document.querySelector('.selected-show-note');
    if (showNote) {
      showNote.textContent = `${booking.venue} · ${booking.city} · ${booking.show} · ${booking.format} · Standard: ${money(booking.ticketPrice)} · Recliner: ${money(booking.reclinerPrice)}`;
    }

    // Dynamic 7-day date strip
    const dateStrip = document.querySelector('.date-strip');
    if (dateStrip) {
      dateStrip.innerHTML = '';
      const baseDate = new Date();
      baseDate.setHours(12, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const dow = new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(d);
        const day = String(d.getDate());
        const mon = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(d);
        const formattedDate = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d);

        const pill = document.createElement('div');
        pill.className = `date-pill ${(!booking.isoDate && i === 0) || booking.isoDate === iso ? 'on' : ''}`;
        pill.dataset.isoDate = iso;
        pill.dataset.formatted = formattedDate;
        pill.innerHTML = `<span class="dow">${dow}</span><span class="day">${day}</span><span class="mon">${mon}</span>`;

        pill.addEventListener('click', () => {
          document.querySelectorAll('.date-pill').forEach((p) => p.classList.toggle('on', p === pill));
          booking.isoDate = iso;
          booking.date = formattedDate;
          window.saveBooking(booking);
          updateSummary();
        });

        dateStrip.appendChild(pill);
      }
      if (!booking.date) {
        booking.date = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(baseDate);
        booking.isoDate = baseDate.toISOString().slice(0, 10);
      }
    }

    const legend = document.querySelector('.seat-legend');
    if (legend) {
      legend.querySelectorAll('span').forEach((item) => {
        const lbl = text(item);
        if (lbl.includes('Recliner')) item.innerHTML = `<span class="s s-vip"></span> Recliner (${money(booking.reclinerPrice)})`;
        else if (lbl.includes('Standard')) item.innerHTML = `<span class="s s-empty"></span> Standard (${money(booking.ticketPrice)})`;
      });
    }

    const seatInputs = [...seatForm.querySelectorAll('.seat[type="checkbox"]')];
    const summaryItems = [...seatForm.querySelectorAll('.booking-summary .bs-item b')];
    const totalNode = seatForm.querySelector('.booking-summary .total b');
    const contactForm = document.querySelector('.book-panel form.form-grid');
    const ticketCountSelect = contactForm?.querySelector('select');
    if (ticketCountSelect) ticketCountSelect.disabled = true;

    const getSeatPrice = (seat) => seat.classList.contains('vip') ? Number(booking.reclinerPrice) : Number(booking.ticketPrice);

    const updateSummary = () => {
      const selected = seatInputs.filter((s) => s.checked);
      booking.seats = selected.map((s) => s.id);
      booking.subtotal = selected.reduce((sum, s) => sum + getSeatPrice(s), 0);

      if (summaryItems[0]) summaryItems[0].textContent = `${selected.length} ${selected.length === 1 ? 'Seat' : 'Seats'}`;
      if (summaryItems[1]) summaryItems[1].textContent = `${booking.format} · ${booking.show}`;
      if (summaryItems[2]) summaryItems[2].textContent = booking.date;
      if (totalNode) totalNode.textContent = money(booking.subtotal);

      if (ticketCountSelect) {
        ticketCountSelect.value = String(Math.min(Math.max(selected.length, 1), 5));
      }

      const hint = document.querySelector('#seats .section-head .hint');
      if (hint) hint.textContent = `${booking.venue} · ${booking.format} · ${booking.show} · ${booking.date}`;
    };

    seatInputs.forEach((seat) => seat.addEventListener('change', updateSummary));

    seatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const selected = seatInputs.filter((s) => s.checked);
      if (!selected.length) {
        alert('Please select at least one seat from the seat map to proceed.');
        return;
      }

      if (contactForm && !contactForm.reportValidity()) {
        contactForm.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (contactForm) {
        const inputs = [...contactForm.querySelectorAll('input')];
        booking.customer = {
          name: inputs[0]?.value.trim() || 'Guest',
          phone: inputs[1]?.value.trim() || '',
          email: inputs[2]?.value.trim() || '',
          notes: inputs[3]?.value.trim() || ''
        };
      }

      booking.seats = selected.map((s) => s.id);
      booking.subtotal = selected.reduce((sum, s) => sum + getSeatPrice(s), 0);
      window.saveBooking(booking);
      window.location.href = 'payment.html';
    });

    updateSummary();
  }

  /* ==========================================================================
     5. Payment Page (payment.html)
     ========================================================================== */
  const paymentForm = document.querySelector('.card-form form');
  if (paymentForm) {
    let booking = window.readBooking();

    if (!booking.movie || !booking.seats?.length || !booking.subtotal) {
      window.location.replace('movies.html#browse');
      return;
    }

    const orderLines = [...document.querySelectorAll('.order-box .order-line')];
    if (orderLines[0]) orderLines[0].querySelector('span').textContent = `${booking.movie} (${booking.format || '2D'})`;
    if (orderLines[1]) orderLines[1].querySelector('span').textContent = booking.venue || 'CineBuzz Cinema';
    if (orderLines[2]) orderLines[2].querySelector('span').textContent = `${booking.date || 'Today'} · ${booking.show || '06:30 PM'}`;
    if (orderLines[3]) orderLines[3].querySelector('b').textContent = booking.seats.join(', ');
    if (orderLines[4]) {
      orderLines[4].querySelector('span').textContent = `${booking.seats.length} ticket${booking.seats.length === 1 ? '' : 's'}`;
      orderLines[4].querySelector('b').textContent = money(booking.subtotal);
    }

    const subtotal = Number(booking.subtotal || 0);
    const convenienceFee = subtotal > 0 ? 30 : 0;
    if (orderLines[5]) orderLines[5].querySelector('b').textContent = money(convenienceFee);

    const promoInput = paymentForm.querySelector('input[placeholder="Enter code if you have one"]');
    const promoLine = document.getElementById('promo-line');
    const totalPayableNode = document.querySelector('.order-bold span:last-child');
    const submitBtn = paymentForm.querySelector('button[type="submit"]');

    const updateTotals = () => {
      const code = promoInput ? promoInput.value.trim().toUpperCase() : '';
      let discount = 0;

      if (code === 'TUESDAY50') discount = Math.min(125, subtotal);
      else if (code === 'HDFC15') discount = Math.min(150, Math.round(subtotal * 0.15));
      else if (code === 'WELCOME0') discount = convenienceFee;
      else if (code === 'EARLYBIRD') discount = 75;
      else if (code === 'COMBO199') discount = 50;

      if (promoLine) {
        if (discount > 0) {
          promoLine.style.display = 'flex';
          promoLine.querySelector('span').textContent = `Promo (${code})`;
          promoLine.querySelector('b').textContent = `−${money(discount)}`;
        } else {
          promoLine.style.display = 'none';
        }
      }

      const payable = Math.max(0, subtotal + convenienceFee - discount);
      if (totalPayableNode) totalPayableNode.textContent = money(payable);
      if (submitBtn) submitBtn.textContent = `Pay ${money(payable)} securely →`;

      booking.promo = discount > 0 ? code : '';
      booking.discount = discount;
      booking.convenienceFee = convenienceFee;
      booking.amount = payable;
      window.saveBooking(booking);
    };

    if (promoInput) promoInput.addEventListener('input', updateTotals);
    updateTotals();

    const payMethodButtons = document.querySelectorAll('.pay-method');
    const methodTitle = document.querySelector('.card-form h2');
    const cardPreview = document.querySelector('.card-preview');
    const fields = [...paymentForm.querySelectorAll('.field, .card-row')];
    let selectedMethod = 'Card';

    const switchMethod = (method) => {
      selectedMethod = method;
      payMethodButtons.forEach((btn) => btn.classList.toggle('on', text(btn).includes(method)));
      if (methodTitle) methodTitle.textContent = method === 'Card' ? '💳 Pay with card' : `Pay with ${method}`;
      if (cardPreview) cardPreview.style.display = method === 'Card' ? 'block' : 'none';

      const cardFields = fields.slice(0, 3);
      if (method === 'Card') {
        cardFields.forEach((f) => (f.style.display = ''));
        const numInput = paymentForm.querySelector('input[placeholder="1234 5678 9012 3456"]');
        if (numInput) {
          numInput.previousElementSibling.textContent = 'Card number';
          numInput.placeholder = '1234 5678 9012 3456';
          numInput.required = true;
        }
      } else {
        cardFields.slice(1).forEach((f) => (f.style.display = 'none'));
        cardFields[0].style.display = '';
        const input = cardFields[0].querySelector('input');
        const label = cardFields[0].querySelector('label');
        if (input && label) {
          const config = {
            UPI: { label: 'UPI ID / VPA', ph: 'e.g. name@okhdfcbank' },
            'Net Banking': { label: 'Customer ID / NetBanking Username', ph: 'Enter your NetBanking ID' },
            Wallet: { label: 'Linked Phone Number', ph: '+91 98765 43210' }
          };
          label.textContent = config[method]?.label || 'Account ID';
          input.placeholder = config[method]?.ph || '';
          input.required = true;
        }
      }
    };

    payMethodButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const label = text(btn);
        if (label.includes('UPI')) switchMethod('UPI');
        else if (label.includes('Net Banking')) switchMethod('Net Banking');
        else if (label.includes('Wallet')) switchMethod('Wallet');
        else switchMethod('Card');
      });
    });

    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!paymentForm.reportValidity()) return;

      booking.paymentMethod = selectedMethod;
      booking.paymentStatus = 'confirmed';
      booking.id = `CB-${Date.now().toString().slice(-6)}`;
      window.saveBooking(booking);
      window.location.href = 'confirmation.html';
    });

    document.querySelector('.order-box .btn-outline')?.addEventListener('click', () => {
      if (confirm('Cancel this checkout and return to seat selection?')) {
        window.location.href = 'booking.html';
      }
    });
  }

  /* ==========================================================================
     6. Confirmation Screen (confirmation.html)
     ========================================================================== */
  if (document.querySelector('.ticket')) {
    const booking = window.readBooking();
    if (booking.paymentStatus !== 'confirmed') {
      window.location.replace('movies.html#browse');
      return;
    }

    const title = booking.movie || 'Movie Ticket';
    const customer = booking.customer || {};

    const ticketTitle = document.querySelector('.ticket-top h2');
    if (ticketTitle) ticketTitle.textContent = title;

    const posterImg = document.querySelector('.ticket-top .tp-poster img');
    if (posterImg && booking.poster) {
      posterImg.src = booking.poster;
      posterImg.alt = title;
    }

    const ticketMeta = document.querySelector('.ticket-top .tt-meta');
    if (ticketMeta) {
      ticketMeta.textContent = [booking.format, booking.certificate, booking.language, booking.runtime].filter(Boolean).join(' · ');
    }

    const items = [...document.querySelectorAll('.ticket-info .ti-item b')];
    if (items[0]) items[0].textContent = booking.venue || 'Cinema';
    if (items[1]) items[1].textContent = booking.format || '2D';
    if (items[2]) items[2].textContent = booking.date || 'Today';
    if (items[3]) items[3].textContent = booking.show || '06:30 PM';
    if (items[4]) items[4].textContent = (booking.seats || []).join(', ');
    if (items[5]) items[5].textContent = `${booking.seats?.length || 1} Ticket${booking.seats?.length === 1 ? '' : 's'}`;
    if (items[6]) items[6].textContent = `${money(booking.amount)}${booking.promo ? ` (${booking.promo} applied)` : ''}`;

    const confirmationMsg = document.querySelector('.success-head p');
    if (confirmationMsg) {
      confirmationMsg.textContent = `Booking ID: ${booking.id || 'CB-849204'} · Sent to ${customer.email || 'your email'}${customer.phone ? ` & SMS to ${customer.phone}` : ''}`;
    }

    document.querySelector('.ticket-actions .btn-outline')?.addEventListener('click', () => window.print());
  }
})();