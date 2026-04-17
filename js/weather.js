// ── WEATHER.JS — Open-Meteo weather, sunrise/sunset, day length ──

export function weatherDesc(code) {
  const m = {
    0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
    45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',
    61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',
    75:'Heavy snow',77:'Snow grains',80:'Light showers',81:'Showers',
    82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',
    95:'Thunderstorm',96:'Hail & thunder',99:'Heavy hail & thunder'
  };
  return m[code] || '—';
}

export function weatherSVG(code) {
  const sun = '<circle cx="22" cy="22" r="8" stroke="currentColor" stroke-width="1.4"/><line x1="22" y1="5" x2="22" y2="9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="22" y1="35" x2="22" y2="39" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="5" y1="22" x2="9" y2="22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="35" y1="22" x2="39" y2="22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10.1" y1="10.1" x2="12.9" y2="12.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="31.1" y1="31.1" x2="33.9" y2="33.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10.1" y1="33.9" x2="12.9" y2="31.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="31.1" y1="12.9" x2="33.9" y2="10.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
  const cloud = '<path d="M30 28H14a8 8 0 1 1 1.6-15.84A10 10 0 1 1 30 28z" stroke="currentColor" stroke-width="1.4" fill="none"/>';
  const rain = cloud + '<line x1="16" y1="33" x2="14" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="22" y1="33" x2="20" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="28" y1="33" x2="26" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
  const snow = cloud + '<line x1="16" y1="34" x2="16" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="22" y1="34" x2="22" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="28" y1="34" x2="28" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="16" cy="39" r="1.2" fill="currentColor"/><circle cx="22" cy="39" r="1.2" fill="currentColor"/><circle cx="28" cy="39" r="1.2" fill="currentColor"/>';
  const fog = '<line x1="8" y1="18" x2="36" y2="18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="6" y1="24" x2="38" y2="24" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10" y1="30" x2="34" y2="30" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
  const thunder = rain + '<path d="M22 24l-3 5h3l-3 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
  if (code === 0) return sun;
  if (code <= 2) return sun + '<path d="M28 28H16a6 6 0 1 1 1.2-11.88A7.5 7.5 0 1 1 28 28z" stroke="currentColor" stroke-width="1.3" fill="none" opacity="0.4"/>';
  if (code === 3) return cloud;
  if (code <= 48) return fog;
  if (code <= 67) return rain;
  if (code <= 77) return snow;
  if (code <= 82) return rain;
  if (code <= 86) return snow;
  return thunder;
}

export async function fetchWeather(lat, lon) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=sunrise,sunset&timezone=auto&forecast_days=1&past_days=1`
  );
  return r.json();
}

export function fmt(d) {
  return d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export async function loadWeather() {
  const lat = localStorage.getItem('dd_lat');
  const lon = localStorage.getItem('dd_lon');
  const loc = localStorage.getItem('dd_loc_name') || '';
  if (!lat || !lon) return;
  try {
    const data = await fetchWeather(lat, lon);
    const c = data.current, d = data.daily;

    document.getElementById('w-icon-svg').innerHTML = weatherSVG(c.weather_code);
    document.getElementById('w-temp').textContent = `${Math.round(c.temperature_2m)}°C`;
    document.getElementById('w-desc').textContent = weatherDesc(c.weather_code);
    document.getElementById('w-loc').textContent = loc;
    document.getElementById('w-feels').textContent = `${Math.round(c.apparent_temperature)}°C`;
    document.getElementById('w-humidity').textContent = `${c.relative_humidity_2m}%`;
    document.getElementById('w-wind').textContent = `${Math.round(c.wind_speed_10m)} km/h`;

    // d[0] = yesterday, d[1] = today
    const riseYest = new Date(d.sunrise[0]), setYest = new Date(d.sunset[0]);
    const rise = new Date(d.sunrise[1]), set = new Date(d.sunset[1]);

    document.getElementById('sun-rise').textContent = fmt(rise);
    document.getElementById('sun-set').textContent = fmt(set);

    const lenMs = set - rise;
    const lenH = Math.floor(lenMs / 3600000);
    const lenM = Math.floor((lenMs % 3600000) / 60000);
    document.getElementById('day-length').textContent = `${lenH}h ${lenM}m`;

    const lenYestMs = setYest - riseYest;
    const diffSec = Math.round((lenMs - lenYestMs) / 1000);
    const diffAbs = Math.abs(diffSec);
    const diffM = Math.floor(diffAbs / 60), diffS = diffAbs % 60;
    const diffStr = diffM > 0 ? `${diffM}m ${diffS}s` : `${diffS}s`;
    document.getElementById('day-length-sub').textContent =
      diffSec > 0 ? `+${diffStr} vs yesterday` :
      diffSec < 0 ? `−${diffStr} vs yesterday` : 'Same as yesterday';
  } catch(e) {
    document.getElementById('w-desc').textContent = 'Weather unavailable';
  }
}
