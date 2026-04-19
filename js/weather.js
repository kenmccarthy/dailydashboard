// ── WEATHER.JS ──
export function weatherDesc(code) {
  const m = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Light showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Hail & thunder',99:'Heavy hail & thunder'};
  return m[code] || '—';
}

export function weatherSVG(code) {
  const sun  = '<circle cx="22" cy="22" r="8" stroke="currentColor" stroke-width="1.4"/><line x1="22" y1="5" x2="22" y2="9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="22" y1="35" x2="22" y2="39" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="5" y1="22" x2="9" y2="22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="35" y1="22" x2="39" y2="22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10.1" y1="10.1" x2="12.9" y2="12.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="31.1" y1="31.1" x2="33.9" y2="33.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10.1" y1="33.9" x2="12.9" y2="31.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="31.1" y1="12.9" x2="33.9" y2="10.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
  const cloud = '<path d="M30 28H14a8 8 0 1 1 1.6-15.84A10 10 0 1 1 30 28z" stroke="currentColor" stroke-width="1.4" fill="none"/>';
  const rain  = cloud + '<line x1="16" y1="33" x2="14" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="22" y1="33" x2="20" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="28" y1="33" x2="26" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
  const snow  = cloud + '<line x1="16" y1="34" x2="16" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="22" y1="34" x2="22" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="28" y1="34" x2="28" y2="38" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="16" cy="39.5" r="1.5" fill="currentColor"/><circle cx="22" cy="39.5" r="1.5" fill="currentColor"/><circle cx="28" cy="39.5" r="1.5" fill="currentColor"/>';
  const fog   = '<line x1="8" y1="18" x2="36" y2="18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="6" y1="24" x2="38" y2="24" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="10" y1="30" x2="34" y2="30" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
  const thunder = rain + '<path d="M22 24l-3 5h3l-3 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
  if (code===0)   return sun;
  if (code<=2)    return sun + '<path d="M28 28H16a6 6 0 1 1 1.2-11.88A7.5 7.5 0 1 1 28 28z" stroke="currentColor" stroke-width="1.3" fill="none" opacity="0.45"/>';
  if (code===3)   return cloud;
  if (code<=48)   return fog;
  if (code<=67)   return rain;
  if (code<=77)   return snow;
  if (code<=82)   return rain;
  if (code<=86)   return snow;
  return thunder;
}

export function moonSVG(phase) {
  // Returns a small inline SVG for the moon phase
  const svgs = {
    'New moon':         '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="none"/>',
    'Waxing crescent':  '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 1a7 7 0 0 1 0 14A5.5 5.5 0 0 1 8 1z" fill="currentColor" opacity="0.2"/>',
    'First quarter':    '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 1v14A7 7 0 0 1 8 1z" fill="currentColor" opacity="0.25"/>',
    'Waxing gibbous':   '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.15"/>',
    'Full moon':         '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.25"/>',
    'Waning gibbous':   '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.15"/>',
    'Last quarter':     '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 1v14A7 7 0 0 0 8 1z" fill="currentColor" opacity="0.25"/>',
    'Waning crescent':  '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 1a7 7 0 0 0 0 14A5.5 5.5 0 0 0 8 1z" fill="currentColor" opacity="0.2"/>',
  };
  const inner = svgs[phase] || svgs['New moon'];
  return `<svg class="sb-moon-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

export function fmt(d) {
  // AM/PM, no leading zero
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;  // 12-hour, no leading zero
  return `${hours}:${mins} ${ampm}`;
}

function getMoonPhase(date) {
  const known = new Date(2000, 0, 6, 18, 14);
  const phase = ((date - known) / (86400000 * 29.53058867) % 1 + 1) % 1;
  const p = Math.round(phase * 100);
  const phases = [
    {max:2, name:'New moon'},{max:25,name:'Waxing crescent'},{max:27,name:'First quarter'},
    {max:50,name:'Waxing gibbous'},{max:52,name:'Full moon'},{max:75,name:'Waning gibbous'},
    {max:77,name:'Last quarter'},{max:98,name:'Waning crescent'},{max:100,name:'New moon'},
  ];
  return (phases.find(x => p <= x.max) || phases[phases.length-1]).name;
}

export async function loadWeather() {
  const lat = localStorage.getItem('dd_lat');
  const lon = localStorage.getItem('dd_lon');
  const loc = localStorage.getItem('dd_loc_name') || '';
  if (!lat || !lon) return;
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=sunrise,sunset&timezone=auto&forecast_days=1&past_days=1`
    );
    const data = await r.json();
    const c = data.current, d = data.daily;
    const riseYest = new Date(d.sunrise[0]), setYest = new Date(d.sunset[0]);
    const rise = new Date(d.sunrise[1]), set = new Date(d.sunset[1]);
    const lenMs = set - rise;
    const lenH  = Math.floor(lenMs / 3600000);
    const lenM  = Math.floor((lenMs % 3600000) / 60000);
    const diffSec = Math.round((lenMs - (setYest - riseYest)) / 1000);
    const diffAbs = Math.abs(diffSec);
    const dM = Math.floor(diffAbs/60), dS = diffAbs%60;
    const diffStr = dM>0 ? `${dM}m ${dS}s` : `${dS}s`;
    const diffLabel = diffSec>0 ? `+${diffStr} vs yesterday` : diffSec<0 ? `−${diffStr} vs yesterday` : 'Same as yesterday';
    const moonName = getMoonPhase(new Date());

    // Update weather SVG icon
    const svgEl = document.getElementById('sb-weather-svg');
    if (svgEl) svgEl.innerHTML = weatherSVG(c.weather_code);

    set$('sb-temp',   `${Math.round(c.temperature_2m)}°C`);
    set$('sb-desc',   weatherDesc(c.weather_code));
    set$('sb-loc',    loc);
    set$('sb-feels',  `${Math.round(c.apparent_temperature)}°C`);
    set$('sb-wind',   `${Math.round(c.wind_speed_10m)} km/h`);
    set$('sb-rise',   fmt(rise));
    set$('sb-set',    fmt(set));
    set$('sb-daylen', `${lenH}h ${lenM}m · ${diffLabel}`);

    // Moon with SVG icon
    const moonEl = document.getElementById('sb-moon');
    if (moonEl) moonEl.innerHTML = moonSVG(moonName) + moonName;

  } catch(e) {
    set$('sb-desc', 'Weather unavailable');
  }
}

function set$(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
