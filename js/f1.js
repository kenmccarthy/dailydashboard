// ── F1.JS ──
// Next Grand Prix + driver standings via Jolpica (Ergast-compatible, keyless).
import { showLoading, showError, stampUpdated } from './dom-utils.js';

export async function loadF1() {
  const el = document.getElementById('f1-content');
  if (!el) return;
  showLoading('f1-content');
  try {
    const [nextR, standR] = await Promise.all([
      fetch('https://api.jolpi.ca/ergast/f1/current/next.json').then(r => r.json()),
      fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings.json').then(r => r.json()),
    ]);
    const race = nextR?.MRData?.RaceTable?.Races?.[0];
    const standings = standR?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];

    if (!race) {
      el.innerHTML = '<div class="wotd-missing">No upcoming race — season may be over.</div>';
      stampUpdated('f1-content-updated');
      return;
    }

    // Countdown to lights-out.
    const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    const days = Math.ceil((raceDate - Date.now()) / 86400000);
    const when = days > 1 ? `in ${days} days` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : 'under way';
    const dateStr = raceDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

    // Championship top 3.
    const top = standings.slice(0, 3).map(s =>
      `<div class="f1-standing">` +
        `<span class="f1-pos">${s.position}</span>` +
        `<span class="f1-name">${s.Driver.givenName.charAt(0)}. ${s.Driver.familyName}</span>` +
        `<span class="f1-pts">${s.points}</span>` +
      `</div>`
    ).join('');

    el.innerHTML =
      `<div class="otd-body">${race.raceName} <span class="f1-when">${when}</span></div>` +
      `<div class="otd-sub">${race.Circuit.circuitName}, ${race.Circuit.Location.locality} · ${dateStr}</div>` +
      (top ? `<div class="f1-standings">${top}</div>` : '');
    stampUpdated('f1-content-updated');
  } catch(e) {
    showError('f1-content', 'F1 data unavailable right now.');
  }
}
