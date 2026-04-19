// ── APP.JS ──
import { loadAllData, renderQuote, renderFact, renderMusicFact, renderSong,
         renderIrishWord, renderProverb, renderObservances, renderBankHoliday,
         loadNASA, loadJoke, loadWordOfDay, loadOnThisDay, loadNews,
         revealPunchline } from './cards.js';
import { loadWeather, fmt, moonSVG } from './weather.js';
import { populateCountrySelects, applyCardOrder, applyTheme, getToggle,
         saveSetup, saveSetup2, skipSetup2, openSettings, closeSettings,
         saveSettings, setMode, setAccent } from './setup.js';

// ── DATE UTILS ──
function getDOY(d) { return Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000); }
function getWeek(d) {
  const t = new Date(d); t.setHours(0,0,0,0);
  t.setDate(t.getDate() + 3 - (t.getDay()+6)%7);
  const w1 = new Date(t.getFullYear(),0,4);
  return 1 + Math.round(((t-w1)/86400000 - 3 + (w1.getDay()+6)%7) / 7);
}
function isLeap(y) { return (y%4===0&&y%100!==0)||y%400===0; }

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── CLOCK ──
function tickClock() {
  const now = new Date();
  set$('sb-time', fmt(now));
}

// ── MAIN INIT ──
async function init() {
  const now   = new Date();
  const year  = now.getFullYear();
  const doy   = getDOY(now);
  const total = isLeap(year) ? 366 : 365;
  const left  = total - doy;
  const week  = getWeek(now);
  const pct   = (doy / total * 100).toFixed(1);

  // Sidebar header
  set$('sb-day',        DAYS[now.getDay()]);
  set$('sb-date',       `${now.getDate()} ${MONTHS[now.getMonth()]} ${year}`);
  set$('sb-badge-day',  `Day ${doy}`);
  set$('sb-badge-week', `Week ${week}`);
  set$('sb-badge-left', `${left} days remaining`);

  // Progress
  set$('sb-pct',         `${pct}%`);
  set$('sb-progress-sub',`${doy} elapsed · ${left} to go`);
  const bar = document.getElementById('sb-bar');
  if (bar) bar.style.width = `${pct}%`;

  // About this day title
  set$('atd-title', `About this Day — ${now.getDate()} ${MONTHS[now.getMonth()]}`);

  // Footer
  set$('sb-updated', `Updated ${fmt(now)}`);

  // Static data cards
  renderQuote(doy);
  if (getToggle('fact'))        renderFact(doy);
  if (getToggle('music'))       renderMusicFact(doy);
  if (getToggle('song'))        renderSong(doy);
  if (getToggle('irish'))       renderIrishWord(doy);
  if (getToggle('proverb'))     renderProverb(doy);
  renderObservances(now);
  renderBankHoliday(now);

  // Apply saved card order + visibility
  applyCardOrder();

  // Async
  loadWeather();
  if (getToggle('wotd'))    loadWordOfDay(now);
  if (getToggle('nasa'))    loadNASA();
  if (getToggle('joke'))    loadJoke();
  if (getToggle('news')) loadNews();
  loadOnThisDay(now.getMonth()+1, now.getDate());
  renderObservancesSidebar(now);
}

// ── BOOT ──
window.addEventListener('load', async () => {
  // Restore theme immediately (before any render)
  applyTheme();

  // Default toggles on first run
  if (!localStorage.getItem('dd_toggles_init')) {
    ['fact','music','song','irish','proverb','nasa','joke','news','wotd','onthisday'].forEach(k => {
      if (localStorage.getItem('dd_tog_'+k) === null) localStorage.setItem('dd_tog_'+k, 'true');
    });
    localStorage.setItem('dd_toggles_init', '1');
  }

  const savedCountry = localStorage.getItem('dd_country') || 'IE';
  populateCountrySelects(savedCountry);

  await loadAllData();

  const lat = localStorage.getItem('dd_lat');
  if (lat) {
    document.getElementById('setup').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    init();
  }

  tickClock();
  setInterval(tickClock, 1000);
  updateDarkToggleIcon();

  // Midnight refresh
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1) - now;
  setTimeout(() => { init(); setInterval(init, 86400000); }, msUntilMidnight);
});

// ── GLOBALS ──
window.__initDashboard   = init;
window.__reloadWeather   = loadWeather;
window.__reloadWordOfDay = () => loadWordOfDay(new Date());
window.revealPunchline   = revealPunchline;
window.loadNews          = loadNews;
window.saveSetup         = saveSetup;
window.saveSetup2        = saveSetup2;
window.skipSetup2        = skipSetup2;
window.openSettings      = openSettings;
window.closeSettings     = closeSettings;
window.saveSettings      = saveSettings;
window.setMode           = setMode;
window.setAccent         = setAccent;
window.toggleDark        = toggleDark;

function toggleDark() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  setMode(next);
  // Update button icon
  const btn = document.getElementById('dark-toggle-btn');
  if (btn) btn.textContent = next === 'dark' ? '☀' : '☾';
}

function updateDarkToggleIcon() {
  const mode = localStorage.getItem('dd_mode') || 'light';
  const btn = document.getElementById('dark-toggle-btn');
  if (btn) btn.textContent = mode === 'dark' ? '☀' : '☾';
}

async function renderObservancesSidebar(now) {
  const [saintsRes, unRes] = await Promise.all([
    fetch('data/saints.json').then(r=>r.json()).catch(()=>({})),
    fetch('data/un_days.json').then(r=>r.json()).catch(()=>({})),
  ]);
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const key = mm+'-'+dd;
  const items = [];
  const saint = saintsRes[key];
  if (saint) items.push({tag:'Saint', name:saint.saint, note:saint.note});
  const un = unRes[key];
  if (un) un.split(' & ').forEach(u => items.push({tag:'UN Day', name:u, note:''}));
  const el = document.getElementById('sb-obs-list');
  if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="sb-news-loading">No observances today.</div>'; return; }
  el.innerHTML = items.map(item =>
    `<div class="sb-obs-item">
      <span class="sb-obs-tag">${item.tag}</span>
      <span class="sb-obs-name">${item.name}</span>
      ${item.note ? `<div class="sb-obs-note">${item.note}</div>` : ''}
    </div>`
  ).join('');
}

function set$(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
