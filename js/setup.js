// ── SETUP.JS ──
import { getSpecialDates } from './special.js';
import { esc as escHtml } from './dom-utils.js';
import { openModal, closeModal } from './a11y-utils.js';

const CARD_DEFS = [
  {id:'quote',       label:'Quote of the day',            full:true,  category:'Always shown'},
  {id:'fact',        label:'Strange fact of the day',     full:false, category:'Facts & Trivia'},
  {id:'music',       label:'Music fact of the day',       full:false, category:'Facts & Trivia'},
  {id:'wotd',        label:'Word of the day (Wordnik)',   full:false, category:'Facts & Trivia'},
  {id:'irish',       label:'Irish word of the day',       full:false, category:'Facts & Trivia'},
  {id:'proverb',     label:'Irish proverb of the day',    full:false, category:'Facts & Trivia'},
  {id:'song',        label:'80s song of the day',         full:false, category:'Facts & Trivia'},
  {id:'onthisday',   label:'About this day',              full:true,  category:'Facts & Trivia'},
  {id:'nasa',        label:'NASA picture of the day',     full:false, category:'Media'},
  {id:'joke',        label:'Joke of the day',             full:false, category:'Media'},
  {id:'news',        label:'RTÉ headlines',               full:false, category:'Media'},
  {id:'flight',      label:'Nearest flight overhead',     full:false, category:'Live Data'},
  {id:'f1',          label:'Formula 1',                   full:false, category:'Live Data'},
  {id:'rugby',       label:'Rugby',                       full:false, category:'Live Data'},
  {id:'tides',       label:'Tides',                       full:false, category:'Live Data'},
  {id:'space',       label:'People in space',             full:false, category:'Live Data'},
  {id:'lastfm',      label:'Last.fm — now playing',       full:false, category:'Live Data'},
  {id:'uk1s',        label:'UK #1 · this week in history', full:false, category:'Live Data'},
];

const ALWAYS_ON = new Set(['quote']);

export function getCardOrder() {
  const ids = CARD_DEFS.map(c => c.id);
  try {
    const saved = JSON.parse(localStorage.getItem('dd_card_order') || '[]');
    // Keep a saved order only if it holds exactly the current set of card ids.
    // Comparing the id-set (not just the length) lets added/removed/renamed
    // cards self-heal — otherwise a swap like removing one card and adding
    // another keeps the length equal and strands the new card.
    if (Array.isArray(saved) && saved.length === ids.length &&
        [...saved].sort().join(' ') === [...ids].sort().join(' ')) {
      return saved;
    }
  } catch(e) {}
  return ids;
}

export function getToggle(key) {
  if (ALWAYS_ON.has(key)) return true;
  return localStorage.getItem('dd_tog_' + key) !== 'false';
}

// Apply card order and visibility to the DOM
export function applyCardOrder() {
  const order = getCardOrder();
  const grid = document.getElementById('cards-grid');
  if (!grid) return;
  order.forEach(id => {
    const el = document.getElementById('section-' + id);
    if (!el) return;
    const def = CARD_DEFS.find(c => c.id === id);
    const visible = getToggle(id);
    el.style.display = visible ? '' : 'none';
    // full-width class
    el.classList.toggle('card-full', !!(def && def.full));
    grid.appendChild(el);
  });
}

// ── COUNTRIES ──
export const COUNTRIES = [
  ['IE','Ireland'],['GB','United Kingdom'],['US','United States'],['AU','Australia'],
  ['AT','Austria'],['BE','Belgium'],['BR','Brazil'],['CA','Canada'],['CN','China'],
  ['HR','Croatia'],['CY','Cyprus'],['CZ','Czechia'],['DK','Denmark'],['EE','Estonia'],
  ['FI','Finland'],['FR','France'],['DE','Germany'],['GR','Greece'],['HK','Hong Kong'],
  ['HU','Hungary'],['IN','India'],['ID','Indonesia'],['IT','Italy'],['JP','Japan'],
  ['LV','Latvia'],['LT','Lithuania'],['LU','Luxembourg'],['MY','Malaysia'],['MT','Malta'],
  ['MX','Mexico'],['NL','Netherlands'],['NZ','New Zealand'],['NO','Norway'],['PL','Poland'],
  ['PT','Portugal'],['RO','Romania'],['SG','Singapore'],['SK','Slovakia'],['SI','Slovenia'],
  ['ZA','South Africa'],['ES','Spain'],['SE','Sweden'],['CH','Switzerland'],['TW','Taiwan'],
  ['TH','Thailand'],['TR','Turkey'],['UA','Ukraine'],['AE','UAE'],['VN','Vietnam'],
];

export function populateCountrySelects(def) {
  ['country-input','settings-country'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    COUNTRIES.forEach(([code,name]) => {
      const o = document.createElement('option');
      o.value = code; o.textContent = name;
      if (code === def) o.selected = true;
      el.appendChild(o);
    });
  });
}

// ── GEOCODE ──
export async function geocode(city, cc) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`);
  const d = await r.json();
  if (!d.results?.length) throw new Error('Not found');
  let res = d.results;
  if (cc && cc !== 'ANY') { const f = res.filter(x => x.country_code === cc); if (f.length) res = f; }
  return {lat:res[0].latitude, lon:res[0].longitude, name:res[0].name, country:res[0].country};
}

// ── THEME ──
export function applyTheme() {
  const mode = localStorage.getItem('dd_mode') || 'light';
  document.documentElement.setAttribute('data-theme', mode);
  // Update active states in settings
  ['light','dark'].forEach(m => document.getElementById('mode-'+m)?.classList.toggle('active', m===mode));
}

export function setMode(mode) {
  localStorage.setItem('dd_mode', mode);
  applyTheme();
}
export function setAccent(accent) {
  localStorage.setItem('dd_accent', accent);
  applyTheme();
}

// ── SETUP FLOWS ──
export async function saveSetup() {
  const city = document.getElementById('city-input').value.trim();
  const cc   = document.getElementById('country-input').value;
  if (!city) { document.getElementById('setup-err').textContent = 'Please enter a city name.'; return; }
  document.getElementById('setup-err').textContent = '';
  const btn = document.querySelector('.setup-btn');
  btn.textContent = 'Finding…'; btn.disabled = true;
  try {
    const geo = await geocode(city, cc);
    localStorage.setItem('dd_city',     city);
    localStorage.setItem('dd_country',  cc);
    localStorage.setItem('dd_lat',      geo.lat);
    localStorage.setItem('dd_lon',      geo.lon);
    localStorage.setItem('dd_loc_name', geo.name + ', ' + geo.country);
    closeModal(document.getElementById('setup'));
    document.getElementById('setup').style.display  = 'none';
    document.getElementById('setup2').style.display = 'flex';
    openModal(document.getElementById('setup2'));
  } catch(e) {
    document.getElementById('setup-err').textContent = 'Could not find that location. Try a nearby city.';
    btn.textContent = 'Continue →'; btn.disabled = false;
  }
}

export function saveSetup2() {
  const wk = document.getElementById('setup-wordnik').value.trim();
  const nk = document.getElementById('setup-nasa').value.trim();
  if (wk) localStorage.setItem('dd_wordnik_key', wk);
  if (nk) localStorage.setItem('dd_nasa_key',    nk);
  showMain();
}
export function skipSetup2() { showMain(); }

function showMain() {
  closeModal(document.getElementById('setup2'));
  document.getElementById('setup2').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  window.__initDashboard();
}

// ── SETTINGS PANEL ──
export function openSettings() {
  document.getElementById('settings-city').value    = localStorage.getItem('dd_city')         || '';
  document.getElementById('settings-country').value = localStorage.getItem('dd_country')      || 'IE';
  document.getElementById('settings-wordnik').value = localStorage.getItem('dd_wordnik_key')  || '';
  document.getElementById('settings-nasa').value    = localStorage.getItem('dd_nasa_key')     || '';
  document.getElementById('settings-flight-lat').value    = localStorage.getItem('dd_flight_lat')    || '';
  document.getElementById('settings-flight-lon').value    = localStorage.getItem('dd_flight_lon')    || '';
  document.getElementById('settings-flight-radius').value = localStorage.getItem('dd_flight_radius') || '';
  document.getElementById('settings-tides-key').value = localStorage.getItem('dd_tides_key') || '';
  document.getElementById('settings-tides-lat').value = localStorage.getItem('dd_tides_lat') || '';
  document.getElementById('settings-tides-lon').value = localStorage.getItem('dd_tides_lon') || '';
  document.getElementById('settings-tides-label').value = localStorage.getItem('dd_tides_label') || '';
  document.getElementById('settings-lastfm-key').value  = localStorage.getItem('dd_lastfm_key')  || '';
  document.getElementById('settings-lastfm-user').value = localStorage.getItem('dd_lastfm_user') || '';
  document.getElementById('settings-rugby-league').value = localStorage.getItem('dd_rugby_league') || 'auto';
  applyTheme();
  loadTogglesUI();
  buildSpecialDatesUI();
  buildTimezoneUI();
  buildOrderUI();
  document.getElementById('settings-panel').classList.add('open');
  openModal(document.getElementById('settings-panel'), { onEscape: closeSettings });
}
export function closeSettings() {
  document.getElementById('settings-panel').classList.remove('open');
  closeModal(document.getElementById('settings-panel'));
}
export async function saveSettings() {
  const city = document.getElementById('settings-city').value.trim();
  const cc   = document.getElementById('settings-country').value;
  // Flight-location overrides persist regardless of the location field.
  const setOrClear = (key, val) => { val ? localStorage.setItem(key, val) : localStorage.removeItem(key); };
  setOrClear('dd_flight_lat',    document.getElementById('settings-flight-lat').value.trim());
  setOrClear('dd_flight_lon',    document.getElementById('settings-flight-lon').value.trim());
  setOrClear('dd_flight_radius', document.getElementById('settings-flight-radius').value.trim());
  if (window.__reloadFlight) window.__reloadFlight();
  // Tides key + optional location override persist regardless of the city field.
  setOrClear('dd_tides_key',   document.getElementById('settings-tides-key').value.trim());
  setOrClear('dd_tides_lat',   document.getElementById('settings-tides-lat').value.trim());
  setOrClear('dd_tides_lon',   document.getElementById('settings-tides-lon').value.trim());
  setOrClear('dd_tides_label', document.getElementById('settings-tides-label').value.trim());
  // Last.fm key + username persist regardless of the city field; reload immediately.
  setOrClear('dd_lastfm_key',  document.getElementById('settings-lastfm-key').value.trim());
  setOrClear('dd_lastfm_user', document.getElementById('settings-lastfm-user').value.trim());
  window.__reloadLastfm?.();
  localStorage.setItem('dd_rugby_league', document.getElementById('settings-rugby-league').value);
  window.__reloadRugby?.();
  // Additional time zones.
  const tzs = [];
  for (let i = 0; i < 3; i++) {
    const tz    = document.getElementById('settings-tz-zone-'  + i)?.value || '';
    const label = (document.getElementById('settings-tz-label-' + i)?.value || '').trim();
    if (tz) tzs.push({ label, tz });
  }
  localStorage.setItem('dd_timezones', JSON.stringify(tzs));
  window.__reloadTimezones?.();
  if (!city) { window.__reloadTides?.(); return; }
  document.getElementById('settings-err').textContent = '';
  try {
    const geo = await geocode(city, cc);
    localStorage.setItem('dd_city',     city);
    localStorage.setItem('dd_country',  cc);
    localStorage.setItem('dd_lat',      geo.lat);
    localStorage.setItem('dd_lon',      geo.lon);
    localStorage.setItem('dd_loc_name', geo.name + ', ' + geo.country);
    const wk = document.getElementById('settings-wordnik').value.trim();
    const nk = document.getElementById('settings-nasa').value.trim();
    if (wk) localStorage.setItem('dd_wordnik_key', wk);
    if (nk) localStorage.setItem('dd_nasa_key',    nk);
    closeSettings();
    window.__reloadWeather();
    window.__reloadAirQuality?.();
    window.__reloadTides?.();
    window.__reloadWordOfDay();
  } catch(e) {
    document.getElementById('settings-err').textContent = 'Location not found. Try again.';
  }
}

// ── TOGGLE UI ──
function loadTogglesUI() {
  CARD_DEFS.forEach(({id}) => {
    const el = document.getElementById('tog-' + id);
    if (el) { el.checked = getToggle(id); el.disabled = ALWAYS_ON.has(id); }
  });
}

// ── CARD ORDER DRAG-AND-DROP ──
function buildOrderUI() {
  const list = document.getElementById('card-order-list');
  if (!list) return;
  const order = getCardOrder();
  list.innerHTML = '';
  // Category dividers are purely cosmetic — recomputed from whatever order the
  // cards are currently in, so drag-reordering across categories still works
  // unchanged (it just moves the divider to wherever that category's items end up).
  let lastCategory = null;
  order.forEach(id => {
    const def = CARD_DEFS.find(c => c.id === id);
    if (!def) return;
    if (def.category !== lastCategory) {
      lastCategory = def.category;
      const heading = document.createElement('li');
      heading.className = 'card-order-group-label';
      heading.textContent = def.category;
      list.appendChild(heading);
    }
    const li = document.createElement('li');
    li.className = 'card-order-item';
    li.dataset.id = id;
    li.draggable = true;
    li.innerHTML = `
      <span class="drag-handle" aria-label="Drag to reorder">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
          <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
          <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
          <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
        </svg>
      </span>
      <span class="card-order-label">${def.label}</span>
      <label class="toggle">
        <input type="checkbox" id="tog-${id}" ${getToggle(id)?'checked':''} ${ALWAYS_ON.has(id)?'disabled':''} onchange="window.__saveToggle('${id}',this.checked)">
        <span class="toggle-slider"></span>
      </label>`;
    li.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', id); li.classList.add('dragging'); });
    li.addEventListener('dragend',   () => { li.classList.remove('dragging'); document.querySelectorAll('.card-order-item').forEach(el=>el.classList.remove('drag-over')); saveOrderFromUI(); });
    li.addEventListener('dragover',  e => { e.preventDefault(); document.querySelectorAll('.card-order-item').forEach(el=>el.classList.remove('drag-over')); li.classList.add('drag-over'); });
    li.addEventListener('drop',      e => { e.preventDefault(); const from=list.querySelector(`[data-id="${e.dataTransfer.getData('text/plain')}"]`); if(from&&from!==li) list.insertBefore(from,li); });
    list.appendChild(li);
  });
}

function saveOrderFromUI() {
  const list = document.getElementById('card-order-list');
  if (!list) return;
  const order = [...list.querySelectorAll('.card-order-item')].map(li => li.dataset.id);
  localStorage.setItem('dd_card_order', JSON.stringify(order));
  applyCardOrder();
}

// ── SPECIAL DATES EDITOR ──
function buildSpecialDatesUI() {
  const list = document.getElementById('special-dates-list');
  if (!list) return;
  const entries = getSpecialDates();
  if (!entries.length) {
    list.innerHTML = '<li class="special-empty">No special dates yet.</li>';
    return;
  }
  list.innerHTML = entries.map((e, i) =>
    `<li class="special-item">
      <span class="special-item-info">
        <span class="special-item-name">${escHtml(e.name || 'Untitled')}</span>
        <span class="special-item-date">${escHtml(e.date || '')}${e.annual ? ' · yearly' : ''}</span>
      </span>
      <button class="special-remove" type="button" title="Remove" aria-label="Remove ${escHtml(e.name || 'this date')}" onclick="window.__removeSpecialDate(${i})">✕</button>
    </li>`
  ).join('');
}

window.__addSpecialDate = () => {
  const name   = document.getElementById('special-name').value.trim();
  const date   = document.getElementById('special-date').value;   // YYYY-MM-DD
  const annual = document.getElementById('special-annual').checked;
  if (!name || !date) return;
  const entries = getSpecialDates();
  entries.push({ name, date, annual });
  localStorage.setItem('dd_special_dates', JSON.stringify(entries));
  document.getElementById('special-name').value = '';
  document.getElementById('special-date').value = '';
  buildSpecialDatesUI();
  window.__reloadSpecialDates?.();
};

window.__removeSpecialDate = (i) => {
  const entries = getSpecialDates();
  entries.splice(i, 1);
  localStorage.setItem('dd_special_dates', JSON.stringify(entries));
  buildSpecialDatesUI();
  window.__reloadSpecialDates?.();
};

// ── ADDITIONAL TIME ZONES EDITOR ──
let TZ_LIST = null;
function timezoneList() {
  if (TZ_LIST) return TZ_LIST;
  try { TZ_LIST = (Intl.supportedValuesOf && Intl.supportedValuesOf('timeZone')) || []; }
  catch(e) { TZ_LIST = []; }
  if (!TZ_LIST.length) {   // fallback for browsers without supportedValuesOf
    TZ_LIST = ['America/Los_Angeles','America/Denver','America/Chicago','America/New_York',
      'America/Sao_Paulo','Europe/London','Europe/Dublin','Europe/Paris','Europe/Berlin',
      'Europe/Madrid','Europe/Athens','Europe/Moscow','Africa/Johannesburg','Asia/Dubai',
      'Asia/Kolkata','Asia/Bangkok','Asia/Singapore','Asia/Hong_Kong','Asia/Shanghai',
      'Asia/Tokyo','Australia/Sydney','Pacific/Auckland','UTC'];
  }
  return TZ_LIST;
}

function buildTimezoneUI() {
  const wrap = document.getElementById('tz-settings-rows');
  if (!wrap) return;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('dd_timezones') || '[]'); } catch(e) {}
  if (!Array.isArray(saved)) saved = [];
  const zones = timezoneList();
  wrap.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const cur = saved[i] || {};
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';

    const label = document.createElement('input');
    label.className = 'setup-input'; label.type = 'text';
    label.id = 'settings-tz-label-' + i;
    label.placeholder = 'Label (optional)';
    label.value = cur.label || '';
    label.style.cssText = 'margin-bottom:0;flex:1';

    const sel = document.createElement('select');
    sel.className = 'setup-select';
    sel.id = 'settings-tz-zone-' + i;
    sel.style.cssText = 'margin-bottom:0;flex:1.4';
    const blank = document.createElement('option');
    blank.value = ''; blank.textContent = '— none —';
    sel.appendChild(blank);
    zones.forEach(z => {
      const o = document.createElement('option');
      o.value = z; o.textContent = z.replace(/_/g, ' ');
      if (z === cur.tz) o.selected = true;
      sel.appendChild(o);
    });

    row.append(label, sel);
    wrap.appendChild(row);
  }
}

// ── BACKUP / RESTORE (all dd_* keys) ──
window.__exportSettings = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('dd_')) data[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daily-dashboard-settings.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

window.__importSettings = (file) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad');
      Object.keys(data).forEach(k => {
        if (k.startsWith('dd_')) localStorage.setItem(k, data[k]);   // only our own keys
      });
      location.reload();
    } catch(e) {
      alert('That file is not a valid Daily Dashboard settings backup.');
    }
  };
  reader.readAsText(file);
};

// Globals for inline handlers
window.__saveToggle = (key, val) => {
  localStorage.setItem('dd_tog_' + key, val);
  applyCardOrder();
};
