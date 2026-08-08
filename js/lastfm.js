// ── LASTFM.JS ──
// Now playing / recent scrobbles via the Last.fm API (CORS-open). Needs a free
// API key + username, stored in the user's own browser (like the other keyed
// cards). A single user.getRecentTracks call gives both the header and the list.
import { getToggle } from './setup.js';
import { esc, showLoading, showError, stampUpdated } from './dom-utils.js';

let lfmTimer = null;
let lfmLast = 0;

// Pick an image URL of the requested size from a Last.fm image[] array.
function img(track, size) {
  const arr = Array.isArray(track.image) ? track.image : [];
  const hit = arr.find(i => i.size === size) || arr[arr.length - 1];
  return (hit && hit['#text']) || '';
}

function relTime(uts) {
  const s = Math.floor(Date.now() / 1000) - Number(uts);
  if (!isFinite(s) || s < 0) return '';
  if (s < 3600)  return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export async function loadLastfm() {
  lfmLast = Date.now();
  const el = document.getElementById('lastfm-content');
  if (!el) return;
  const key  = (localStorage.getItem('dd_lastfm_key')  || '').trim();
  const user = (localStorage.getItem('dd_lastfm_user') || '').trim();
  if (!key || !user) {
    el.innerHTML = '<div class="wotd-missing">Add your Last.fm API key and username in Settings to enable this.</div>';
    return;
  }
  showLoading('lastfm-content');
  try {
    const r = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}` +
      `&limit=5&api_key=${encodeURIComponent(key)}&format=json`
    );
    const j = await r.json().catch(() => null);
    if (!j || j.error) {
      showError('lastfm-content', j && j.message ? esc(j.message) : 'Last.fm unavailable right now.');
      return;
    }
    let tracks = j.recenttracks && j.recenttracks.track;
    tracks = Array.isArray(tracks) ? tracks : (tracks ? [tracks] : []);
    if (!tracks.length) {
      el.innerHTML = '<div class="wotd-missing">No recent scrobbles for this user.</div>';
      stampUpdated('lastfm-content-updated', new Date(lfmLast));
      return;
    }

    const top = tracks[0];
    const nowPlaying = !!(top['@attr'] && top['@attr'].nowplaying === 'true');
    const art = img(top, 'extralarge') || img(top, 'large');
    const header =
      `<a class="lastfm-now" href="${esc(top.url || '#')}" target="_blank" rel="noopener">` +
        (art ? `<img class="lastfm-art" src="${esc(art)}" alt="" onerror="this.style.display='none'">` : '') +
        `<span class="lastfm-now-info">` +
          `<span class="lastfm-status${nowPlaying ? ' playing' : ''}">${nowPlaying ? 'Now playing' : 'Last played'}</span>` +
          `<span class="lastfm-track">${esc(top.name || '')}</span>` +
          `<span class="lastfm-artist">${esc((top.artist && top.artist['#text']) || '')}</span>` +
        `</span>` +
      `</a>`;

    // Recent list: everything after the header track (up to 5 more).
    const list = tracks.slice(1, 6).map(t => {
      const when = t.date && t.date.uts ? relTime(t.date.uts) : '';
      return `<div class="lastfm-row">` +
        `<span class="lastfm-row-track">${esc(t.name || '')}</span>` +
        `<span class="lastfm-row-artist">${esc((t.artist && t.artist['#text']) || '')}</span>` +
        (when ? `<span class="lastfm-row-when">${when}</span>` : '') +
      `</div>`;
    }).join('');

    el.innerHTML = header + (list ? `<div class="lastfm-list">${list}</div>` : '');
    stampUpdated('lastfm-content-updated', new Date(lfmLast));
  } catch(e) {
    showError('lastfm-content', 'Last.fm unavailable right now.');
  }
}

// Refresh "now playing" while the tab is visible; pause when hidden.
export function initLastfmRefresh() {
  if (lfmTimer) clearInterval(lfmTimer);
  lfmTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && getToggle('lastfm')) loadLastfm();
  }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getToggle('lastfm') &&
        Date.now() - lfmLast > 30000) {
      loadLastfm();
    }
  });
}
