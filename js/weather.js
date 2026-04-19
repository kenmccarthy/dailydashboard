// ── WEATHER.JS ──
export function weatherDesc(code) {
  const m = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Light showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Hail & thunder',99:'Heavy hail & thunder'};
  return m[code] || '—';
}

export function fmt(d) {
  return d.toLocaleTimeString('en-IE', {hour:'2-digit', minute:'2-digit', hour12:false});
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

    // past_days=1: d[0]=yesterday, d[1]=today
    const riseYest = new Date(d.sunrise[0]), setYest = new Date(d.sunset[0]);
    const rise = new Date(d.sunrise[1]), set  = new Date(d.sunset[1]);
    const lenMs = set - rise;
    const lenH  = Math.floor(lenMs / 3600000);
    const lenM  = Math.floor((lenMs % 3600000) / 60000);
    const diffSec = Math.round((lenMs - (setYest - riseYest)) / 1000);
    const diffAbs = Math.abs(diffSec);
    const dM = Math.floor(diffAbs / 60), dS = diffAbs % 60;
    const diffStr = dM > 0 ? `${dM}m ${dS}s` : `${dS}s`;
    const diffLabel = diffSec > 0 ? `+${diffStr} vs yesterday` : diffSec < 0 ? `−${diffStr} vs yesterday` : 'Same as yesterday';

    // Moon phase
    const moon = getMoonPhase(new Date());

    // Populate sidebar
    set$('sb-temp',   `${Math.round(c.temperature_2m)}°C`);
    set$('sb-desc',   weatherDesc(c.weather_code));
    set$('sb-loc',    loc);
    set$('sb-feels',  `${Math.round(c.apparent_temperature)}°C`);
    set$('sb-wind',   `${Math.round(c.wind_speed_10m)} km/h`);
    set$('sb-rise',   fmt(rise));
    set$('sb-set',    fmt(set));
    set$('sb-daylen', `${lenH}h ${lenM}m · ${diffLabel}`);
    set$('sb-moon',   moon.name);

  } catch(e) {
    set$('sb-desc', 'Weather unavailable');
  }
}

function set$(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function getMoonPhase(date) {
  const known = new Date(2000, 0, 6, 18, 14);
  const phase = ((date - known) / (86400000 * 29.53058867) % 1 + 1) % 1;
  const p = Math.round(phase * 100);
  const phases = [
    {max:2,  name:'New moon'},       {max:25, name:'Waxing crescent'},
    {max:27, name:'First quarter'},  {max:50, name:'Waxing gibbous'},
    {max:52, name:'Full moon'},      {max:75, name:'Waning gibbous'},
    {max:77, name:'Last quarter'},   {max:98, name:'Waning crescent'},
    {max:100,name:'New moon'},
  ];
  return phases.find(x => p <= x.max) || phases[phases.length - 1];
}
