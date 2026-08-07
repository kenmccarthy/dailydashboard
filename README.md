# Daily Dashboard

A personal start-of-day dashboard built as a static web app. Designed to work as a standalone PWA, a browser tab, or an iframe widget inside [Glance](https://github.com/glanceapp/glance).

## Features

- Live clock, date, day number, week number, days remaining
- Up to 3 additional time zones shown under the main clock
- Special dates & countdowns — birthdays, anniversaries (repeat yearly) and
  one-off countdowns, shown in the sidebar sorted by how soon they are
- Year progress bar
- Irish bank holidays countdown
- Daily quote (365 curated)
- Strange fact of the day (365 curated)
- Music fact of the day (365 curated)
- 80s song of the day with YouTube link (365 curated)
- Word of the Day via Wordnik API
- Irish word of the day with pronunciation (365 curated)
- Weather, sunrise/sunset, day length, UV index (Open-Meteo — no key needed)
- 5-day weather forecast strip (icon + high per day)
- Moon phase and day length comparison vs yesterday
- Air quality & pollen in the weather sidebar — European AQI, PM2.5/PM10, ozone
  (Open-Meteo — no key)
- Nearest flight overhead — airline, aircraft, altitude/speed, origin→destination
  airports and airline logo (airplanes.live for position; adsbdb + hexdb.io
  cross-checked for the route — no key)
- Formula 1 — next Grand Prix countdown + drivers' championship top 3
  (Jolpica/Ergast — no key)
- Tides — next high/low tides for a coastal location (WorldTides — free API key)
- UK Number 1 single this week 10/20/30/40/50 years ago (bundled offline dataset)
- Today's observances — Roman Catholic feast days + UN International Days
- NASA Astronomy Picture of the Day (free API key required)
- Joke of the day
- RTÉ News headlines
- On this day in history (Wikipedia)
- Drag-to-reorder cards
- Per-card show/hide toggles in Settings
- Backup & restore — export all settings to a file and import on another device

## Project structure

```
daily-dashboard/
  index.html          ← HTML structure only
  css/
    style.css         ← all styles
  js/
    app.js            ← main orchestrator (ES module)
    cards.js          ← data rendering and API loaders
    weather.js        ← Open-Meteo weather, forecast strip, UV
    airquality.js     ← Open-Meteo air quality & pollen
    flight.js         ← nearest flight overhead (airplanes.live + adsbdb + hexdb.io)
    f1.js             ← Formula 1 next race + standings (Jolpica/Ergast)
    tides.js          ← next high/low tides (WorldTides — needs a key)
    uk1s.js           ← UK #1 singles "this week through the years"
    special.js        ← user special dates & countdowns (sidebar)
    setup.js          ← setup flow, settings, card ordering, backup/restore
  data/
    quotes.json
    facts.json
    music_facts.json
    songs_80s.json
    irish_words.json
    saints.json
    un_days.json
    airlines.json         ← ICAO airline-code → name (flight card)
    uk_number_ones.json   ← UK chart #1s 1969–present (UK #1s card)
  README.md
```

## Deployment to GitHub Pages

1. Create a new repository on GitHub (e.g. `daily-dashboard`)
2. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/daily-dashboard.git
   ```
3. Copy all files from this folder into the cloned repo
4. Push to GitHub:
   ```bash
   cd daily-dashboard
   git add .
   git commit -m "Initial dashboard"
   git push
   ```
5. In your GitHub repo, go to **Settings → Pages**
6. Under **Source**, select **Deploy from a branch** → **main** → **/ (root)**
7. Click Save. Your dashboard will be live at:
   ```
   https://YOUR_USERNAME.github.io/daily-dashboard/
   ```

Changes to any file (data, CSS, JS, HTML) take effect within ~60 seconds of pushing.

## Glance integration

In your Glance `config.yaml`:

```yaml
- type: iframe
  url: https://YOUR_USERNAME.github.io/daily-dashboard/
  height: 900
```

## API keys (all optional)

| Feature | Provider | Where to get |
|---------|----------|--------------|
| Word of the Day | Wordnik | [developer.wordnik.com](https://developer.wordnik.com) |
| NASA Picture of the Day | NASA | [api.nasa.gov](https://api.nasa.gov) |
| Tides | WorldTides | [worldtides.info](https://www.worldtides.info) |

All three are free with instant signup (WorldTides is credit-based; the tides
card caches results so it uses very few credits). Enter them via the ⚙ Settings
button in the dashboard.

All other cards need **no key**: weather, forecast, UV and air quality use
[Open-Meteo](https://open-meteo.com); the flight card uses the keyless
[airplanes.live](https://airplanes.live) feed for aircraft positions and
cross-checks the route against both [adsbdb](https://www.adsbdb.com) and
[hexdb.io](https://hexdb.io), picking whichever origin→destination actually fits
the aircraft's current position; Formula 1 uses the keyless
[Jolpica/Ergast](https://jolpi.ca) API. The UK
#1s card is fully offline — `data/uk_number_ones.json` is a bundled snapshot
parsed from Wikipedia's "List of UK singles chart number ones" (Official Charts
Company data).

## Local development

Because the JS uses ES modules and `fetch()` for data files, you need a local web server — you can't open `index.html` directly from the filesystem.

Simple options:

```bash
# Python (built-in)
python3 -m http.server 8000
# Then open http://localhost:8000

# Node (if installed)
npx serve .
```

## Updating data

The JSON files in `data/` are plain arrays. To update:
- Edit the relevant `.json` file
- Commit and push to GitHub
- Changes go live within ~60 seconds

## Backup, restore & resetting settings

All settings live in your browser under `dd_`-prefixed local-storage keys. To move
your dashboard to another device, open ⚙ Settings → **Backup & restore** →
**Export settings** to download a `daily-dashboard-settings.json` file, then
**Import settings** on the other device.

To reset, open browser DevTools → Application → Local Storage → clear any `dd_` keys.
