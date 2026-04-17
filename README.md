# Daily Dashboard

A personal start-of-day dashboard built as a static web app. Designed to work as a standalone PWA, a browser tab, or an iframe widget inside [Glance](https://github.com/glanceapp/glance).

## Features

- Live clock, date, day number, week number, days remaining
- Year progress bar
- Irish bank holidays countdown
- Daily quote (365 curated)
- Strange fact of the day (365 curated)
- Music fact of the day (365 curated)
- 80s song of the day with YouTube link (365 curated)
- Word of the Day via Wordnik API
- Irish word of the day with pronunciation (365 curated)
- Weather, sunrise/sunset, day length (Open-Meteo — no key needed)
- Moon phase and day length comparison vs yesterday
- Today's observances — Roman Catholic feast days + UN International Days
- NASA Astronomy Picture of the Day (free API key required)
- Joke of the day
- RTÉ News headlines
- On this day in history (Wikipedia)
- Drag-to-reorder cards
- Per-card show/hide toggles in Settings

## Project structure

```
daily-dashboard/
  index.html          ← HTML structure only
  css/
    style.css         ← all styles
  js/
    app.js            ← main orchestrator (ES module)
    cards.js          ← data rendering and API loaders
    weather.js        ← Open-Meteo weather
    setup.js          ← setup flow, settings, card ordering
  data/
    quotes.json
    facts.json
    music_facts.json
    songs_80s.json
    irish_words.json
    saints.json
    un_days.json
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

Both are free with instant signup. Enter them via the ⚙ Settings button in the dashboard.

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

## Resetting settings

Open browser DevTools → Application → Local Storage → clear any `dd_` keys.
