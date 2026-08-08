// ── SPACE.JS ──
// "People in space" via a keyless, CORS-open static JSON mirror of the
// open-notify data (corquaid, hosted on GitHub Pages over HTTPS), plus the ISS's
// live position from wheretheiss.at (keyless) reverse-geocoded via BigDataCloud.
import { getToggle } from './setup.js';
import { esc, showLoading, showError, stampUpdated } from './dom-utils.js';

let spaceTimer = null;

// "us" → 🇺🇸 (two regional-indicator letters); fallback to a satellite glyph.
function flagEmoji(code) {
  if (!code || code.length !== 2) return '🛰️';
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export async function loadSpace() {
  const el = document.getElementById('space-content');
  if (!el) return;
  showLoading('space-content');
  try {
    const r = await fetch('https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json');
    if (!r.ok) throw new Error();
    const d = await r.json();
    const people = Array.isArray(d.people) ? d.people : [];
    if (!people.length) {
      el.innerHTML = '<div class="wotd-missing">No crew data right now.</div>';
      stampUpdated('space-content-updated');
      return;
    }
    const exp = (d.iss_expedition && d.expedition_url)
      ? ` · <a href="${esc(d.expedition_url)}" target="_blank" rel="noopener">Expedition ${esc(String(d.iss_expedition))}</a>`
      : '';
    const head = `<div class="space-head"><span class="space-count">${people.length}</span> people in space${exp}</div>`;
    const rows = people.map(p => {
      const craft = [p.agency, p.spacecraft].filter(Boolean).map(esc).join(' · ');
      return `<div class="space-row">` +
        `<span class="space-flag">${flagEmoji(p.flag_code)}</span>` +
        `<span class="space-name">${esc(p.name || '')}</span>` +
        `<span class="space-craft">${craft}</span>` +
      `</div>`;
    }).join('');
    el.innerHTML = head + `<div class="space-list">${rows}</div>`;
    stampUpdated('space-content-updated');
  } catch(e) {
    showError('space-content', 'Space crew data unavailable right now.');
  }
}

// "12.3°N" / "45.6°W" from a signed coordinate.
function fmtCoord(v, pos, neg) {
  return `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;
}

// Reverse-geocode to a country name. Returns null on failure, '' over open
// ocean (BigDataCloud gives an empty countryName there), else the country.
async function reverseGeo(lat, lon) {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!r.ok) return null;
    const j = await r.json();
    return (j.countryName && j.countryName.trim()) || '';
  } catch(e) { return null; }
}

// Live ISS position line (updates in place; never throws out of the roster).
export async function updateISS() {
  const el = document.getElementById('space-iss');
  if (!el) return;
  try {
    const r = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!r.ok) throw new Error();
    const d = await r.json();
    const country = await reverseGeo(d.latitude, d.longitude);
    const place = country == null ? '' : (country ? `Over ${esc(country)}` : 'Over the ocean');
    const coords = `${fmtCoord(d.latitude, 'N', 'S')}, ${fmtCoord(d.longitude, 'E', 'W')}`;
    const parts = [
      place,
      coords,
      `${Math.round(d.altitude)} km`,
      `${Math.round(d.velocity).toLocaleString()} km/h`,
    ].filter(Boolean);
    el.innerHTML = `<span class="space-iss-sat">🛰</span> ${parts.join(' · ')}`;
  } catch(e) {
    // Was previously silent, leaving stale text with no indication it's stuck —
    // only replace with an error once we have no prior content to preserve.
    if (!el.textContent.trim()) showError('space-iss', 'ISS position unavailable.');
  }
}

// Poll the ISS position while visible; the crew roster itself changes rarely and
// is loaded separately by loadSpace().
export function initSpaceRefresh() {
  if (getToggle('space')) updateISS();
  if (spaceTimer) clearInterval(spaceTimer);
  spaceTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && getToggle('space')) updateISS();
  }, 20000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getToggle('space')) updateISS();
  });
}
