/**
 * CineBuzz Core Application Engine
 * Unified Storage, Seat Selection, Dynamic Checkout, 
 * 18-Offer Real Partner Promo Database, and Live Search/Filters
 */

(() => {
  'use strict';

  // Storage Keys for cross-tab and cross-session compatibility
  const STORAGE_KEY = 'cinebuzzBooking';
  const ALT_STORAGE_KEY = 'cinebuzz_current_booking';
  const LOCATION_KEY = 'cinebuzz_selected_location';

  // ============================================================================
  // 1. UNIFIED PROMO CODES DATABASE (18 Real-World Bank, UPI & Cinema Offers)
  // ============================================================================
  window.PROMO_DATABASE = {
    'HDFCBOGO': {
      code: 'HDFCBOGO',
      partner: 'HDFC Bank',
      type: 'bogo',
      discountMax: 250,
      minTickets: 2,
      minSpend: 300,
      desc: 'Buy 1 Get 1 Free on HDFC Regalia, Diners & Millennia (Up to ₹250 off)',
      terms: [
        'Valid on HDFC Bank Regalia, Millennia, Diners Club, and Infinia credit cards.',
        'Requires a minimum purchase of 2 tickets in a single transaction.',
        'The discount applies to the price of the 2nd ticket up to a maximum cap of ₹250.',
        'Offer can be availed twice per card per calendar month.',
        'Valid across all 2D, 3D, and IMAX screenings until 31 May 2026.'
      ]
    },
    'ICICI25': {
      code: 'ICICI25',
      partner: 'ICICI Bank',
      type: 'percent',
      percent: 25,
      discountMax: 200,
      minTickets: 2,
      minSpend: 300,
      desc: 'Flat 25% Instant Savings with ICICI Coral, Rubyx & Sapphiro (Up to ₹200 off)',
      terms: [
        'Applicable on ICICI Bank Coral, Rubyx, Sapphiro, and Emeralde credit and debit cards.',
        'Minimum booking total must be ₹300 or above with at least 2 tickets selected.',
        'Maximum discount granted per transaction is ₹200.',
        'Valid on movie screenings and select live concerts across India till 30 June 2026.'
      ]
    },
    'CRED100': {
      code: 'CRED100',
      partner: 'CRED Pay',
      type: 'flat',
      discount: 100,
      minSpend: 300,
      desc: 'Flat ₹100 Off with CRED Pay UPI (Min spend ₹300)',
      terms: [
        'Offer valid exclusively when paying via CRED Pay UPI at final checkout.',
        'Valid on a minimum ticket spend of ₹300.',
        'Flat ₹100 is deducted immediately from your payable amount.',
        'Open to all verified CRED members. Valid till 15 July 2026.'
      ]
    },
    'TUESDAY50': {
      code: 'TUESDAY50',
      partner: 'CineBuzz Special',
      type: 'flat',
      discount: 125,
      minSpend: 150,
      desc: 'Flat ₹125 Off on Blockbuster Tuesday Movie Screenings',
      terms: [
        'Valid on cinema screenings scheduled on Tuesdays across participating auditoriums.',
        'No minimum ticket quantity required. Minimum transaction amount of ₹150.',
        'Flat ₹125 instant price reduction.',
        'Cannot be clubbed with other bank BOGO promotional codes.'
      ]
    },
    'SBICLICK': {
      code: 'SBICLICK',
      partner: 'SBI Card',
      type: 'flat',
      discount: 100,
      minSpend: 400,
      desc: 'Flat ₹100 Off on SBI SimplyCLICK & Elite Credit Cards (Min spend ₹400)',
      terms: [
        'Valid on SBI SimplyCLICK, Prime, and Elite credit cards.',
        'Minimum transaction booking value of ₹400 is required.',
        'Flat discount of ₹100 applied instantly at checkout.',
        'Cardholders earn 10X reward points on the net paid transaction value.'
      ]
    },
    'AXIS150': {
      code: 'AXIS150',
      partner: 'Axis Bank',
      type: 'flat',
      discount: 150,
      minSpend: 500,
      desc: 'Flat ₹150 Off with Axis Bank Neo, Magnus & Atlas Cards (Min spend ₹500)',
      terms: [
        'Valid on Axis Bank Credit and Debit Cards.',
        'Minimum cart value of ₹500 required before taxes.',
        'Flat discount of ₹150 applies to both movie passes and live concerts.',
        'Valid up to 2 times per user till 30 June 2026.'
      ]
    },
    'PAYTM50': {
      code: 'PAYTM50',
      partner: 'Paytm UPI',
      type: 'flat',
      discount: 50,
      minSpend: 250,
      desc: 'Flat ₹50 Instant Discount via Paytm UPI (Min spend ₹250)',
      terms: [
        'Valid when selecting Paytm UPI or Paytm Wallet at the payment gateway.',
        'Minimum ticket booking spend must be ₹250 or greater.',
        'Immediate discount of ₹50 applied at checkout.',
        'Applicable on movies, sports tournaments, and standup events.'
      ]
    },
    'EARLYBIRD': {
      code: 'EARLYBIRD',
      partner: 'CineBuzz Live',
      type: 'percent',
      percent: 20,
      discountMax: 300,
      minSpend: 600,
      desc: 'Flat 20% Off on Live Concerts & Standup Comedy (Up to ₹300 off)',
      terms: [
        'Valid on tickets booked in the Live Events category (Concerts, Comedy, Theatre, Sports).',
        'Requires a minimum booking spend of ₹600.',
        'Maximum discount capped at ₹300 per transaction.',
        'Valid on Arijit Singh, Zakir Khan, Alan Walker, Bassi & Comic Con bookings till 15 June 2026.'
      ]
    },
    'WELCOME0': {
      code: 'WELCOME0',
      partner: 'CineBuzz Welcome',
      type: 'fee_waiver',
      discount: 30,
      minSpend: 0,
      desc: '100% Convenience Fee Waiver on Your First Booking',
      terms: [
        'Valid exclusively for first-time bookers on CineBuzz.',
        'Waives the full ₹30 convenience/internet handling fee.',
        'No minimum booking amount required.',
        'Valid across all cinema auditoriums and live performance halls.'
      ]
    },
    'HDFC15': {
      code: 'HDFC15',
      partner: 'HDFC Bank',
      type: 'percent',
      percent: 15,
      discountMax: 150,
      minSpend: 350,
      desc: '15% Off with Any HDFC Bank Debit or Credit Card (Up to ₹150)',
      terms: [
        'Applicable on any valid HDFC Bank Debit or Credit card.',
        'Minimum transaction value of ₹350 required.',
        '15% instant reduction capped at a maximum of ₹150.',
        'Valid till 31 December 2026.'
      ]
    },
    'MORNING99': {
      code: 'MORNING99',
      partner: 'Cinema Chain',
      type: 'flat',
      discount: 99,
      minSpend: 200,
      desc: 'Flat ₹99 Off on All Shows Starting Before 12:00 PM',
      terms: [
        'Applicable exclusively for movie shows scheduled to start before 12:00 PM noon.',
        'Minimum ticket subtotal must be at least ₹200.',
        'Flat deduction of ₹99 applied immediately.',
        'Valid 7 days a week on all 2D and 3D movies.'
      ]
    },
    'STUDENT25': {
      code: 'STUDENT25',
      partner: 'Campus Pass',
      type: 'percent',
      percent: 25,
      discountMax: 120,
      minSpend: 200,
      desc: 'Flat 25% Off for Students with Valid College ID (Up to ₹120)',
      terms: [
        'Must produce valid College / University Student Identity Card upon theater admission.',
        'Minimum spend of ₹200 on tickets.',
        '25% discount capped at ₹120 per transaction.',
        'Valid on screenings from Monday to Thursday.'
      ]
    },
    'PHONEPE10': {
      code: 'PHONEPE10',
      partner: 'PhonePe',
      type: 'percent',
      percent: 10,
      discountMax: 80,
      minSpend: 250,
      desc: '10% Instant Discount via PhonePe UPI (Up to ₹80 off)',
      terms: [
        'Valid when selecting PhonePe UPI switch or QR code at checkout.',
        'Minimum booking total of ₹250.',
        '10% instant discount capped at ₹80.',
        'Available up to twice per user every calendar month.'
      ]
    },
    'KOTAK20': {
      code: 'KOTAK20',
      partner: 'Kotak Mahindra Bank',
      type: 'percent',
      percent: 20,
      discountMax: 175,
      minSpend: 400,
      desc: '20% Weekend Savings on Kotak Bank Cards (Up to ₹175)',
      terms: [
        'Valid on Kotak 811, League, White, and Privy League cards.',
        'Applicable on Saturday and Sunday movie screenings.',
        'Minimum spend ₹400; maximum discount ₹175.',
        'Valid till 30 September 2026.'
      ]
    },
    'IMAX150': {
      code: 'IMAX150',
      partner: 'Premium Formats',
      type: 'flat',
      discount: 150,
      minSpend: 400,
      desc: 'Flat ₹150 Off on IMAX, 4DX, and ICE Screenings',
      terms: [
        'Applicable exclusively for tickets booked in IMAX 2D/3D, 4DX, or ICE auditoriums.',
        'Minimum cart total of ₹400.',
        'Flat ₹150 deducted immediately.',
        'Valid across all participating IMAX multiplexes till 31 July 2026.'
      ]
    },
    'GPAY60': {
      code: 'GPAY60',
      partner: 'Google Pay',
      type: 'flat',
      discount: 60,
      minSpend: 350,
      desc: 'Flat ₹60 Off + Assured In-App Scratch Reward on Google Pay',
      terms: [
        'Valid on Google Pay UPI transactions at final checkout.',
        'Minimum transaction spend of ₹350.',
        'Flat ₹60 off instantly + scratch card awarded inside the Google Pay application.'
      ]
    },
    'INDUSBOGO': {
      code: 'INDUSBOGO',
      partner: 'IndusInd Bank',
      type: 'bogo',
      discountMax: 200,
      minTickets: 2,
      minSpend: 350,
      desc: 'Buy 1 Get 1 Free on IndusInd Pioneer & Legend Cards (Up to ₹200)',
      terms: [
        'Valid on IndusInd Bank Pioneer, Legend, and Nexxt Credit Cards.',
        'Requires minimum 2 tickets; 2nd ticket discounted up to ₹200.',
        'Applicable on Recliner, IMAX, and Gold lounge classes.'
      ]
    },
    'COMBO199': {
      code: 'COMBO199',
      partner: 'CineBuzz F&B',
      type: 'flat',
      discount: 50,
      minSpend: 199,
      desc: 'Flat ₹50 Off on Gourmet Popcorn & Beverage Combos',
      terms: [
        'Applicable when pre-booking F&B popcorn and beverage snack combos.',
        'Minimum snack combo spend of ₹199.',
        'Flat ₹50 concession discount.'
      ]
    }
  };

  // ============================================================================
  // 2. PROMO DISCOUNT CALCULATOR
  // ============================================================================
  window.calculatePromoDiscount = function(promoCode, subtotal, ticketCount = 1) {
    const code = (promoCode || '').trim().toUpperCase();
    if (!code) {
      return { valid: false, discountAmount: 0, message: '' };
    }

    const promo = window.PROMO_DATABASE[code];
    if (!promo) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Promo code "${code}" is invalid or expired. See Offers page for active codes.`
      };
    }

    if (promo.minSpend && subtotal < promo.minSpend) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Min spend of ₹${promo.minSpend} required for ${code} (Current: ₹${subtotal}).`
      };
    }

    if (promo.minTickets && ticketCount < promo.minTickets) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Promo ${code} requires at least ${promo.minTickets} tickets (Currently: ${ticketCount}).`
      };
    }

    let discountAmount = 0;
    if (promo.type === 'flat' || promo.type === 'fee_waiver') {
      discountAmount = promo.discount;
    } else if (promo.type === 'percent') {
      discountAmount = Math.round((subtotal * promo.percent) / 100);
      if (promo.discountMax) {
        discountAmount = Math.min(discountAmount, promo.discountMax);
      }
    } else if (promo.type === 'bogo') {
      const singleTicketApprox = Math.round(subtotal / Math.max(1, ticketCount));
      discountAmount = Math.min(singleTicketApprox, promo.discountMax || 250);
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      valid: true,
      promo,
      discountAmount,
      message: `Promo ${code} applied! You saved ₹${discountAmount}.`
    };
  };

  // ============================================================================
  // 3. UNIFIED STORAGE HELPERS (Syncs sessionStorage & localStorage)
  // ============================================================================
  window.readBooking = () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) || 
                  localStorage.getItem(ALT_STORAGE_KEY) || 
                  localStorage.getItem(STORAGE_KEY);
      return JSON.parse(raw || '{}');
    } catch {
      return {};
    }
  };

  window.saveBooking = (booking) => {
    try {
      const current = window.readBooking();
      const merged = { ...current, ...booking };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(ALT_STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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

  // ============================================================================
  // 4. UNIFIED LOCATION HEADER SYNC
  // ============================================================================
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
    document.querySelectorAll('.location-name, #header-location-name, #header-location-text').forEach((el) => {
      el.textContent = label;
    });
  }
  syncLocationLabels();
  window.addEventListener('storage', (e) => {
    if (e.key === LOCATION_KEY) syncLocationLabels();
  });

  // ============================================================================
  // 5. GLOBAL SEARCH INPUT LISTENER
  // ============================================================================
  const searchInputs = [...document.querySelectorAll('.search input, #header-search, .cinema-header-search input')];
  searchInputs.forEach((input) => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) input.value = params.get('q');

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          const isMoviesPage = window.location.pathname.endsWith('movies.html');
          if (!isMoviesPage) {
            window.location.href = `movies.html?q=${encodeURIComponent(query)}#browse`;
          }
        }
      }
    });
  });

  // ============================================================================
  // 6. BOOKING FLOW: SEAT MAP & DETAILS (booking.html)
  // ============================================================================
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

  // ============================================================================
  // 7. PAYMENT CHECKOUT & FULL PROMO ENGINE (payment.html)
  // ============================================================================
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

    const promoInput = paymentForm.querySelector('input[placeholder*="code" i]') || 
                       document.getElementById('promo-code') ||
                       paymentForm.querySelector('input[placeholder="Enter code if you have one"]');
    const promoLine = document.getElementById('promo-line');
    const totalPayableNode = document.querySelector('.order-bold span:last-child');
    const submitBtn = paymentForm.querySelector('button[type="submit"]');

    // Create promo status feedback node if not already present
    let promoFeedback = document.getElementById('promo-status-feedback');
    if (!promoFeedback && promoInput) {
      promoFeedback = document.createElement('div');
      promoFeedback.id = 'promo-status-feedback';
      promoFeedback.style.fontSize = '0.8rem';
      promoFeedback.style.marginTop = '6px';
      promoFeedback.style.fontWeight = '600';
      promoInput.parentElement.appendChild(promoFeedback);
    }

    const updateTotals = () => {
      const code = promoInput ? promoInput.value.trim().toUpperCase() : '';
      let discount = 0;

      if (code) {
        const calc = window.calculatePromoDiscount(code, subtotal, booking.seats?.length || 1);
        if (calc.valid) {
          discount = calc.discountAmount;
          if (promoFeedback) {
            promoFeedback.textContent = calc.message;
            promoFeedback.style.color = '#4ade80';
          }
        } else {
          if (promoFeedback) {
            promoFeedback.textContent = calc.message;
            promoFeedback.style.color = '#f87171';
          }
        }
      } else {
        if (promoFeedback) promoFeedback.textContent = '';
      }

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

    // Check for auto-applied promo from offers.html
    const autoPromo = localStorage.getItem('cinebuzz_auto_promo');
    if (autoPromo && promoInput) {
      promoInput.value = autoPromo;
      localStorage.removeItem('cinebuzz_auto_promo');
      updateTotals();
    } else {
      updateTotals();
    }

    // Payment method switch tabs
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

  // ============================================================================
  // 8. CONFIRMATION SCREEN (confirmation.html)
  // ============================================================================
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

  // ============================================================================
  // 9. OFFERS PAGE INTERACTION & FILTER CONTROLLER (offers.html)
  // ============================================================================
  function initOffersPage() {
    const cardsGrid = document.getElementById('offers-cards-grid');
    if (!cardsGrid) return; // Only runs on offers.html

    const searchInput = document.getElementById('offer-search-input');
    const clearSearchBtn = document.getElementById('offer-search-clear');
    const filterChips = document.querySelectorAll('.offer-filter-chip');
    const offerCards = Array.from(document.querySelectorAll('.offer-card'));
    const countLabel = document.getElementById('offers-count-label');
    const noResultsState = document.getElementById('no-offers-state');
    const resetFiltersBtn = document.getElementById('btn-reset-filters');
    const toast = document.getElementById('offers-toast');
    const toastMsg = document.getElementById('toast-msg');

    // Terms Modal Elements
    const termsModal = document.getElementById('terms-modal');
    const closeTermsModal = document.getElementById('close-terms-modal');
    const termsPartnerTag = document.getElementById('terms-partner-tag');
    const termsHeading = document.getElementById('terms-modal-heading');
    const termsCodeText = document.getElementById('terms-code-text');
    const termsCopyBtn = document.getElementById('terms-copy-btn');
    const termsBullets = document.getElementById('terms-points-list');
    const termsUseBtn = document.getElementById('btn-terms-use-now');

    // Active Booking Ribbon Sync
    const pendingBookingRibbon = document.getElementById('pending-booking-ribbon');
    const ribbonMovieTitle = document.getElementById('ribbon-movie-title');
    try {
      const activeBooking = window.readBooking();
      if (activeBooking && (activeBooking.movie || activeBooking.title)) {
        if (pendingBookingRibbon && ribbonMovieTitle) {
          ribbonMovieTitle.textContent = `${activeBooking.movie || activeBooking.title} • ${activeBooking.venue || 'Cinema'}`;
          pendingBookingRibbon.classList.remove('hidden');
        }
      }
    } catch (e) {}

    // Dynamic Category Counts
    const counts = { all: offerCards.length, bank: 0, upi: 0, movie: 0, events: 0, combos: 0 };
    offerCards.forEach(c => {
      const cat = c.dataset.category;
      if (counts[cat] !== undefined) counts[cat]++;
    });
    Object.keys(counts).forEach(k => {
      const el = document.querySelector(`.count-${k}`);
      if (el) el.textContent = counts[k];
    });

    let activeCategory = 'all';
    let searchQuery = '';

    function showToast(msg, icon = '✨') {
      if (!toast) return;
      toastMsg.textContent = msg;
      const toastIcon = document.getElementById('toast-icon');
      if (toastIcon) toastIcon.textContent = icon;
      toast.classList.remove('hidden');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => {
        toast.classList.add('hidden');
      }, 3200);
    }

    function applyFilters() {
      let visibleCount = 0;
      const query = searchQuery.toLowerCase().trim();

      offerCards.forEach(card => {
        const category = card.dataset.category || '';
        const code = (card.dataset.code || '').toLowerCase();
        const partner = (card.dataset.partner || '').toLowerCase();
        const textContent = card.textContent.toLowerCase();

        const matchesCategory = (activeCategory === 'all' || category === activeCategory);
        const matchesSearch = !query || code.includes(query) || partner.includes(query) || textContent.includes(query);

        if (matchesCategory && matchesSearch) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (countLabel) {
        countLabel.innerHTML = `Showing <strong>${visibleCount}</strong> active promotional offers`;
      }

      if (noResultsState) {
        if (visibleCount === 0) {
          noResultsState.classList.remove('hidden');
          cardsGrid.style.display = 'none';
        } else {
          noResultsState.classList.add('hidden');
          cardsGrid.style.display = 'grid';
        }
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('hidden', !searchQuery);
        }
        applyFilters();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
        applyFilters();
      });
    }

    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.category || 'all';
        applyFilters();
      });
    });

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
        filterChips.forEach(c => c.classList.remove('active'));
        const allChip = document.querySelector('.offer-filter-chip[data-category="all"]');
        if (allChip) allChip.classList.add('active');
        activeCategory = 'all';
        applyFilters();
      });
    }

    function copyToClipboard(code, buttonElement) {
      navigator.clipboard.writeText(code).then(() => {
        if (buttonElement) {
          buttonElement.classList.add('copied');
          const textSpan = buttonElement.querySelector('.copy-text');
          if (textSpan) textSpan.textContent = 'COPIED!';
          setTimeout(() => {
            buttonElement.classList.remove('copied');
            if (textSpan) textSpan.textContent = 'COPY';
          }, 2500);
        }
        showToast(`Promo code ${code} copied! Paste at checkout to redeem.`, '📋');
      }).catch(() => {
        showToast(`Promo code: ${code}`, '📋');
      });
    }

    document.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.btn-copy-code');
      if (copyBtn) {
        const code = copyBtn.dataset.code;
        if (code) copyToClipboard(code, copyBtn);
      }
    });

    // 1-Click "Use Code" Integration
    document.addEventListener('click', (e) => {
      const applyBtn = e.target.closest('.btn-apply-offer');
      if (applyBtn) {
        const code = applyBtn.dataset.code;
        if (!code) return;

        localStorage.setItem('cinebuzz_auto_promo', code);

        try {
          const booking = window.readBooking();
          if (booking && (booking.movie || booking.title)) {
            showToast(`Offer ${code} selected! Redirecting to checkout...`, '🎟️');
            setTimeout(() => {
              window.location.href = 'payment.html';
            }, 800);
          } else {
            showToast(`Offer ${code} applied! Pick your movie or event to enjoy savings.`, '🎉');
            setTimeout(() => {
              window.location.href = 'movies.html';
            }, 1000);
          }
        } catch (err) {
          window.location.href = 'movies.html';
        }
      }
    });

    // Terms & Conditions Modal
    document.addEventListener('click', (e) => {
      const termsBtn = e.target.closest('.btn-view-terms');
      if (termsBtn) {
        const card = termsBtn.closest('.offer-card');
        const code = card ? card.dataset.code : '';
        const promoData = window.PROMO_DATABASE[code];

        if (promoData && termsModal) {
          termsPartnerTag.textContent = promoData.partner;
          termsHeading.textContent = `${promoData.partner} — ${code}`;
          termsCodeText.textContent = code;
          termsUseBtn.dataset.code = code;

          termsBullets.innerHTML = (promoData.terms || []).map(t => `<li>${t}</li>`).join('');
          termsModal.classList.remove('hidden');
        }
      }
    });

    if (closeTermsModal && termsModal) {
      closeTermsModal.addEventListener('click', () => {
        termsModal.classList.add('hidden');
      });
      termsModal.addEventListener('click', (e) => {
        if (e.target === termsModal) termsModal.classList.add('hidden');
      });
    }

    if (termsCopyBtn) {
      termsCopyBtn.addEventListener('click', () => {
        const code = termsCodeText.textContent;
        if (code) copyToClipboard(code, termsCopyBtn);
      });
    }

    if (termsUseBtn) {
      termsUseBtn.addEventListener('click', () => {
        const code = termsUseBtn.dataset.code;
        if (code) {
          localStorage.setItem('cinebuzz_auto_promo', code);
          termsModal.classList.add('hidden');
          const booking = window.readBooking();
          window.location.href = (booking && booking.movie) ? 'payment.html' : 'movies.html';
        }
      });
    }
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    initOffersPage();
  });
})();