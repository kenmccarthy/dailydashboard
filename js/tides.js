// ── TIDES.JS ──
// Next high/low tides via the WorldTides API. Needs a free API key, stored in
// the user's own browser (like the Wordnik/NASA keys). Tides change slowly, so
// results are cached and only refetched when the key/location changes or the
// cache goes stale — this keeps WorldTides credit use low.

let CACHE = null;                          // { key, lat, lon, at, extremes }
const CACHE_MS = 3 * 60 * 60 * 1000;       // 3 hours

// Tide location: dedicated override, else the weather location.
function tidesLocation() {
  const lat = parseFloat(localStorage.getItem('dd_tides_lat') || localStorage.getItem('dd_lat'));
  const lon = parseFloat(localStorage.getItem('dd_tides_lon') || localStorage.getItem('dd_lon'));
  return { lat, lon };
}

function fmtTime(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Human "in 2 h 10 min" from a millisecond delta.
function relTime(ms) {
  if (ms <= 0) return 'now';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `in ${h} h ${m} min` : `in ${h} h`;
}

export async function loadTides() {
  const el = document.getElementById('tides-content');
  if (!el) return;
  const key = (localStorage.getItem('dd_tides_key') || '').trim();
  if (!key) {
    el.innerHTML = '<div class="wotd-missing">Add a free WorldTides API key in Settings to enable this.</div>';
    return;
  }
  const { lat, lon } = tidesLocation();
  if (isNaN(lat) || isNaN(lon)) {
    el.innerHTML = '<div class="wotd-missing">Set a location to see tides.</div>';
    return;
  }
  // Serve from cache while the key/location are unchanged and the data is fresh.
  if (CACHE && CACHE.key === key && CACHE.lat === lat && CACHE.lon === lon &&
      Date.now() - CACHE.at < CACHE_MS) {
    render(el, CACHE.extremes);
    return;
  }
  try {
    const r = await fetch(
      `https://www.worldtides.info/api/v3?extremes&lat=${lat}&lon=${lon}&key=${encodeURIComponent(key)}`
    );
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || (j.status && j.status >= 400) || !Array.isArray(j.extremes)) {
      const msg = j && j.error ? j.error : 'Tides unavailable right now.';
      el.innerHTML = `<div class="wotd-missing">${msg}</div>`;
      return;
    }
    CACHE = { key, lat, lon, at: Date.now(), extremes: j.extremes };
    render(el, j.extremes);
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">Tides unavailable right now.</div>';
  }
}

function render(el, extremes) {
  const now = Date.now();
  const upcoming = extremes
    .map(e => ({ type: e.type, height: e.height, t: (e.dt || 0) * 1000 }))
    .filter(e => e.t >= now - 60000)   // upcoming (small grace for the one just passed)
    .slice(0, 4);
  if (!upcoming.length) {
    el.innerHTML = '<div class="wotd-missing">No upcoming tide data for this location.</div>';
    return;
  }
  el.innerHTML = upcoming.map((e, i) => {
    const d = new Date(e.t);
    const label = e.type === 'High' ? 'High tide' : 'Low tide';
    const height = e.height != null ? `${e.height.toFixed(1)} m` : '';
    return `<div class="tide-row${i === 0 ? ' tide-next' : ''}">` +
             `<span class="tide-type">${label}</span>` +
             `<span class="tide-time">${fmtTime(d)}</span>` +
             `<span class="tide-rel">${relTime(e.t - now)}</span>` +
             `<span class="tide-h">${height}</span>` +
           `</div>`;
  }).join('');
}
