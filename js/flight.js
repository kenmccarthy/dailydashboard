// ── FLIGHT.JS ──
// Nearest flight overhead via airplanes.live point-radius feed (keyless).
import { getToggle } from './setup.js';

let AIRLINES = null;
let flightTimer = null;
let lastFetch = 0;
const ROUTE_CACHE   = new Map();   // callsign → adsbdb route  (or null when unknown)
const HEX_CACHE     = new Map();   // callsign → hexdb route   (or null when unknown)
const AIRPORT_CACHE = new Map();   // ICAO     → airport object (or null when unknown)

// 8-point compass from a bearing in degrees
function compass(deg) {
  if (deg == null) return '';
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// "AIRBUS A-320" → "Airbus A-320" (leave tokens with digits alone)
function titleCase(s) {
  return String(s).toLowerCase().split(' ').map(w =>
    /\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
}

async function getAirlines() {
  if (AIRLINES) return AIRLINES;
  try { AIRLINES = await fetch('data/airlines.json').then(r => r.json()); }
  catch(e) { AIRLINES = {}; }
  return AIRLINES;
}

// Origin/destination + airline (incl. IATA for the logo) for a callsign,
// via the keyless adsbdb route feed. Cached per callsign; null when unknown.
async function getRoute(call) {
  if (!call) return null;
  if (ROUTE_CACHE.has(call)) return ROUTE_CACHE.get(call);
  let route = null;
  try {
    const r = await fetch(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(call)}`);
    if (r.ok) {
      const j = await r.json();
      route = (j && j.response && j.response.flightroute) || null;
    }
  } catch(e) { /* leave route null */ }
  ROUTE_CACHE.set(call, route);
  return route;
}

// "Frankfurt Airport" → "Frankfurt"; "Newark Liberty International Airport"
// → "Newark Liberty". Gives a short place-style label from a full airport name.
function shortenAirport(name) {
  const s = String(name || '')
    .replace(/\s+(International\s+)?Airport$/i, '')
    .replace(/\s+Intl$/i, '')
    .trim();
  return s || name || '';
}

// Resolve an ICAO airport code to an adsbdb-shaped airport object via hexdb.io
// (keyless, CORS-open). Cached per code; null when unknown.
async function getAirport(icao) {
  if (!icao) return null;
  if (AIRPORT_CACHE.has(icao)) return AIRPORT_CACHE.get(icao);
  let ap = null;
  try {
    const r = await fetch(`https://hexdb.io/api/v1/airport/icao/${encodeURIComponent(icao)}`);
    if (r.ok) {
      const j = await r.json();
      if (j && j.icao) {
        ap = {
          municipality: shortenAirport(j.airport),
          name:         j.airport || '',
          iata_code:    j.iata || '',
          icao_code:    j.icao || '',
          latitude:     j.latitude,
          longitude:    j.longitude,
        };
      }
    }
  } catch(e) { /* leave ap null */ }
  AIRPORT_CACHE.set(icao, ap);
  return ap;
}

// Origin/destination for a callsign via the keyless hexdb.io route feed, as a
// second opinion to adsbdb (the two databases go stale on different flights).
// hexdb returns "ICAO-ICAO" codes, resolved to full airports. Cached per
// callsign; null when unknown. No airline data — that stays with adsbdb.
async function getRouteHexdb(call) {
  if (!call) return null;
  if (HEX_CACHE.has(call)) return HEX_CACHE.get(call);
  let route = null;
  try {
    const r = await fetch(`https://hexdb.io/api/v1/route/icao/${encodeURIComponent(call)}`);
    if (r.ok) {
      const j = await r.json();
      const codes = ((j && j.route) || '').split('-').filter(Boolean);
      if (codes.length >= 2) {
        const [o, d] = await Promise.all([
          getAirport(codes[0]), getAirport(codes[codes.length - 1]),
        ]);
        if (o && d) route = { origin: o, destination: d, airline: null };
      }
    }
  } catch(e) { /* leave route null */ }
  HEX_CACHE.set(call, route);
  return route;
}

// Great-circle distance between two lat/lon points, in km.
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// adsbdb maps a callsign to a scheduled route, which can be stale/wrong for the
// physical flight. Sanity-check it against where the aircraft actually is: the
// plane must lie within a generous ellipse with the two airports as foci. Lateral
// re-routing barely changes the summed distance, so this tolerates ATC/weather
// detours while rejecting gross mismatches (e.g. a HNL→LAX route over Ireland).
function routeMatchesPosition(route, lat, lon) {
  const o = route && route.origin, d = route && route.destination;
  if (o == null || d == null || o.latitude == null || o.longitude == null ||
      d.latitude == null || d.longitude == null || lat == null || lon == null) {
    return true;   // can't verify — don't hide
  }
  const MARGIN_KM = 500;
  const dO = haversineKm(lat, lon, o.latitude, o.longitude);
  const dD = haversineKm(lat, lon, d.latitude, d.longitude);
  const routeLen = haversineKm(o.latitude, o.longitude, d.latitude, d.longitude);
  return dO + dD <= routeLen + MARGIN_KM;
}

// "London (LGW)" — municipality preferred, airport name as fallback.
function airportLabel(a) {
  if (!a) return '';
  const place = a.municipality || a.name || '';
  const code = a.iata_code || a.icao_code || '';
  return code ? `${place} <span class="flight-iata">(${code})</span>`.trim() : place;
}

// Resolve which location + radius the flight card should use.
// Falls back to the weather location if no flight-specific coords are set.
function flightLocation() {
  const fLat = localStorage.getItem('dd_flight_lat');
  const fLon = localStorage.getItem('dd_flight_lon');
  const lat = parseFloat(fLat || localStorage.getItem('dd_lat'));
  const lon = parseFloat(fLon || localStorage.getItem('dd_lon'));
  let radius = parseInt(localStorage.getItem('dd_flight_radius'), 10);
  if (isNaN(radius) || radius < 1) radius = 50;   // nautical miles
  return { lat, lon, radius: Math.min(radius, 250) };
}

export async function loadFlight() {
  lastFetch = Date.now();
  const el = document.getElementById('flight-content');
  if (!el) return;
  const { lat, lon, radius } = flightLocation();
  if (isNaN(lat) || isNaN(lon)) {
    el.innerHTML = '<div class="wotd-missing">Set a location to see flights.</div>';
    return;
  }
  try {
    const airlines = await getAirlines();
    const r = await fetch(`https://api.airplanes.live/v2/point/${lat}/${lon}/${radius}`);
    if (!r.ok) throw new Error();
    const data = await r.json();
    // Airborne aircraft with a position, nearest first (dst = nautical miles).
    const planes = (data.ac || [])
      .filter(a => a.lat != null && a.alt_baro !== 'ground' && a.dst != null)
      .sort((a, b) => a.dst - b.dst);

    if (!planes.length) {
      el.innerHTML = '<div class="wotd-missing">No aircraft overhead right now.</div>';
      return;
    }

    const p = planes[0];
    const call = (p.flight || '').trim();
    const icao = call.slice(0, 3);
    // Two independent keyless route databases; they go stale on different flights.
    const [adsbRoute, hexRoute] = await Promise.all([getRoute(call), getRouteHexdb(call)]);

    // Pick the airports from whichever source's route actually fits the aircraft's
    // current position. This arbitration is what rejects a stale route (e.g. adsbdb
    // returning Hawaii→Newark for a flight that's really Frankfurt→Newark over Ireland).
    const fits = rt => rt && rt.origin && rt.destination &&
                       routeMatchesPosition(rt, p.lat, p.lon);
    const route = fits(adsbRoute) ? adsbRoute : fits(hexRoute) ? hexRoute : null;

    // Airline name/logo come from adsbdb (reliable from the callsign) or the offline
    // table — independent of which source supplied the airports.
    const airline = (adsbRoute && adsbRoute.airline && adsbRoute.airline.name) || airlines[icao] || '';
    // Logo needs an IATA code, which only the airline block gives us.
    const iata = adsbRoute && adsbRoute.airline && adsbRoute.airline.iata;
    const acType = p.desc ? titleCase(p.desc) : (p.t || '');
    const alt = typeof p.alt_baro === 'number' ? `${p.alt_baro.toLocaleString()} ft` : '';
    const climb = p.baro_rate > 100 ? ' ↑' : p.baro_rate < -100 ? ' ↓' : '';
    const spd = p.gs != null ? `${Math.round(p.gs)} kt` : '';
    const distKm = `${(p.dst * 1.852).toFixed(1)} km ${compass(p.dir)}`.trim();

    const line2 = [call || null, p.r || null, acType || null].filter(Boolean).join(' · ');
    const line3 = [alt ? alt + climb : null, spd, distKm].filter(Boolean).join(' · ');
    // `route` is already the position-verified pick (or null), so show it as-is.
    const routeLine = route
      ? `<div class="flight-route">${airportLabel(route.origin)}<span class="flight-arrow">→</span>${airportLabel(route.destination)}</div>`
      : '';
    const logo = iata
      ? `<img class="flight-logo" src="https://images.kiwi.com/airlines/64/${encodeURIComponent(iata)}.png" alt="" onerror="this.style.display='none'">`
      : '';
    const heading = `${logo}<div class="otd-body">${airline || call || 'Unknown aircraft'}</div>`;

    el.innerHTML = `
      <div class="flight-head">${heading}</div>
      ${line2 ? `<div class="otd-sub">${line2}</div>` : ''}
      ${routeLine}
      ${line3 ? `<div class="otd-sub">${line3}</div>` : ''}
      ${call ? `<a class="otd-link" href="https://globe.airplanes.live/?callsign=${encodeURIComponent(call)}" target="_blank" rel="noopener">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polygon points="2,1 9,5 2,9" fill="currentColor"/></svg>
        Track flight</a>` : ''}`;
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">Flight data unavailable right now.</div>';
  }
}

// Poll while the tab is visible; pause when hidden to respect rate limits.
export function initFlightRefresh() {
  if (flightTimer) clearInterval(flightTimer);
  const POLL = 90000; // 90s
  flightTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && getToggle('flight')) loadFlight();
  }, POLL);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getToggle('flight') &&
        Date.now() - lastFetch > 60000) {
      loadFlight();
    }
  });
}
