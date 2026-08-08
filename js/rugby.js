// ── RUGBY.JS ──
// Next fixture + league table via ESPN's keyless, CORS-open rugby API. Defaults
// to "auto" — whichever major competition is in season (live now, else soonest
// upcoming fixture) — and is switchable in Settings (dd_rugby_league).

const LEAGUES = [
  { id: '270557', name: 'United Rugby Championship' },
  { id: '180659', name: 'Six Nations' },
  { id: '271937', name: 'European Champions Cup' },
  { id: '267979', name: 'Gallagher Premiership' },
  { id: '164205', name: 'Rugby World Cup' },
];
const SB = id => `https://site.api.espn.com/apis/site/v2/sports/rugby/${id}/scoreboard`;
const ST = id => `https://site.api.espn.com/apis/v2/sports/rugby/${id}/standings`;

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

async function getJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; }
  catch(e) { return null; }
}

// From a league's events, pick the live one, else the soonest upcoming.
function pickEvent(events) {
  const now = Date.now();
  let live = null, next = null;
  for (const e of events || []) {
    const state = e?.status?.type?.state || e?.competitions?.[0]?.status?.type?.state;
    const t = new Date(e.date).getTime();
    if (state === 'in') { if (!live) live = e; }
    else if (t >= now - 3 * 3600 * 1000) {   // upcoming (3h grace for just-started)
      if (!next || t < new Date(next.date).getTime()) next = e;
    }
  }
  if (live) return { event: live, live: true };
  if (next) return { event: next, live: false };
  return null;
}

// Resolve which league + event to show (respecting the Settings override).
async function chooseLeague() {
  const stored = localStorage.getItem('dd_rugby_league') || 'auto';
  if (stored !== 'auto') {
    const league = LEAGUES.find(l => l.id === stored) || LEAGUES[0];
    const sb = await getJSON(SB(league.id));
    return { league, pick: sb ? pickEvent(sb.events) : null };
  }
  const results = await Promise.all(LEAGUES.map(async league => {
    const sb = await getJSON(SB(league.id));
    return { league, pick: sb ? pickEvent(sb.events) : null };
  }));
  const withPick = results.filter(r => r.pick);
  if (!withPick.length) return null;
  const live = withPick.find(r => r.pick.live);
  if (live) return live;
  withPick.sort((a, b) => new Date(a.pick.event.date) - new Date(b.pick.event.date));
  return withPick[0];
}

// Top-5 league table, or '' when unavailable (knockout/off-season).
async function standingsHTML(id) {
  const d = await getJSON(ST(id));
  const entries = ((d && d.children) || [])[0]?.standings?.entries || [];
  if (!entries.length) return '';
  const stat = (e, name) => {
    const s = (e.stats || []).find(x => x.name === name);
    return s ? (s.displayValue ?? s.value) : '';
  };
  const rows = entries
    .map(e => ({ e, rank: Number(stat(e, 'rank')) || 999 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .map(({ e, rank }) =>
      `<div class="rugby-standing">` +
        `<span class="rugby-pos">${rank}</span>` +
        `<span class="rugby-name">${esc(e.team?.displayName || e.team?.name || '')}</span>` +
        `<span class="rugby-pts">${esc(String(stat(e, 'points')))}</span>` +
      `</div>`
    ).join('');
  return rows ? `<div class="rugby-standings">${rows}</div>` : '';
}

export async function loadRugby() {
  const el = document.getElementById('rugby-content');
  if (!el) return;
  try {
    const chosen = await chooseLeague();
    if (!chosen || !chosen.pick) {
      el.innerHTML = '<div class="wotd-missing">No upcoming rugby fixtures right now.</div>';
      return;
    }
    const { league, pick } = chosen;
    const comp = pick.event.competitions?.[0] || {};
    const cs = comp.competitors || [];
    const home = cs.find(c => c.homeAway === 'home') || cs[0] || {};
    const away = cs.find(c => c.homeAway === 'away') || cs[1] || {};
    const hName = home.team?.displayName || home.team?.name || 'TBD';
    const aName = away.team?.displayName || away.team?.name || 'TBD';

    const d = new Date(pick.event.date);
    const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const days = Math.ceil((d - Date.now()) / 86400000);
    const countdown = days > 1 ? `in ${days} days` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : '';

    const badge = pick.live
      ? `<span class="rugby-when live">LIVE ${esc(String(home.score ?? '0'))}–${esc(String(away.score ?? '0'))}</span>`
      : (countdown ? `<span class="rugby-when">${countdown}</span>` : '');
    const sub = pick.live
      ? `${esc(league.name)} · in progress`
      : `${esc(league.name)} · ${dateStr}, ${timeStr}`;

    const table = await standingsHTML(league.id);

    el.innerHTML =
      `<div class="otd-body">${esc(hName)} <span class="rugby-v">v</span> ${esc(aName)} ${badge}</div>` +
      `<div class="otd-sub">${sub}</div>` +
      table;
  } catch(e) {
    el.innerHTML = '<div class="wotd-missing">Rugby data unavailable right now.</div>';
  }
}
