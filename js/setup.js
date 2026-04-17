// ── SETUP.JS — first-run setup, settings panel, toggles, card ordering ──

// Default card order (id → label)
const CARD_DEFS = [
  { id: 'quote',       label: 'Quote of the day' },
  { id: 'fact',        label: 'Strange fact of the day' },
  { id: 'music',       label: 'Music fact of the day' },
  { id: 'wotd',        label: 'Word of the day (Wordnik)' },
  { id: 'irish',       label: 'Irish word of the day' },
  { id: 'song',        label: '80s song of the day' },
  { id: 'weather',     label: 'Weather' },
  { id: 'sun',         label: 'Sunrise & sunset' },
  { id: 'moon',        label: 'Moon phase & day length' },
  { id: 'progress',    label: 'Year progress' },
  { id: 'bankholiday', label: 'Bank holiday' },
  { id: 'observances', label: 'Today\'s observances' },
  { id: 'nasa',        label: 'NASA picture of the day' },
  { id: 'joke',        label: 'Joke of the day' },
  { id: 'news',        label: 'RTÉ headlines' },
  { id: 'onthisday',   label: 'About this day' },
];

// Cards that are always visible and not shown in the order UI
const ALWAYS_ON  = new Set(['quote','weather','sun','moon','progress']);
// Cards excluded from reordering (fixed position)
const FIXED_TOP  = new Set(['header']);

export function getCardOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem('dd_card_order') || '[]');
    if (saved.length === CARD_DEFS.length) return saved;
  } catch(e) {}
  return CARD_DEFS.map(c => c.id);
}

export function getToggle(key) {
  if (ALWAYS_ON.has(key)) return true;
  return localStorage.getItem('dd_tog_' + key) !== 'false';
}

function saveToggle(key, val) {
  localStorage.setItem('dd_tog_' + key, val);
  applyCardOrder();
}

// ── APPLY CARD ORDER TO DOM ──
export function applyCardOrder() {
  const order = getCardOrder();
  const wrapper = document.getElementById('main');
  if (!wrapper) return;
  order.forEach(id => {
    const el = document.getElementById('section-' + id);
    if (!el) return;
    const visible = getToggle(id);
    el.style.display = visible ? '' : 'none';
    // appendChild moves the element to the end — calling it in order
    // produces the correct sequence without needing insertBefore
    wrapper.appendChild(el);
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
    COUNTRIES.forEach(([code, name]) => {
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
  return { lat: res[0].latitude, lon: res[0].longitude, name: res[0].name, country: res[0].country };
}

// ── SETUP STEP 1 ──
export async function saveSetup() {
  const city = document.getElementById('city-input').value.trim();
  const cc = document.getElementById('country-input').value;
  if (!city) { document.getElementById('setup-err').textContent = 'Please enter a city name.'; return; }
  document.getElementById('setup-err').textContent = '';
  const btn = document.querySelector('.setup-btn');
  btn.textContent = 'Finding location…'; btn.disabled = true;
  try {
    const geo = await geocode(city, cc);
    localStorage.setItem('dd_city', city);
    localStorage.setItem('dd_country', cc);
    localStorage.setItem('dd_lat', geo.lat);
    localStorage.setItem('dd_lon', geo.lon);
    localStorage.setItem('dd_loc_name', geo.name + ', ' + geo.country);
    document.getElementById('setup').style.display = 'none';
    document.getElementById('setup2').style.display = 'flex';
  } catch(e) {
    document.getElementById('setup-err').textContent = 'Could not find that location. Try a nearby city.';
    btn.textContent = 'Continue →'; btn.disabled = false;
  }
}

// ── SETUP STEP 2 ──
export function saveSetup2() {
  const wk = document.getElementById('setup-wordnik').value.trim();
  if (wk) localStorage.setItem('dd_wordnik_key', wk);
  const nk = document.getElementById('setup-nasa').value.trim();
  if (nk) localStorage.setItem('dd_nasa_key', nk);
  showMain();
}
export function skipSetup2() { showMain(); }

function showMain() {
  document.getElementById('setup2').style.display = 'none';
  document.getElementById('main').style.display = 'flex';
  document.getElementById('footer-bar').style.display = 'flex';
  window.__initDashboard();
}

// ── SETTINGS PANEL ──
export function openSettings() {
  document.getElementById('settings-city').value = localStorage.getItem('dd_city') || '';
  document.getElementById('settings-country').value = localStorage.getItem('dd_country') || 'IE';
  document.getElementById('settings-wordnik').value = localStorage.getItem('dd_wordnik_key') || '';
  document.getElementById('settings-nasa').value = localStorage.getItem('dd_nasa_key') || '';
  loadTogglesUI();
  buildOrderUI();
  document.getElementById('settings-panel').classList.add('open');
}
export function closeSettings() {
  document.getElementById('settings-panel').classList.remove('open');
}
export async function saveSettings() {
  const city = document.getElementById('settings-city').value.trim();
  const cc = document.getElementById('settings-country').value;
  if (!city) return;
  document.getElementById('settings-err').textContent = '';
  try {
    const geo = await geocode(city, cc);
    localStorage.setItem('dd_city', city);
    localStorage.setItem('dd_country', cc);
    localStorage.setItem('dd_lat', geo.lat);
    localStorage.setItem('dd_lon', geo.lon);
    localStorage.setItem('dd_loc_name', geo.name + ', ' + geo.country);
    const wk = document.getElementById('settings-wordnik').value.trim();
    if (wk) localStorage.setItem('dd_wordnik_key', wk);
    const nk = document.getElementById('settings-nasa').value.trim();
    if (nk) localStorage.setItem('dd_nasa_key', nk);
    closeSettings();
    window.__reloadWeather();
    window.__reloadWordOfDay();
  } catch(e) {
    document.getElementById('settings-err').textContent = 'Location not found. Try again.';
  }
}

// ── TOGGLE UI ──
function loadTogglesUI() {
  CARD_DEFS.forEach(({ id }) => {
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
  order.forEach(id => {
    const def = CARD_DEFS.find(c => c.id === id);
    if (!def) return;
    const li = document.createElement('li');
    li.className = 'card-order-item';
    li.dataset.id = id;
    li.draggable = true;
    li.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
          <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
          <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
          <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
        </svg>
      </span>
      <span class="card-order-label">${def.label}</span>
      <label class="toggle card-order-toggle">
        <input type="checkbox" id="tog-${id}" ${getToggle(id) ? 'checked' : ''} ${ALWAYS_ON.has(id) ? 'disabled' : ''} onchange="window.__saveToggle('${id}', this.checked)">
        <span class="toggle-slider"></span>
      </label>`;

    // Drag events
    li.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      document.querySelectorAll('.card-order-item').forEach(el => el.classList.remove('drag-over'));
      saveOrderFromUI();
    });
    li.addEventListener('dragover', e => {
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.card-order-item').forEach(el => el.classList.remove('drag-over'));
      li.classList.add('drag-over');
    });
    li.addEventListener('drop', e => {
      e.preventDefault();
      const fromId = e.dataTransfer.getData('text/plain');
      const fromEl = list.querySelector(`[data-id="${fromId}"]`);
      if (fromEl && fromEl !== li) list.insertBefore(fromEl, li);
    });

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

// Expose to global for inline handlers and other modules
window.__saveToggle = (key, val) => { saveToggle(key, val); };
