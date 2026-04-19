// ── CARDS.JS ──
let DATA = {};

export async function loadAllData() {
  const files = ['quotes','facts','music_facts','songs_80s','irish_words','saints','un_days','proverbs'];
  const results = await Promise.all(files.map(f => fetch(`data/${f}.json`).then(r => r.json())));
  files.forEach((f, i) => DATA[f] = results[i]);
}

export function getData(key) { return DATA[key] || []; }

// ── Bank Holidays ──
function easter(Y) {
  const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
  const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  return new Date(Y, Math.floor((h+l-7*m+114)/31)-1, ((h+l-7*m+114)%31)+1);
}
function nthMon(y,m,n) { const d=new Date(y,m,1); let c=0; while(c<n){if(d.getDay()===1)c++;if(c<n)d.setDate(d.getDate()+1);} return d; }
function lastMon(y,m)  { const d=new Date(y,m+1,0); while(d.getDay()!==1)d.setDate(d.getDate()-1); return d; }

export function getBankHols(y) {
  const e=easter(y);
  return [
    {name:"New Year's Day",     date:new Date(y,0,1)},
    {name:"St. Brigid's Day",   date:nthMon(y,1,1)},
    {name:"St. Patrick's Day",  date:new Date(y,2,17)},
    {name:"Easter Monday",      date:new Date(e.getTime()+86400000)},
    {name:"May Bank Holiday",   date:nthMon(y,4,1)},
    {name:"June Bank Holiday",  date:nthMon(y,5,1)},
    {name:"August Bank Holiday",date:nthMon(y,7,1)},
    {name:"October Bank Holiday",date:lastMon(y,9)},
    {name:"Christmas Day",      date:new Date(y,11,25)},
    {name:"St. Stephen's Day",  date:new Date(y,11,26)},
  ];
}

// ── RENDERERS ──
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function renderQuote(doy) {
  const q = getData('quotes')[Math.min(doy,365)-1];
  if (!q) return;
  set$('quote-meta',   `Quote · Day ${doy}`);
  set$('quote-text',   q.quote);
  set$('quote-author', `— ${q.author}`);
}

export function renderFact(doy) {
  const d = getData('facts');
  set$('fact-body', d[(doy-1) % d.length] || '—');
}

export function renderMusicFact(doy) {
  const d = getData('music_facts');
  set$('music-body', d[(doy-1) % d.length] || '—');
}

export function renderSong(doy) {
  const d = getData('songs_80s');
  const s = d[(doy-1) % d.length];
  if (!s) return;
  set$('song-title',  s.title);
  set$('song-artist', `${s.artist} · ${s.year}`);
  const el = document.getElementById('song-link');
  if (el) el.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(s.artist+' '+s.title+' official')}`;
}

export function renderIrishWord(doy) {
  const d = getData('irish_words');
  const w = d[(doy-1) % d.length];
  if (!w) return;
  set$('irish-word',    w.word);
  set$('irish-pron',    `/${w.pronunciation}/`);
  set$('irish-meaning', w.meaning);
  set$('irish-example', w.example);
}

export function renderProverb(doy) {
  const d = getData('proverbs');
  const p = d[(doy-1) % d.length];
  if (!p) return;
  set$('proverb-irish',   p.irish);
  set$('proverb-english', p.english);
  set$('proverb-literal', `Literally: "${p.literal}"`);
}

export function renderObservances(now) {
  const saints = DATA['saints'] || {};
  const unDays = DATA['un_days'] || {};
  const key = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const items = [];
  const saint = saints[key];
  if (saint) items.push({tag:'Saint', name:saint.saint, note:saint.note});
  const un = unDays[key];
  if (un) un.split(' & ').forEach(u => items.push({tag:'UN Day', name:u, note:''}));
  const el = document.getElementById('obs-list');
  if (!el) return;
  if (!items.length) { el.innerHTML = '<div class="wotd-missing">No observances today.</div>'; return; }
  el.innerHTML = items.map(item =>
    `<div class="obs-item">
      <span class="obs-tag">${item.tag}</span>
      <div><div class="obs-name">${item.name}</div>${item.note?`<div class="obs-note">${item.note}</div>`:''}</div>
    </div>`
  ).join('');
}

export function renderBankHoliday(now) {
  const year = now.getFullYear();
  const bhs = [...getBankHols(year), ...getBankHols(year+1)]
    .map(bh => ({...bh, d0: new Date(bh.date.getFullYear(), bh.date.getMonth(), bh.date.getDate())}))
    .sort((a,b) => a.d0 - b.d0);
  const today0 = new Date(year, now.getMonth(), now.getDate());
  const next = bhs.find(bh => bh.d0 >= today0);
  if (!next) return;
  const diff = Math.round((next.d0 - today0) / 86400000);
  set$('sb-bh-name', next.name);
  set$('sb-bh-when',
    diff === 0 ? 'Today — enjoy your day off!' :
    diff === 1 ? `Tomorrow · ${next.date.getDate()} ${MONTHS[next.date.getMonth()]}` :
    `${next.date.getDate()} ${MONTHS[next.date.getMonth()]} · in ${diff} days`
  );
}

export async function loadNASA() {
  const key = localStorage.getItem('dd_nasa_key') || '';
  const el = document.getElementById('nasa-content');
  if (!el) return;
  if (!key) { el.innerHTML = '<div class="wotd-missing">Add a NASA API key in Settings to enable this. Free at <a href="https://api.nasa.gov" target="_blank" style="color:var(--muted)">api.nasa.gov</a>.</div>'; return; }
  try {
    const r = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${key}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    el.innerHTML = d.media_type === 'image'
      ? `<img class="apod-img" src="${d.url}" alt="${d.title}" loading="lazy"><div class="apod-title">${d.title}</div><div class="apod-exp">${(d.explanation||'').slice(0,300)}…</div>`
      : `<div class="apod-title">${d.title}</div><div class="apod-exp">${(d.explanation||'').slice(0,300)}…</div><a class="otd-link" href="${d.url}" target="_blank">Watch video</a>`;
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">APOD unavailable — check your API key in Settings.</div>';
  }
}

let jokeLoaded = false;
export async function loadJoke() {
  if (jokeLoaded) return;
  try {
    const r = await fetch('https://official-joke-api.appspot.com/random_joke');
    if (!r.ok) throw new Error();
    const d = await r.json();
    set$('joke-setup',     d.setup);
    set$('joke-punchline', d.punchline);
    jokeLoaded = true;
  } catch(e) {
    try {
      const r2 = await fetch('https://icanhazdadjoke.com/', {headers:{Accept:'application/json'}});
      const d2 = await r2.json();
      set$('joke-setup', d2.joke);
      const btn = document.getElementById('joke-reveal-btn');
      if (btn) btn.style.display = 'none';
      jokeLoaded = true;
    } catch(e2) {
      set$('joke-setup', 'Joke unavailable right now.');
    }
  }
}

export function revealPunchline() {
  const p = document.getElementById('joke-punchline');
  const b = document.getElementById('joke-reveal-btn');
  if (p) p.style.display = 'block';
  if (b) b.style.display = 'none';
}

export async function loadWordOfDay(now) {
  const key = localStorage.getItem('dd_wordnik_key') || '';
  const el = document.getElementById('wotd-content');
  if (!el) return;
  if (!key) { el.innerHTML = '<div class="wotd-missing">Add a Wordnik API key in Settings to enable this.</div>'; return; }
  const ds = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  try {
    const r = await fetch(`https://api.wordnik.com/v4/words.json/wordOfTheDay?date=${ds}&api_key=${key}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    el.innerHTML = `
      <div class="wotd-word">${d.word||''}</div>
      ${d.definitions?.[0]?.partOfSpeech ? `<div class="wotd-pos">${d.definitions[0].partOfSpeech}</div>` : ''}
      ${d.definitions?.[0]?.text ? `<div class="wotd-def">${d.definitions[0].text}</div>` : ''}
      ${d.examples?.[0]?.text ? `<div class="wotd-example">"${d.examples[0].text}"</div>` : ''}
      ${d.note ? `<div class="wotd-etymology">${d.note}</div>` : ''}`;
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">Word unavailable — check your Wordnik key in Settings.</div>';
  }
}

export async function loadOnThisDay(month, day) {
  const mm = String(month).padStart(2,'0'), dd = String(day).padStart(2,'0');
  try {
    const r = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${mm}/${dd}`, {headers:{'User-Agent':'DailyDashboard/2.0'}});
    const data = await r.json();
    const shuffle = arr => [...arr].sort(() => Math.random()-0.5);
    const renderItems = (items, id, max) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!items?.length) { el.innerHTML = '<div class="atd-loading">None recorded.</div>'; return; }
      el.innerHTML = shuffle(items).slice(0,max).sort((a,b)=>(a.year||0)-(b.year||0)).map(item =>
        `<div class="atd-item"><div class="atd-year">${item.year||''}</div><div class="atd-text">${item.text||item.pages?.[0]?.description||''}</div></div>`
      ).join('');
    };
    renderItems(data.events, 'atd-events', 4);
    renderItems(data.births, 'atd-births', 4);
    renderItems(data.deaths, 'atd-deaths', 3);
  } catch(e) {
    ['atd-events','atd-births','atd-deaths'].forEach(id => set$(id, '<div class="atd-loading">Could not load.</div>'));
  }
}

export async function loadNews() {
  const el = document.getElementById('sb-news-list');
  if (!el) return;
  el.innerHTML = '<div class="sb-news-loading">Loading…</div>';
  const feeds = ['https://www.rte.ie/news/rss/news-headlines.xml','https://www.rte.ie/news/rss/'];
  const proxy = 'https://api.rss2json.com/v1/api.json?rss_url=';
  for (const feed of feeds) {
    try {
      const r = await fetch(proxy + encodeURIComponent(feed));
      if (!r.ok) continue;
      const data = await r.json();
      if (data.status !== 'ok' || !data.items?.length) continue;
      el.innerHTML = data.items.slice(0,8).map(item => {
        const when = item.pubDate ? new Date(item.pubDate).toLocaleTimeString('en-IE',{hour:'2-digit',minute:'2-digit',hour12:false}) : '';
        return `<a class="sb-news-item" href="${item.link||'#'}" target="_blank" rel="noopener">
          ${(item.title||'').trim()}
          ${when ? `<div class="sb-news-meta">${when}</div>` : ''}
        </a>`;
      }).join('');
      return;
    } catch(e) { continue; }
  }
  el.innerHTML = '<div class="sb-news-loading">Headlines unavailable. <a href="https://www.rte.ie/news/" target="_blank" style="color:var(--hint)">Visit RTÉ</a></div>';
}

function set$(id, val) {
  const el = document.getElementById(id);
  if (el) typeof val === 'string' && val.includes('<') ? el.innerHTML = val : el.textContent = val;
}
