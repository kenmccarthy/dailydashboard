// ── TIDES.JS ──
// Next high/low tides via the WorldTides API. Needs a free API key, stored in
// the user's own browser (like the Wordnik/NASA keys). Tides change slowly, so
// results are cached and only refetched when the key/location changes or the
// cache goes stale — this keeps WorldTides credit use low.

import { esc, showLoading, showError, stampUpdated } from './dom-utils.js';

const CACHE_KEY = 'dd_tides_cache';
// Tide extremes are astronomically predictable — a day-old fetch is still
// accurate — so a 24h cache caps WorldTides credit use to ~once/day. Persisted
// to localStorage (not just this module's memory) so a page reload within the
// same 24h window reuses it instead of spending another credit.
const CACHE_MS = 24 * 60 * 60 * 1000;      // 24 hours

function loadCacheFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function saveCacheToStorage(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }
  catch(e) { /* storage full/unavailable — cache still works for this session */ }
}

let CACHE = loadCacheFromStorage();        // { key, lat, lon, at, extremes }

// Tide location: dedicated override, else the weather location.
function tidesLocation() {
  const lat = parseFloat(localStorage.getItem('dd_tides_lat') || localStorage.getItem('dd_lat'));
  const lon = parseFloat(localStorage.getItem('dd_tides_lon') || localStorage.getItem('dd_lon'));
  return { lat, lon };
}

function fmtTime(d) {
  // 12-hour AM/PM, matching the main clock's fmt().
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
    stampUpdated('tides-content-updated', new Date(CACHE.at));
    return;
  }
  showLoading('tides-content');
  try {
    // days=2 so a fetch made at the start of its 24h cache window still has
    // "upcoming" extremes left near the end of that window, instead of the
    // default single day running dry and wrongly showing "no upcoming tides".
    const r = await fetch(
      `https://www.worldtides.info/api/v3?extremes&days=2&lat=${lat}&lon=${lon}&key=${encodeURIComponent(key)}`
    );
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || (j.status && j.status >= 400) || !Array.isArray(j.extremes)) {
      showError('tides-content', j && j.error ? j.error : 'Tides unavailable right now.');
      return;
    }
    CACHE = { key, lat, lon, at: Date.now(), extremes: j.extremes };
    saveCacheToStorage(CACHE);
    render(el, j.extremes);
    stampUpdated('tides-content-updated', new Date(CACHE.at));
  } catch(e) {
    showError('tides-content', 'Tides unavailable right now.');
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
  const label = (localStorage.getItem('dd_tides_label') || '').trim();
  const loc = label ? `<div class="tide-loc">${esc(label)}</div>` : '';
  el.innerHTML = loc + upcoming.map((e, i) => {
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
