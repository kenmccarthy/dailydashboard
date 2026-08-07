// ── SPECIAL.JS ──
// User-defined special dates — birthdays, anniversaries, one-off countdowns —
// shown in the sidebar sorted by how soon they are. Stored in dd_special_dates
// as [{name, date:"YYYY-MM-DD", annual:bool}].

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

export function getSpecialDates() {
  try {
    const v = JSON.parse(localStorage.getItem('dd_special_dates') || '[]');
    return Array.isArray(v) ? v : [];
  } catch(e) { return []; }
}

// Whole days from `a` to `b`, counted at local midnight so DST can't skew it.
function daysBetween(a, b) {
  const ms = new Date(b.getFullYear(), b.getMonth(), b.getDate()) -
             new Date(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86400000);
}

// Next occurrence of an entry, with day count and (for annual) the year count.
function nextOccurrence(entry, now) {
  const parts = String(entry.date || '').split('-').map(Number);   // [Y, M, D]
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  if (entry.annual) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let occ = new Date(now.getFullYear(), m - 1, d);
    if (occ < today) occ = new Date(now.getFullYear() + 1, m - 1, d);
    return { occ, days: daysBetween(now, occ), years: occ.getFullYear() - y };
  }
  const occ = new Date(y, m - 1, d);
  const days = daysBetween(now, occ);
  if (days < 0) return null;   // one-off already passed — drop it
  return { occ, days, years: null };
}

export function loadSpecialDates(now = new Date()) {
  const section = document.getElementById('sb-special-section');
  const el = document.getElementById('sb-special-list');
  if (!el) return;
  const items = getSpecialDates()
    .map(e => ({ e, o: nextOccurrence(e, now) }))
    .filter(x => x.o)
    .sort((a, b) => a.o.days - b.o.days);
  if (!items.length) {
    if (section) section.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  if (section) section.style.display = '';
  el.innerHTML = items.map(({ e, o }) => {
    const when = o.days === 0 ? 'Today!' : o.days === 1 ? 'Tomorrow' : `in ${o.days} days`;
    const dateLabel = `${o.occ.getDate()} ${MONTHS[o.occ.getMonth()]}`;
    const yrs = (e.annual && o.years > 0) ? ` · ${o.years} yr${o.years === 1 ? '' : 's'}` : '';
    return `<div class="sb-special-item">` +
      `<div class="sb-special-top">` +
        `<span class="sb-special-name">${esc(e.name || 'Untitled')}</span>` +
        `<span class="sb-special-when${o.days === 0 ? ' is-today' : ''}">${when}</span>` +
      `</div>` +
      `<div class="sb-special-date">${dateLabel}${yrs}</div>` +
    `</div>`;
  }).join('');
}
