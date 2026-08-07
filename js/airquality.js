// ── AIRQUALITY.JS ──
// Air quality + pollen via the keyless Open-Meteo Air Quality API.

// European AQI value → {label, colour} using the official EAQI bands.
function aqiBand(aqi) {
  if (aqi == null)  return { label: '—',              color: 'var(--muted)' };
  if (aqi <= 20)    return { label: 'Good',           color: '#4caf50' };
  if (aqi <= 40)    return { label: 'Fair',           color: '#a3c853' };
  if (aqi <= 60)    return { label: 'Moderate',       color: '#f0c000' };
  if (aqi <= 80)    return { label: 'Poor',           color: '#ff8c42' };
  if (aqi <= 100)   return { label: 'Very poor',      color: '#e53935' };
  return              { label: 'Extremely poor', color: '#8e24aa' };
}

// Pollen count (grains/m³) → generic level.
function pollenLevel(v) {
  if (v == null) return null;
  if (v < 10)  return 'Low';
  if (v < 30)  return 'Moderate';
  if (v < 100) return 'High';
  return 'Very high';
}

export async function loadAirQuality() {
  const el = document.getElementById('sb-aq');
  if (!el) return;
  const lat = localStorage.getItem('dd_lat');
  const lon = localStorage.getItem('dd_lon');
  if (!lat || !lon) {
    el.innerHTML = '<div class="sb-news-loading">Set a location to see air quality.</div>';
    return;
  }
  try {
    const r = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,pm2_5,pm10,ozone,grass_pollen,birch_pollen,alder_pollen&timezone=auto`
    );
    if (!r.ok) throw new Error();
    const c = (await r.json()).current;
    const band = aqiBand(c.european_aqi);

    // Highest of the tracked pollen types (Europe-only data from CAMS).
    const pollens = [['Grass', c.grass_pollen], ['Birch', c.birch_pollen], ['Alder', c.alder_pollen]]
      .filter(([, v]) => v != null)
      .sort((a, b) => b[1] - a[1]);
    const top = pollens[0];
    const pollenStr = top && top[1] > 0
      ? `${top[0]} pollen: ${pollenLevel(top[1])}`
      : 'Pollen: none detected';

    el.innerHTML =
      `<span class="sb-label">Air quality &amp; pollen</span>` +
      `<div class="sb-aq-head">` +
        `<span class="sb-aq-dot" style="background:${band.color}"></span>` +
        `<span class="sb-aq-index">${Math.round(c.european_aqi)}</span>` +
        `<span class="sb-aq-level">${band.label}</span>` +
      `</div>` +
      `<div class="sb-aq-sub">${pollenStr}</div>` +
      `<div class="sb-aq-sub">PM2.5 ${c.pm2_5} · PM10 ${c.pm10} · O₃ ${Math.round(c.ozone)} µg/m³</div>`;
  } catch(e) {
    el.innerHTML = '<div class="sb-news-loading">Air quality unavailable right now.</div>';
  }
}
