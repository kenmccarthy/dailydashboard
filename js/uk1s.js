// ── UK1S.JS ──
// "This week in history" — the UK #1 single 10/20/30/40/50 years ago today.
// Data is a bundled, offline snapshot of the Official Charts number ones
// (data/uk_number_ones.json), so this card needs no network and never goes stale.

let UKNO = null;

async function getData() {
  if (UKNO) return UKNO;
  try { UKNO = await fetch('data/uk_number_ones.json').then(r => r.json()); }
  catch(e) { UKNO = []; }
  return UKNO;
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The #1 for the chart week containing `dateObj`. A chart dated D (a Saturday
// pre-2015, a Thursday since) is the current chart for the week ending on D, so
// the record in force on a given day is the last one dated on/before day+6.
function chartOn(data, dateObj) {
  const t = new Date(dateObj);
  t.setDate(t.getDate() + 6);
  const key = ymd(t);
  let best = null;
  for (const r of data) {
    if (r.date <= key) best = r;
    else break;
  }
  return best;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

export async function loadUKNumberOnes() {
  const el = document.getElementById('uk1s-content');
  if (!el) return;
  const data = await getData();
  if (!data.length) {
    el.innerHTML = '<div class="wotd-missing">Chart data unavailable.</div>';
    return;
  }
  const now = new Date();
  const rows = [10, 20, 30, 40, 50].map(n => {
    const d = new Date(now.getFullYear() - n, now.getMonth(), now.getDate());
    return { n, hit: chartOn(data, d) };
  }).filter(r => r.hit);

  if (!rows.length) {
    el.innerHTML = '<div class="wotd-missing">No chart data for these dates.</div>';
    return;
  }

  el.innerHTML = rows.map(({ n, hit }) => {
    const q = encodeURIComponent(`${hit.artist} ${hit.song}`);
    return `<div class="ukno-row">` +
      `<div class="ukno-yrs">${n} yrs</div>` +
      `<div class="ukno-info">` +
        `<a class="ukno-song" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">${esc(hit.song)}</a>` +
        `<div class="ukno-artist">${esc(hit.artist)}</div>` +
      `</div>` +
    `</div>`;
  }).join('');
}
