// ── APP.JS — main orchestrator ──
import { loadAllData, getData, getMoonPhase, renderQuote, renderFact,
         renderMusicFact, renderSong, renderIrishWord, renderObservances,
         renderBankHoliday, loadNASA, loadJoke, loadWordOfDay,
         loadOnThisDay, loadNews, revealPunchline } from './cards.js';
import { loadWeather, fmt } from './weather.js';
import { populateCountrySelects, applyCardOrder, getToggle,
         saveSetup, saveSetup2, skipSetup2, openSettings,
         closeSettings, saveSettings, getCardOrder } from './setup.js';

// ── DATE UTILITIES ──
function getDOY(d) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000); }
function getWeek(d) {
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 3 - (t.getDay() + 6) % 7);
  const w1 = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
}
function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── CLOCK ──
function tickClock() {
  document.getElementById('live-clock').textContent = fmt(new Date());
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

  // Header
  document.getElementById('weekday').textContent   = DAYS[now.getDay()];
  document.getElementById('full-date').textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${year}`;
  document.getElementById('badge-day').textContent  = `Day ${doy}`;
  document.getElementById('badge-week').textContent = `Week ${week}`;
  document.getElementById('badge-doy').textContent  = `${left} days remaining`;

  // Year progress
  document.getElementById('year-pct').textContent   = `${pct}%`;
  document.getElementById('year-bar').style.width   = `${pct}%`;
  document.getElementById('days-elapsed').textContent = `${doy} days elapsed`;
  document.getElementById('days-left').textContent    = `${left} to go`;

  // About this day title
  document.getElementById('atd-title').textContent = `About this Day — ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  // Moon
  const moon = getMoonPhase(now);
  document.getElementById('moon-display').innerHTML =
    `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">${moon.svg}</svg><span>${moon.name}</span>`;
  document.getElementById('moon-sub').textContent = "tonight's phase";

  // Footer timestamp
  document.getElementById('footer-updated').textContent = `Updated ${fmt(now)}`;

  // Static / embedded data cards
  renderQuote(doy);
  if (getToggle('fact'))        renderFact(doy);
  if (getToggle('music'))       renderMusicFact(doy);
  if (getToggle('song'))        renderSong(doy);
  if (getToggle('irish'))       renderIrishWord(doy);
  renderObservances(now);
  renderBankHoliday(now);

  // Apply saved card order + visibility
  applyCardOrder();

  // Async data
  loadWeather();
  if (getToggle('wotd'))        loadWordOfDay(now);
  if (getToggle('nasa'))        loadNASA();
  if (getToggle('joke'))        loadJoke();
  if (getToggle('news'))        loadNews();
  loadOnThisDay(now.getMonth() + 1, now.getDate());
}

// ── BOOT ──
window.addEventListener('load', async () => {
  // Initialise default toggles on very first run
  if (!localStorage.getItem('dd_toggles_init')) {
    ['fact','music','song','irish','nasa','joke','news','wotd','bankholiday','observances','onthisday'].forEach(k => {
      if (localStorage.getItem('dd_tog_' + k) === null) localStorage.setItem('dd_tog_' + k, 'true');
    });
    localStorage.setItem('dd_toggles_init', '1');
  }

  const savedCountry = localStorage.getItem('dd_country') || 'IE';
  populateCountrySelects(savedCountry);

  // Load all JSON data before showing anything
  await loadAllData();

  const lat = localStorage.getItem('dd_lat');
  if (lat) {
    document.getElementById('setup').style.display  = 'none';
    document.getElementById('main').style.display   = 'flex';
    document.getElementById('footer-bar').style.display = 'flex';
    init();
  }

  // Clock — tick every second
  tickClock();
  setInterval(tickClock, 1000);

  // Refresh at midnight
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(() => { init(); setInterval(init, 86400000); }, msUntilMidnight);
});

// ── EXPOSE GLOBALS for setup.js callbacks and inline HTML handlers ──
window.__initDashboard  = init;
window.__reloadWeather  = loadWeather;
window.__reloadWordOfDay = () => loadWordOfDay(new Date());
window.revealPunchline  = revealPunchline;
window.loadNews         = loadNews;

// Settings functions exposed for inline onclick handlers in HTML
window.saveSetup    = saveSetup;
window.saveSetup2   = saveSetup2;
window.skipSetup2   = skipSetup2;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings  = saveSettings;
