# CineBuzz

A responsive cinema discovery and ticket booking demo.

## Run it

Open `index.html` in a browser, or serve this folder with any static file server. The home page is `Pages/home.html`; the root `index.html` forwards there. No build or dependency installation is required.

The booking flow stores its demo reservation in the current browser session. Payments are simulated and no card data is sent to a server.

## Cinema listings

`Pages/movies.html` is the movie and cinema discovery page. Choose a state, city and movie to filter the cinema cards and see each listed showtime and price. The catalog separates eight now-showing live-action films from four upcoming live-action films. Upcoming titles have a CineBuzz pre-booking-interest button; it saves interest in the current browser and does not reserve seats or take payment.

When a visitor selects any city, the page searches the OpenStreetMap cinema directory for mapped halls in that city and caches the result in that browser for seven days. Coverage depends on what local contributors have mapped, so this is not a guaranteed complete commercial cinema directory. Ten major cities also have sample halls as a fallback. Showtimes and prices remain clearly labeled estimates until a cinema partner feed supplies actual inventory. No booking links send customers to BookMyShow; showtime selection stays within CineBuzz.

The map lookup is user-triggered, sequential, and cached. It uses Photon for the selected city lookup, then tries the OpenStreetMap Overpass services one at a time if a directory server is unavailable. These shared public services are best-effort; configure `window.CINEBUZZ_GEOCODER_URL` with a Photon-compatible GeoJSON service and `window.CINEBUZZ_CINEMA_DIRECTORY_URL` with an approved Overpass-compatible service you operate or license before a production or commercial launch. OpenStreetMap venue names are attributed on the movies page.

To connect a listings service, set `window.CINEBUZZ_LISTINGS_URL` before `cinema-browser.js` loads. For example, add this to `Pages/movies.html` immediately before the `cinema-browser.js` script:

```html
<script>window.CINEBUZZ_LISTINGS_URL = '/api/listings';</script>
```

The service should accept `date` (ISO date) and optional `state`, `lat`, and `lng` query parameters. When a state is requested, `locations` should include every city served in that state, not only cities with a show on that date. City filtering happens in the browser so the city selector keeps the full list. It should return JSON in this shape:

```json
{
  "updatedAt": "2026-11-23T10:30:00Z",
  "locations": [
    { "state": "Delhi", "city": "New Delhi", "lat": 28.6139, "lng": 77.2090 }
  ],
  "listings": [
    {
      "cinema": "Example Cinema",
      "city": "New Delhi",
      "state": "Delhi",
      "address": "Saket",
      "movie": {
        "title": "Example Movie",
        "language": "Hindi",
        "genre": "Drama",
        "certificate": "UA16+",
        "description": "A short movie synopsis.",
        "poster": "/assets/posters/example-movie.jpg"
      },
      "shows": [
        { "time": "07:15 PM", "format": "2D", "price": 220, "reclinerPrice": 420 }
      ]
    }
  ],
  "nearby": { "state": "Delhi", "city": "New Delhi" }
}
```

`nearby` is optional and is used when the visitor chooses **Use my location**. The browser refreshes a connected feed on state/date changes, on demand, and every 60 seconds. A showtime selection carries the movie, cinema, city, show and price into CineBuzz's seat and checkout pages. This static project does not include a ticketing partner API or nationwide inventory; the seat map and payment submission are still demo-only and need a booking backend before taking real reservations or payments. Serve the site and API over HTTP(S), and configure the API's CORS policy if they use different origins.
