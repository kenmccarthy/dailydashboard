// ── FLIGHT-PROXY WORKER ──
// Deploy this on Cloudflare Workers (free tier — no account credit card, no API
// key) to fix the dashboard's flight card. Server-to-server requests aren't
// subject to browser CORS, so this fetches from whichever keyless ADS-B feed
// responds first and hands the result back to the browser with the CORS
// headers those feeds don't send themselves.
//
// Setup:
//   1. workers.cloudflare.com → Create application → Create Worker
//   2. Paste this file's contents in, replacing the default code
//   3. Deploy — copy the resulting *.workers.dev URL
//   4. Paste that URL into Settings → Nearest flight → "Flight data proxy URL"
//      in the dashboard
//
// Request:  GET <worker-url>/?lat=51.5&lon=-0.1&radius=50
// Response: { "ac": [ ...same shape airplanes.live's /v2/point returns... ] }

const SOURCES = [
  (lat, lon, radius) => ({
    url: `https://api.airplanes.live/v2/point/${lat}/${lon}/${radius}`,
    acKey: 'ac',
  }),
  (lat, lon, radius) => ({
    url: `https://api.adsb.lol/v2/point/${lat}/${lon}/${radius}`,
    acKey: 'ac',
  }),
  (lat, lon, radius) => ({
    url: `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${radius}`,
    acKey: 'aircraft',
  }),
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    const params = new URL(request.url).searchParams;
    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon'));
    const radius = Math.min(parseInt(params.get('radius'), 10) || 50, 250);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return json({ error: 'lat and lon query params are required' }, 400);

    for (const build of SOURCES) {
      const { url, acKey } = build(lat, lon, radius);
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'daily-dashboard-flight-proxy (github.com)' } });
        if (!r.ok) continue;
        const data = await r.json();
        return json({ ac: data[acKey] || [] });
      } catch (e) { /* try the next source */ }
    }
    return json({ error: 'all upstream flight sources failed' }, 502);
  },
};
