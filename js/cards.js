// ── CARDS.JS — all "of the day" card renderers ──
// Data is loaded once and cached here

let DATA = {};

export async function loadAllData() {
  const files = ['quotes','facts','music_facts','songs_80s','irish_words','saints','un_days'];
  const results = await Promise.all(
    files.map(f => fetch(`data/${f}.json`).then(r => r.json()))
  );
  files.forEach((f, i) => DATA[f] = results[i]);
}

export function getData(key) { return DATA[key] || []; }

// ── MOON PHASE ──
export function getMoonPhase(date) {
  const known = new Date(2000, 0, 6, 18, 14);
  const phase = ((date - known) / (86400000 * 29.53058867) % 1 + 1) % 1;
  const p = Math.round(phase * 100);
  const phases = [
    { max: 2,  svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3"/>', name: 'New moon' },
    { max: 25, svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3"/><path d="M10 2a8 8 0 0 1 0 16A6 6 0 0 1 10 2z" fill="currentColor" opacity="0.15"/>', name: 'Waxing crescent' },
    { max: 27, svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3"/><path d="M10 2v16A8 8 0 0 1 10 2z" fill="currentColor" opacity="0.18"/>', name: 'First quarter' },
    { max: 50, svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3" fill="currentColor" fill-opacity="0.12"/>', name: 'Waxing gibbous' },
    { max: 52, svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3" fill="currentColor" fill-opacity="0.2"/>', name: 'Full moon' },
    { max: 75, svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3" fill="currentColor" fill-opacity="0.12"/>', name: 'Waning gibbous' },
    { max: 77, svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3"/><path d="M10 2v16A8 8 0 0 0 10 2z" fill="currentColor" opacity="0.18"/>', name: 'Last quarter' },
    { max: 98, svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3"/><path d="M10 2a8 8 0 0 0 0 16A6 6 0 0 0 10 2z" fill="currentColor" opacity="0.15"/>', name: 'Waning crescent' },
    { max: 100,svg: '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.3"/>', name: 'New moon' },
  ];
  return phases.find(x => p <= x.max) || phases[phases.length - 1];
}

// ── BANK HOLIDAYS ──
function easter(Y) {
  const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
  const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const mo=Math.floor((h+l-7*m+114)/31),dy=((h+l-7*m+114)%31)+1;
  return new Date(Y,mo-1,dy);
}
function nthMon(y,m,n) { const d=new Date(y,m,1); let c=0; while(c<n){if(d.getDay()===1)c++;if(c<n)d.setDate(d.getDate()+1);} return d; }
function lastMon(y,m) { const d=new Date(y,m+1,0); while(d.getDay()!==1)d.setDate(d.getDate()-1); return d; }

export function getBankHols(y) {
  const e = easter(y), eMS = e.getTime();
  return [
    { name: "New Year's Day", date: new Date(y,0,1) },
    { name: "St. Brigid's Day", date: nthMon(y,1,1) },
    { name: "St. Patrick's Day", date: new Date(y,2,17) },
    { name: "Easter Monday", date: new Date(eMS+86400000) },
    { name: "May Bank Holiday", date: nthMon(y,4,1) },
    { name: "June Bank Holiday", date: nthMon(y,5,1) },
    { name: "August Bank Holiday", date: nthMon(y,7,1) },
    { name: "October Bank Holiday", date: lastMon(y,9) },
    { name: "Christmas Day", date: new Date(y,11,25) },
    { name: "St. Stephen's Day", date: new Date(y,11,26) },
  ];
}

// ── QUOTE ──
export function renderQuote(doy) {
  const q = getData('quotes')[Math.min(doy, 365) - 1];
  if (!q) return;
  document.getElementById('quote-meta').textContent = `Quote · Day ${doy}`;
  document.getElementById('quote-text').textContent = q.quote;
  document.getElementById('quote-author').textContent = `— ${q.author}`;
}

// ── STRANGE FACT ──
export function renderFact(doy) {
  const facts = getData('facts');
  document.getElementById('fact-body').textContent = facts[(doy - 1) % facts.length] || '—';
}

// ── MUSIC FACT ──
export function renderMusicFact(doy) {
  const mf = getData('music_facts');
  document.getElementById('music-body').textContent = mf[(doy - 1) % mf.length] || '—';
}

// ── 80S SONG ──
export function renderSong(doy) {
  const songs = getData('songs_80s');
  const s = songs[(doy - 1) % songs.length];
  if (!s) return;
  document.getElementById('song-title').textContent = s.title;
  document.getElementById('song-artist').textContent = `${s.artist} · ${s.year}`;
  const q = encodeURIComponent(`${s.artist} ${s.title} official`);
  document.getElementById('song-link').href = `https://www.youtube.com/results?search_query=${q}`;
}

// ── IRISH WORD ──
export function renderIrishWord(doy) {
  const words = getData('irish_words');
  const w = words[(doy - 1) % words.length];
  if (!w) return;
  document.getElementById('irish-word').textContent = w.word;
  document.getElementById('irish-pron').textContent = `/${w.pronunciation}/`;
  document.getElementById('irish-meaning').textContent = w.meaning;
  document.getElementById('irish-example').textContent = w.example;
}

// ── OBSERVANCES ──
export function renderObservances(now) {
  const saints = DATA['saints'] || {};
  const unDays = DATA['un_days'] || {};
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const key = `${mm}-${dd}`;
  const items = [];
  const saint = saints[key];
  if (saint) items.push({ tag: 'Saint', name: saint.saint, note: saint.note });
  const un = unDays[key];
  if (un) un.split(' & ').forEach(u => items.push({ tag: 'UN Day', name: u, note: '' }));
  const card = document.getElementById('section-observances');
  if (!card) return;
  if (!items.length) { card.dataset.empty = '1'; return; }
  delete card.dataset.empty;
  document.getElementById('obs-list').innerHTML = items.map(item =>
    `<div class="obs-item">
      <span class="obs-tag">${item.tag}</span>
      <div><div class="obs-name">${item.name}</div>${item.note ? `<div class="obs-note">${item.note}</div>` : ''}</div>
    </div>`
  ).join('');
}

// ── BANK HOLIDAY ──
export function renderBankHoliday(now) {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const year = now.getFullYear();
  const bhs = [...getBankHols(year), ...getBankHols(year + 1)]
    .map(bh => ({ ...bh, d0: new Date(bh.date.getFullYear(), bh.date.getMonth(), bh.date.getDate()) }))
    .sort((a, b) => a.d0 - b.d0);
  const today0 = new Date(year, now.getMonth(), now.getDate());
  const next = bhs.find(bh => bh.d0 >= today0);
  if (!next) return;
  const diff = Math.round((next.d0 - today0) / 86400000);
  document.getElementById('bh-name').textContent = next.name;
  if (diff === 0) {
    document.getElementById('bh-label').textContent = 'Today is a bank holiday';
    document.getElementById('bh-when').textContent = 'Enjoy your day!';
  } else if (diff === 1) {
    document.getElementById('bh-label').textContent = 'Bank holiday tomorrow';
    document.getElementById('bh-when').textContent = `${next.date.getDate()} ${MONTHS[next.date.getMonth()]}`;
  } else {
    document.getElementById('bh-label').textContent = 'Next bank holiday';
    document.getElementById('bh-when').textContent = `${next.date.getDate()} ${MONTHS[next.date.getMonth()]} · in ${diff} days`;
  }
}

// ── NASA APOD ──
export async function loadNASA() {
  const key = localStorage.getItem('dd_nasa_key') || '';
  const el = document.getElementById('nasa-content');
  if (!key) {
    el.innerHTML = '<div class="wotd-missing">Add a NASA API key in Settings to enable this. Free at <a href="https://api.nasa.gov" target="_blank" style="color:var(--muted)">api.nasa.gov</a>.</div>';
    return;
  }
  try {
    const r = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${key}`);
    if (!r.ok) throw new Error('API error');
    const d = await r.json();
    if (d.media_type === 'image') {
      el.innerHTML = `<img class="apod-img" src="${d.url}" alt="${d.title}" loading="lazy"><div class="apod-title">${d.title}</div><div class="apod-exp">${(d.explanation || '').slice(0, 280)}…</div>`;
    } else {
      el.innerHTML = `<div class="apod-title">${d.title}</div><div class="apod-exp">${(d.explanation || '').slice(0, 280)}…</div><a class="otd-link" href="${d.url}" target="_blank" rel="noopener"><svg viewBox="0 0 11 11" fill="none"><polygon points="2,1 10,5.5 2,10" fill="currentColor"/></svg>Watch video</a>`;
    }
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">APOD unavailable — check your API key in Settings.</div>';
  }
}

// ── JOKE ──
let jokeLoaded = false;
export async function loadJoke() {
  if (jokeLoaded) return;
  try {
    const r = await fetch('https://official-joke-api.appspot.com/random_joke');
    if (!r.ok) throw new Error();
    const d = await r.json();
    document.getElementById('joke-setup').textContent = d.setup;
    document.getElementById('joke-punchline').textContent = d.punchline;
    jokeLoaded = true;
  } catch(e) {
    try {
      const r2 = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } });
      const d2 = await r2.json();
      document.getElementById('joke-setup').textContent = d2.joke;
      document.getElementById('joke-reveal-btn').style.display = 'none';
      jokeLoaded = true;
    } catch(e2) {
      document.getElementById('joke-setup').textContent = 'Joke unavailable right now.';
    }
  }
}

export function revealPunchline() {
  document.getElementById('joke-punchline').style.display = 'block';
  document.getElementById('joke-reveal-btn').style.display = 'none';
}

// ── WORDNIK WORD OF THE DAY ──
export async function loadWordOfDay(now) {
  const key = localStorage.getItem('dd_wordnik_key') || '';
  const el = document.getElementById('wotd-content');
  if (!key) {
    el.innerHTML = '<div class="wotd-missing">Add a Wordnik API key in Settings to enable this.</div>';
    return;
  }
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  try {
    const r = await fetch(`https://api.wordnik.com/v4/words.json/wordOfTheDay?date=${dateStr}&api_key=${key}`);
    if (!r.ok) throw new Error('API error');
    const data = await r.json();
    const word = data.word || '';
    const pos  = data.definitions?.[0]?.partOfSpeech || '';
    const def  = data.definitions?.[0]?.text || '';
    const ex   = data.examples?.[0]?.text || '';
    const note = data.note || '';
    el.innerHTML = `
      <div class="wotd-word">${word}</div>
      ${pos  ? `<div class="wotd-pos">${pos}</div>` : ''}
      ${def  ? `<div class="wotd-def">${def}</div>` : ''}
      ${ex   ? `<div class="wotd-example">"${ex}"</div>` : ''}
      ${note ? `<div class="wotd-etymology">${note}</div>` : ''}`;
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">Word unavailable — check your Wordnik key in Settings.</div>';
  }
}

// ── ON THIS DAY (Wikipedia) ──
export async function loadOnThisDay(month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  try {
    const r = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${mm}/${dd}`, {
      headers: { 'User-Agent': 'DailyDashboard/2.0' }
    });
    const data = await r.json();
    renderOnThisDay(data);
  } catch(e) {
    ['atd-events','atd-births','atd-deaths'].forEach(id => {
      document.getElementById(id).innerHTML = '<div class="atd-error">Could not load — check connection.</div>';
    });
  }
}

function renderOnThisDay(data) {
  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
  function renderItems(items, id, max) {
    const el = document.getElementById(id);
    if (!items?.length) { el.innerHTML = '<div class="atd-error">None recorded.</div>'; return; }
    const chosen = shuffle(items).slice(0, max).sort((a, b) => (a.year || 0) - (b.year || 0));
    el.innerHTML = chosen.map(item => {
      const year = item.year || '';
      const text = item.text || item.pages?.[0]?.description || '';
      return `<div class="atd-item"><div class="atd-year">${year}</div><div class="atd-text">${text}</div></div>`;
    }).join('');
  }
  renderItems(data.events, 'atd-events', 4);
  renderItems(data.births, 'atd-births', 4);
  renderItems(data.deaths, 'atd-deaths', 3);
}

// ── RTÉ NEWS ──
const NEWS_FEEDS = [
  'https://www.rte.ie/news/rss/news-headlines.xml',
  'https://www.rte.ie/news/rss/',
];
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

export async function loadNews() {
  const el = document.getElementById('news-list');
  el.innerHTML = '<div class="news-loading">Loading headlines…</div>';
  for (const feedUrl of NEWS_FEEDS) {
    try {
      const r = await fetch(RSS2JSON + encodeURIComponent(feedUrl));
      if (!r.ok) continue;
      const data = await r.json();
      if (data.status !== 'ok' || !data.items?.length) continue;
      el.innerHTML = data.items.slice(0, 8).map(item => {
        const title = (item.title || '').trim();
        const link  = item.link || '#';
        const pub   = item.pubDate || '';
        const when  = pub ? new Date(pub).toLocaleTimeString('en-IE', {hour:'2-digit',minute:'2-digit',hour12:false}) : '';
        const desc  = (item.description || '').replace(/<[^>]*>/g, '').trim().slice(0, 120);
        return `<div class="news-item">
          <a class="news-headline" href="${link}" target="_blank" rel="noopener">${title}</a>
          ${desc ? `<span class="news-meta">${desc}${desc.length === 120 ? '…' : ''}</span>` : ''}
          ${when ? `<span class="news-meta">${when}</span>` : ''}
        </div>`;
      }).join('');
      return;
    } catch(e) { continue; }
  }
  el.innerHTML = '<div class="news-error">Headlines unavailable. <a href="https://www.rte.ie/news/" target="_blank" style="color:var(--muted)">Visit RTÉ News</a> directly.</div>';
}
