// ── SPACE.JS ──
// "People in space" via a keyless, CORS-open static JSON mirror of the
// open-notify data (corquaid, hosted on GitHub Pages over HTTPS).

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// "us" → 🇺🇸 (two regional-indicator letters); fallback to a satellite glyph.
function flagEmoji(code) {
  if (!code || code.length !== 2) return '🛰️';
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export async function loadSpace() {
  const el = document.getElementById('space-content');
  if (!el) return;
  try {
    const r = await fetch('https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json');
    if (!r.ok) throw new Error();
    const d = await r.json();
    const people = Array.isArray(d.people) ? d.people : [];
    if (!people.length) {
      el.innerHTML = '<div class="wotd-missing">No crew data right now.</div>';
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
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">Space crew data unavailable right now.</div>';
  }
}
