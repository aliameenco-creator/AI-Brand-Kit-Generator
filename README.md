# AI Brand Kit Generator

Generate a complete business branding kit (business card, letterhead, tri-fold brochure, invoice) from a single website URL.

The app scrapes the site with **Firecrawl**, structures the brand identity with **Google Gemini 2.5 Pro**, then renders professional editable SVG assets with multiple style variants per asset.

## Stack

- Vanilla HTML / CSS / JavaScript (no framework)
- Firecrawl API for web scraping
- Google Gemini 2.5 Pro for brand profile + style recommendation
- SVG rendered in-browser, exportable as PNG / JPG

## Setup

1. Clone the repo.
2. Copy `config.example.js` to `config.js`.
3. Open `config.js` and paste your real API keys:
   - Firecrawl: https://firecrawl.dev
   - Gemini: https://aistudio.google.com/apikey
4. Open `index.html` in a browser, or serve the folder with any static server (e.g. `python -m http.server`).

`config.js` is gitignored so your keys never get committed.

## Features

- **Multi-variant templates** — 3 business-card styles, 2 each for letterhead / brochure / invoice
- **AI-recommended defaults** — Gemini picks the best style per asset based on the brand's industry
- **Live style swap** — switch designs after generation without losing edits
- **Inline text editing** — click any text on an asset to edit it
- **Scraped imagery** — logo + hero photos pulled from the site and embedded into templates
- **High-res export** — PNG / JPG export at 3× scale for print quality

## File structure

```
index.html              Main entry
config.js               API keys (gitignored)
config.example.js       Template for config.js
css/styles.css
js/
  app.js                Main controller
  scraper.js            Firecrawl integration
  brand-extractor.js    First-pass HTML parsing
  ai-processor.js       Gemini prompt + profile
  image-loader.js       Image URL → data URI
  editor.js             Inline text editor
  exporter.js           SVG → PNG/JPG
templates/
  business-card.js
  letterhead.js
  brochure.js
  invoice.js
```
