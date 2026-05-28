# AI Brand Kit Generator — Complete Build Specification

## Overview

A standalone web application that generates a complete business branding kit from a single website URL. The system scrapes a website using Firecrawl, extracts branding elements, uses Gemini to structure and refine the data, then generates professional SVG-based assets that users can edit and export.

**Stack:** HTML / CSS / JavaScript (no frameworks)
**APIs:** Firecrawl (web scraping), Google Gemini (AI processing)
**Output Format:** SVG rendered in-browser, exportable as PNG/JPG
**API Keys:** Stored as environment variables or hardcoded constants in a config file (not exposed in UI)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                         │
│                                                          │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │  URL Input    │  │  Asset     │  │  Preview &      │  │
│  │  + Generate   │  │  Selector  │  │  Edit Panel     │  │
│  │  Button       │  │  (toggles) │  │  (per asset)    │  │
│  └──────┬───────┘  └─────┬──────┘  └────────┬────────┘  │
│         │                │                    │           │
│         ▼                ▼                    ▼           │
│  ┌──────────────────────────────────────────────────┐    │
│  │              CORE ENGINE                          │    │
│  │                                                    │    │
│  │  1. Firecrawl API → scrape website                │    │
│  │  2. Gemini API → structure brand data             │    │
│  │  3. SVG Generator → render assets                 │    │
│  │  4. Edit Engine → inline text editing             │    │
│  │  5. Export Engine → PNG/JPG download              │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
ai-brand-kit-generator/
├── index.html              # Main entry point
├── config.js               # API keys and constants
├── css/
│   └── styles.css          # All styles (clean, minimal, light UI)
├── js/
│   ├── app.js              # Main app controller, UI state management
│   ├── scraper.js          # Firecrawl API integration
│   ├── ai-processor.js     # Gemini API integration
│   ├── brand-extractor.js  # Parses Firecrawl output into raw brand data
│   ├── svg-generator.js    # Generates all 4 SVG assets
│   ├── editor.js           # Inline text editing on SVG elements
│   └── exporter.js         # SVG → PNG/JPG export
├── templates/
│   ├── business-card.js    # SVG template: business card (front + back)
│   ├── letterhead.js       # SVG template: letterhead
│   ├── brochure.js         # SVG template: tri-fold brochure
│   └── invoice.js          # SVG template: invoice
└── assets/
    └── icons/              # Any UI icons needed
```

---

## Configuration — `config.js`

```javascript
const CONFIG = {
  FIRECRAWL_API_KEY: "YOUR_FIRECRAWL_API_KEY",
  FIRECRAWL_BASE_URL: "https://api.firecrawl.dev/v1",
  GEMINI_API_KEY: "YOUR_GEMINI_API_KEY",
  GEMINI_MODEL: "gemini-2.0-flash",
  GEMINI_BASE_URL: "https://generativelanguage.googleapis.com/v1beta/models"
};
```

---

## Phase 1: Website Scraping — `scraper.js`

### Purpose
Takes a URL, calls the Firecrawl API, and returns raw website data (HTML content, metadata, visible text).

### Firecrawl API Call

```javascript
async function scrapeWebsite(url) {
  const response = await fetch(`${CONFIG.FIRECRAWL_BASE_URL}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      url: url,
      formats: ["markdown", "html"],
      onlyMainContent: false,
      includeTags: ["meta", "link", "header", "footer", "nav", "h1", "h2", "p", "img", "a"],
      waitFor: 3000
    })
  });

  const data = await response.json();
  return data;
}
```

### What We Extract from the Scrape
The raw Firecrawl response contains HTML and markdown. We pass ALL of it to `brand-extractor.js` which does a first pass at pulling out:

- **Business name** — from `<title>`, `og:site_name`, or the largest `<h1>`
- **Tagline / description** — from `meta description`, `og:description`, or first prominent `<p>`
- **Logo URL** — from `link[rel="icon"]`, `og:image`, or header `<img>` elements
- **Colors** — from inline styles, CSS custom properties if visible, or dominant colors mentioned
- **Contact info** — phone, email, address scraped from footer or contact sections
- **Social links** — any social media URLs found
- **Services / offerings** — key headings and bullet points about what the business does
- **General content** — paragraphs describing the business (for brochure content)

### `brand-extractor.js` Output Format

```javascript
// This is the RAW extracted data — messy, incomplete, best-effort
{
  rawName: "Acme Corp | Home",
  rawTagline: "We build solutions that matter",
  rawLogoUrl: "https://example.com/logo.png",
  rawColors: ["#2563eb", "#1e40af", "#ffffff", "#f8fafc"],
  rawContact: {
    phone: "+1 (555) 123-4567",
    email: "hello@acmecorp.com",
    address: "123 Business St, Suite 400, New York, NY 10001"
  },
  rawSocials: {
    twitter: "https://twitter.com/acmecorp",
    linkedin: "https://linkedin.com/company/acmecorp"
  },
  rawServices: ["Web Development", "Mobile Apps", "Cloud Solutions"],
  rawContent: "Full markdown content of the page...",
  sourceUrl: "https://acmecorp.com"
}
```

---

## Phase 2: AI Processing — `ai-processor.js`

### Purpose
Takes the raw extracted data and sends it to Gemini with a carefully crafted prompt. Gemini cleans, structures, and enriches the data into a complete brand profile ready for SVG generation.

### Gemini API Call

```javascript
async function processBrandData(rawData) {
  const prompt = buildBrandPrompt(rawData);

  const response = await fetch(
    `${CONFIG.GEMINI_BASE_URL}/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json();
  const brandProfile = JSON.parse(data.candidates[0].content.parts[0].text);
  return brandProfile;
}
```

### The Gemini Prompt — `buildBrandPrompt()`

This is the most critical prompt in the system. It must produce a clean, structured JSON output every single time.

```javascript
function buildBrandPrompt(rawData) {
  return `
You are a professional brand strategist and designer. I've scraped a business website and extracted raw data. Your job is to analyze this data and produce a clean, structured brand profile that will be used to generate professional business assets (business card, letterhead, brochure, invoice).

## RAW EXTRACTED DATA:

Business Name (raw): ${rawData.rawName}
Tagline (raw): ${rawData.rawTagline}
Logo URL: ${rawData.rawLogoUrl || "Not found"}
Colors found: ${JSON.stringify(rawData.rawColors)}
Contact info: ${JSON.stringify(rawData.rawContact)}
Social links: ${JSON.stringify(rawData.rawSocials)}
Services: ${JSON.stringify(rawData.rawServices)}
Website URL: ${rawData.sourceUrl}

Page content:
${rawData.rawContent.substring(0, 4000)}

## YOUR TASK:

Analyze the above data and return a SINGLE JSON object with the following structure. Clean up any messy data, infer missing pieces where reasonable, and make everything presentation-ready.

{
  "businessName": "Clean business name (remove '| Home', '- Welcome', etc.)",
  "tagline": "The business tagline or a short one-liner from their description (max 10 words)",
  "industry": "The business industry/category (e.g., Technology, Healthcare, Restaurant, etc.)",

  "colors": {
    "primary": "#hex — the main brand color (extracted from site or inferred)",
    "secondary": "#hex — a complementary color",
    "accent": "#hex — an accent/highlight color",
    "dark": "#hex — dark color for text/backgrounds (near black)",
    "light": "#hex — light color for backgrounds (near white)",
    "textOnPrimary": "#hex — text color that is readable on the primary color",
    "textOnLight": "#hex — text color readable on light backgrounds",
    "textOnDark": "#hex — text color readable on dark backgrounds"
  },

  "contact": {
    "phone": "Formatted phone number or empty string",
    "email": "Primary email or empty string",
    "address": "Full formatted address or empty string",
    "website": "Clean URL without protocol (e.g., acmecorp.com)"
  },

  "socials": {
    "twitter": "handle or empty string",
    "linkedin": "URL or empty string",
    "instagram": "handle or empty string",
    "facebook": "URL or empty string"
  },

  "people": {
    "ownerName": "Business owner or CEO name if found, otherwise generate a realistic placeholder like 'John Smith'",
    "ownerTitle": "Their title if found, otherwise 'Founder & CEO'",
    "ownerEmail": "Their email if found, otherwise 'name@domain.com'",
    "ownerPhone": "Their direct phone if found, otherwise use main phone"
  },

  "services": ["Service 1", "Service 2", "Service 3", "Service 4", "Service 5", "Service 6"],

  "brochure": {
    "headline": "A compelling 3-6 word headline for the brochure cover",
    "subheadline": "A 10-15 word supporting line",
    "aboutTitle": "About Us",
    "aboutText": "A 40-60 word paragraph about the business based on scraped content. Write it as polished marketing copy.",
    "servicesTitle": "Our Services",
    "serviceDescriptions": [
      { "name": "Service 1", "description": "15-25 word description" },
      { "name": "Service 2", "description": "15-25 word description" },
      { "name": "Service 3", "description": "15-25 word description" },
      { "name": "Service 4", "description": "15-25 word description" },
      { "name": "Service 5", "description": "15-25 word description" },
      { "name": "Service 6", "description": "15-25 word description" }
    ],
    "whyUsTitle": "Why Choose Us",
    "whyUsPoints": [
      "Reason 1 — short benefit statement (8-12 words)",
      "Reason 2 — short benefit statement (8-12 words)",
      "Reason 3 — short benefit statement (8-12 words)",
      "Reason 4 — short benefit statement (8-12 words)"
    ],
    "ctaText": "A call-to-action line (e.g., 'Get in touch today for a free consultation')"
  },

  "invoice": {
    "prefix": "INV",
    "taxRate": 0,
    "currency": "Appropriate currency symbol based on the business location ($, £, €, etc.)",
    "paymentTerms": "Net 30",
    "bankDetails": "Bank: National Bank | Account: XXXX-XXXX-XXXX | Routing: XXXXXXXXX",
    "notes": "Thank you for your business."
  }
}

IMPORTANT RULES:
- Return ONLY the JSON object. No markdown, no backticks, no explanation.
- All colors must be valid 6-digit hex codes.
- If data is missing, generate realistic placeholder content that matches the business type.
- All text must be professional, polished, and ready to print.
- The brochure content should sound like real marketing copy, not generic filler.
- Services should be specific to the industry, not generic.
`;
}
```

### Gemini Output — The Brand Profile

The JSON returned by Gemini becomes the single source of truth for ALL SVG generation. Every template reads from this object.

```javascript
// Store globally after processing
window.brandProfile = { /* the full JSON from Gemini */ };
```

---

## Phase 3: SVG Asset Templates

Each template is a JavaScript function that takes the `brandProfile` object and returns an SVG string. All text elements must have `data-editable="true"` and a unique `data-field="fieldName"` attribute so the editor can identify them.

### Standard Dimensions (in mm, converted to SVG viewBox)

| Asset | Physical Size | SVG viewBox |
|-------|--------------|-------------|
| Business Card (front) | 89 × 51 mm (3.5 × 2 in) | `0 0 890 510` |
| Business Card (back) | 89 × 51 mm | `0 0 890 510` |
| Letterhead | 210 × 297 mm (A4) | `0 0 2100 2970` |
| Brochure (tri-fold, flat) | 297 × 210 mm (A4 landscape) | `0 0 2970 2100` |
| Invoice | 210 × 297 mm (A4) | `0 0 2100 2970` |

> NOTE: viewBox units are mm × 10 for precision. This gives us clean numbers to work with.

---

### Template 1: Business Card — `templates/business-card.js`

#### Front Layout

```
┌─────────────────────────────────────────┐
│                                         │
│   LOGO AREA (top-left)                  │
│   Business Name                         │
│   Tagline                               │
│                                         │
│                                         │
│   Owner Name                            │
│   Owner Title                           │
│                                         │
│   ✉ email@domain.com                    │
│   ✆ +1 (555) 123-4567                  │
│   🌐 acmecorp.com                       │
│                                         │
│ ─── accent color strip (bottom) ─────── │
└─────────────────────────────────────────┘
```

#### Back Layout

```
┌─────────────────────────────────────────┐
│                                         │
│          (primary color background)     │
│                                         │
│                                         │
│            BUSINESS NAME                │
│            (large, centered)            │
│                                         │
│            tagline                      │
│                                         │
│            www.acmecorp.com             │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

#### SVG Structure Requirements
- Front: white background, primary color accent strip at bottom (height ~40 units)
- Back: primary color background, white/light text centered
- Font sizes: business name 28px, owner name 22px, contact details 14px, tagline 12px italic
- All text elements get `data-editable="true"` and `data-field` attributes
- Contact icons rendered as simple SVG paths (envelope, phone, globe) — no external icon dependencies
- Editable fields: `businessName`, `tagline`, `ownerName`, `ownerTitle`, `email`, `phone`, `website`

#### Function Signature

```javascript
function generateBusinessCard(brandProfile) {
  return {
    front: `<svg viewBox="0 0 890 510" xmlns="http://www.w3.org/2000/svg">...</svg>`,
    back: `<svg viewBox="0 0 890 510" xmlns="http://www.w3.org/2000/svg">...</svg>`
  };
}
```

---

### Template 2: Letterhead — `templates/letterhead.js`

#### Layout

```
┌──────────────────────────────────────────────┐
│  ┌──────┐                                    │
│  │ LOGO │  Business Name      Contact Info   │
│  └──────┘  Tagline            (right-aligned)│
│ ─── primary color line ───────────────────── │
│                                              │
│                                              │
│  (large empty content area — this is where   │
│   the letter body would go. Leave blank.)    │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│ ─── thin accent line ────────────────────── │
│  Address | Phone | Email | Website           │
│  (centered footer, small text)               │
└──────────────────────────────────────────────┘
```

#### SVG Structure Requirements
- A4 portrait (210 × 297 mm)
- Header section: ~250 units tall
  - Left: logo placeholder (rectangle with brand initial if no logo), business name, tagline
  - Right: phone, email, website (right-aligned, small text)
  - Below: horizontal rule in primary color (2px)
- Content area: completely empty (white space for letter body)
- Footer section: ~150 units from bottom
  - Thin accent color line
  - Full address, phone, email, website in one centered line, separated by ` | `
  - Small font (10-11px equivalent)
- Editable fields: `businessName`, `tagline`, `phone`, `email`, `website`, `address`, footer text

#### Function Signature

```javascript
function generateLetterhead(brandProfile) {
  return `<svg viewBox="0 0 2100 2970" xmlns="http://www.w3.org/2000/svg">...</svg>`;
}
```

---

### Template 3: Tri-fold Brochure — `templates/brochure.js`

#### Layout (Flat A4 Landscape — Outside/Front when folded)

The brochure is displayed as a single flat SVG with fold guides. It has an OUTSIDE face and an INSIDE face (2 separate SVGs).

**Outside (3 panels, left to right):**

```
┌────────────────┬────────────────┬────────────────┐
│                │                │                │
│  PANEL 3       │  PANEL 4       │  PANEL 1       │
│  (Back panel)  │  (Back-flap)   │  (COVER)       │
│                │                │                │
│  Contact Info  │  Quick service │  BUSINESS NAME │
│  Address       │  list or       │  Tagline       │
│  Social media  │  "Why Us"      │  Headline      │
│  QR code area  │  summary       │                │
│                │                │                │
│  Website URL   │  CTA line      │  website URL   │
│                │                │                │
└────────────────┴────────────────┴────────────────┘
  990 units wide   990 units wide   990 units wide
```

**Inside (3 panels, left to right):**

```
┌────────────────┬────────────────┬────────────────┐
│                │                │                │
│  PANEL 5       │  PANEL 6       │  PANEL 2       │
│  (Inside-left) │  (Inside-      │  (Inside-right)│
│                │   center)      │                │
│  About Us      │  Services      │  Services      │
│  section       │  (first 3)     │  (next 3)      │
│                │                │  OR "Why Us"   │
│  aboutText     │  Name +        │                │
│  paragraph     │  Description   │  CTA text      │
│                │  for each      │  Contact info  │
│                │                │                │
└────────────────┴────────────────┴────────────────┘
  990 units wide   990 units wide   990 units wide
```

#### SVG Structure Requirements
- Full flat size: 2970 × 2100 (A4 landscape)
- 3 equal panels of 990 × 2100 each
- Dashed fold lines between panels (light gray, stroke-dasharray)
- Cover panel (Panel 1): primary color background, large white business name, tagline, headline
- Back panel (Panel 3): light background, contact details, address, social icons, website
- Inside panels: white/light background, structured content sections
- Section titles in primary color, body text in dark color
- Subtle accent color used for dividers, bullets, or highlights
- Each service listed with name (bold) + description (regular)
- Editable fields: all text content — headline, subheadline, aboutText, service names, service descriptions, contact info, CTA text, whyUs points

#### Function Signature

```javascript
function generateBrochure(brandProfile) {
  return {
    outside: `<svg viewBox="0 0 2970 2100" xmlns="http://www.w3.org/2000/svg">...</svg>`,
    inside: `<svg viewBox="0 0 2970 2100" xmlns="http://www.w3.org/2000/svg">...</svg>`
  };
}
```

---

### Template 4: Invoice — `templates/invoice.js`

#### Layout

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌──────┐                        INVOICE     │
│  │ LOGO │  Business Name                     │
│  └──────┘  Address               #INV-001    │
│            Phone | Email         Date: ...   │
│            Website               Due: ...    │
│                                              │
│ ─── primary color line ───────────────────── │
│                                              │
│  Bill To:                                    │
│  Client Name                                 │
│  Client Address                              │
│  Client Email                                │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ # │ Description      │ Qty │ Rate │ Amt  │ │
│ ├──────────────────────────────────────────┤ │
│ │ 1 │ Service Name     │  1  │ $500 │ $500 │ │
│ │ 2 │ Service Name     │  2  │ $250 │ $500 │ │
│ │ 3 │ Service Name     │  1  │ $300 │ $300 │ │
│ ├──────────────────────────────────────────┤ │
│ │                      Subtotal:    $1,300 │ │
│ │                      Tax (0%):       $0  │ │
│ │                      ────────────────── │ │
│ │                      TOTAL:       $1,300 │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│  Payment Terms: Net 30                       │
│  Bank Details: ...                           │
│                                              │
│  Notes: Thank you for your business.         │
│                                              │
│ ─── accent line ─────────────────────────── │
│  Business Name | Phone | Email | Website     │
└──────────────────────────────────────────────┘
```

#### SVG Structure Requirements
- A4 portrait (2100 × 2970)
- Header: logo placeholder (left), "INVOICE" title (right, large, primary color)
- Invoice meta: invoice number, date, due date (right-aligned below title)
- Bill To section: placeholder client info (editable)
- Items table: clean table with alternating row shading (very subtle)
  - Header row: primary color background, white text
  - 3 placeholder line items with realistic sample data matching the business type
  - Amounts right-aligned
- Totals section: subtotal, tax, total (total in bold, larger, primary color)
- Payment section: terms, bank details
- Notes section: thank you message
- Footer: same style as letterhead footer
- Editable fields: invoice number, dates, all client info, item descriptions, quantities, rates, payment terms, bank details, notes

#### Function Signature

```javascript
function generateInvoice(brandProfile) {
  return `<svg viewBox="0 0 2100 2970" xmlns="http://www.w3.org/2000/svg">...</svg>`;
}
```

---

## Phase 4: Inline Text Editor — `editor.js`

### How It Works

1. After SVG assets are generated and rendered into the DOM, the editor scans for all elements with `data-editable="true"`
2. When a user clicks an editable text element:
   - The text element gets a visible highlight/border (2px dashed accent color)
   - An input field (or textarea for longer text) appears overlaid directly on top of the SVG text, matching its position and approximate size
   - The input is pre-filled with the current text content
   - User edits the text
   - On blur or Enter key, the SVG text element updates with the new value
   - The highlight/border disappears

### Implementation Details

```javascript
class InlineEditor {
  constructor(svgContainer) {
    this.container = svgContainer;
    this.activeInput = null;
    this.init();
  }

  init() {
    // Find all editable elements in the SVG
    const editables = this.container.querySelectorAll('[data-editable="true"]');
    editables.forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => this.startEditing(e, el));
    });
  }

  startEditing(event, svgTextElement) {
    // Prevent multiple editors open at once
    if (this.activeInput) this.stopEditing();

    // Get position of the SVG text element relative to the container
    const rect = svgTextElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    // Create an input/textarea overlay
    const isLongText = svgTextElement.textContent.length > 50;
    const input = document.createElement(isLongText ? 'textarea' : 'input');

    input.value = svgTextElement.textContent;
    input.className = 'svg-text-editor';

    // Position it over the SVG text
    input.style.position = 'absolute';
    input.style.left = `${rect.left - containerRect.left}px`;
    input.style.top = `${rect.top - containerRect.top}px`;
    input.style.width = `${Math.max(rect.width + 40, 150)}px`;
    input.style.fontSize = window.getComputedStyle(svgTextElement).fontSize || '14px';

    // Add highlight to SVG element
    svgTextElement.setAttribute('data-editing', 'true');

    // Append and focus
    this.container.style.position = 'relative';
    this.container.appendChild(input);
    input.focus();
    input.select();

    // Save references
    this.activeInput = input;
    this.activeElement = svgTextElement;

    // Close on blur or Enter
    input.addEventListener('blur', () => this.stopEditing());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.stopEditing();
      }
    });
  }

  stopEditing() {
    if (!this.activeInput || !this.activeElement) return;

    // Update SVG text
    this.activeElement.textContent = this.activeInput.value;
    this.activeElement.removeAttribute('data-editing');

    // Remove input overlay
    this.activeInput.remove();
    this.activeInput = null;
    this.activeElement = null;
  }
}
```

### CSS for Editor

```css
.svg-text-editor {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 2px solid var(--primary-color, #2563eb);
  border-radius: 4px;
  padding: 4px 8px;
  font-family: inherit;
  outline: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

[data-editing="true"] {
  opacity: 0.3;
}
```

---

## Phase 5: Export Engine — `exporter.js`

### SVG → PNG/JPG Export

Uses the Canvas API to convert SVG to raster images.

```javascript
async function exportAsImage(svgElement, format = 'png', filename = 'asset') {
  // 1. Serialize the SVG
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  // 2. Create a blob URL
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // 3. Draw onto a canvas at high resolution
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      // Export at 3x for print quality (300 DPI equivalent)
      const scale = 3;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      ctx.scale(scale, scale);

      // White background for JPG (transparent for PNG)
      if (format === 'jpg' || format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      // 4. Trigger download
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'png' ? undefined : 0.95;

      canvas.toBlob((blob) => {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${filename}.${format}`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
        URL.revokeObjectURL(url);
        resolve();
      }, mimeType, quality);
    };
    img.src = url;
  });
}
```

### Export Buttons
Each asset preview has two export buttons: "Export PNG" and "Export JPG". The filename includes the business name and asset type (e.g., `acmecorp-business-card-front.png`).

---

## Phase 6: User Interface — `index.html` + `styles.css`

### UI Design: Clean, Minimal, Light

The UI should feel professional and tool-like — not flashy. Think Notion or Linear's simplicity.

### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 🎨 Brand Kit Generator             (minimal branding)  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  URL INPUT SECTION                                            │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Enter website URL:                                     │   │
│  │  ┌──────────────────────────────┐  ┌──────────────┐    │   │
│  │  │ https://example.com          │  │  Generate ▶   │    │   │
│  │  └──────────────────────────────┘  └──────────────┘    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ASSET SELECTOR                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Select assets to generate:                             │   │
│  │  ☑ Business Card  ☑ Letterhead  ☑ Brochure  ☑ Invoice  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  LOADING STATE (shown during API calls)                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Step 1/3: Scraping website...              ████░░░░░  │   │
│  │  Step 2/3: Analyzing brand...               ░░░░░░░░░  │   │
│  │  Step 3/3: Generating assets...             ░░░░░░░░░  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  BRAND SUMMARY (shown after processing, collapsible)          │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  ▼ Brand Profile                                        │   │
│  │  Name: Acme Corp    Industry: Technology                │   │
│  │  Colors: ● ● ● ● ●   Tagline: "We build solutions"    │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ASSET PREVIEWS (tab-based navigation)                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ [Business Card] [Letterhead] [Brochure] [Invoice]       │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │                                                  │   │   │
│  │  │         (SVG Preview - scaled to fit)             │   │   │
│  │  │         Click any text to edit                    │   │   │
│  │  │                                                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  For Business Card: [Front] [Back] toggle               │   │
│  │  For Brochure: [Outside] [Inside] toggle                │   │
│  │                                                         │   │
│  │  ┌──────────────┐  ┌──────────────┐                     │   │
│  │  │ Export PNG ↓  │  │ Export JPG ↓  │                    │   │
│  │  └──────────────┘  └──────────────┘                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Color Palette for the App UI

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f1f3f5;
  --text-primary: #1a1a2e;
  --text-secondary: #6c757d;
  --text-tertiary: #adb5bd;
  --border: #e0e0e0;
  --border-focus: #2563eb;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-light: #eff6ff;
  --success: #22c55e;
  --error: #ef4444;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --radius: 8px;
}
```

### Typography for the App UI
- Headings: `"DM Sans", system-ui, sans-serif` — clean and modern
- Body text: `"DM Sans", system-ui, sans-serif` — same family for consistency
- Monospace (if needed): `"JetBrains Mono", monospace`
- Load from Google Fonts: `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">`

### Key UI Behaviors

1. **Initial state:** Only the URL input and asset selector are visible
2. **On Generate click:**
   - Validate URL format
   - Show loading progress with 3 steps (Scraping → Analyzing → Generating)
   - Each step shows a progress indicator and status text
   - On error at any step, show clear error message with retry option
3. **After generation:**
   - Brand summary appears (collapsible)
   - Asset tabs appear showing only the selected assets
   - First selected asset is auto-displayed
   - "Click any text to edit" hint shown briefly
4. **Tab navigation:** Clicking a tab shows that asset's preview. Business Card and Brochure have sub-toggles (front/back, outside/inside)
5. **Export:** Each asset has PNG and JPG buttons below the preview
6. **Regenerate:** User can modify the URL and hit Generate again — clears previous results

### Responsive Behavior
- Desktop: full layout as shown
- Tablet: same layout, slightly reduced preview size
- Mobile: stacked layout, full-width preview, horizontal scroll on tabs if needed

---

## Phase 7: Main Application Controller — `app.js`

### Flow

```javascript
// Main generation flow
async function generateBrandKit() {
  const url = document.getElementById('url-input').value;
  const selectedAssets = getSelectedAssets(); // returns array: ['business-card', 'letterhead', etc.]

  if (!validateUrl(url)) {
    showError("Please enter a valid website URL");
    return;
  }

  if (selectedAssets.length === 0) {
    showError("Please select at least one asset to generate");
    return;
  }

  try {
    // Step 1: Scrape
    updateProgress(1, "Scraping website...");
    const rawHtml = await scrapeWebsite(url);

    // Step 2: Extract + AI Process
    updateProgress(2, "Analyzing brand identity...");
    const rawBrandData = extractBrandData(rawHtml);
    const brandProfile = await processBrandData(rawBrandData);

    // Store globally
    window.brandProfile = brandProfile;

    // Show brand summary
    renderBrandSummary(brandProfile);

    // Step 3: Generate selected assets
    updateProgress(3, "Generating brand assets...");
    const assets = {};

    if (selectedAssets.includes('business-card')) {
      assets.businessCard = generateBusinessCard(brandProfile);
    }
    if (selectedAssets.includes('letterhead')) {
      assets.letterhead = generateLetterhead(brandProfile);
    }
    if (selectedAssets.includes('brochure')) {
      assets.brochure = generateBrochure(brandProfile);
    }
    if (selectedAssets.includes('invoice')) {
      assets.invoice = generateInvoice(brandProfile);
    }

    // Render previews
    renderAssetPreviews(assets, selectedAssets);

    // Initialize editors on all rendered SVGs
    initializeEditors();

    // Hide progress, show results
    hideProgress();
    showResults();

  } catch (error) {
    showError(`Something went wrong: ${error.message}. Please try again.`);
  }
}
```

---

## SVG Design Guidelines (for all templates)

### Fonts Inside SVGs
Since SVGs render in the browser, we can use Google Fonts. Each SVG template should include a `<style>` block at the top:

```xml
<svg viewBox="0 0 890 510" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;display=swap');
      text { font-family: 'DM Sans', sans-serif; }
    </style>
  </defs>
  <!-- ... rest of SVG ... -->
</svg>
```

> NOTE: When exporting to PNG, the font must be loaded in the browser first. The exporter should ensure fonts are loaded before rendering to canvas. If Google Fonts fail to load inside SVG for export, fall back to embedding the font as a base64 `@font-face` or use system fonts.

### Color Application in SVGs
All colors come from `brandProfile.colors`. Templates should NEVER hardcode colors — always reference the profile:

```javascript
const { primary, secondary, accent, dark, light, textOnPrimary, textOnLight } = brandProfile.colors;
```

### Text Wrapping
SVG `<text>` does not auto-wrap. For longer text blocks (brochure paragraphs, about sections), the template must:
1. Split text into lines based on a max character width (~45-55 chars per line depending on font size)
2. Use multiple `<tspan>` elements with `dy` offsets

```javascript
function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ' ' + word;
    }
  });
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

// Usage in SVG template:
const lines = wrapText(brandProfile.brochure.aboutText, 50);
const tspans = lines.map((line, i) =>
  `<tspan x="60" dy="${i === 0 ? 0 : 22}" data-editable="true" data-field="aboutText-line-${i}">${line}</tspan>`
).join('');
```

### Logo Handling
The brandProfile may include a `rawLogoUrl`. Since we can't reliably embed external images in SVG for export, use this approach:
1. **Primary:** Render a styled text initial / monogram in a circle or rounded square as the logo placeholder
2. **Example:** A circle in the primary color with the first letter of the business name in white, bold, large font
3. This is consistent, always works, and looks professional

```xml
<!-- Logo placeholder: colored circle with initial -->
<circle cx="60" cy="60" r="45" fill="${primary}" />
<text x="60" y="60" text-anchor="middle" dominant-baseline="central"
      font-size="40" font-weight="700" fill="${textOnPrimary}">
  ${brandProfile.businessName.charAt(0)}
</text>
```

---

## Error Handling

### Firecrawl Errors
- **Rate limit:** Show "Too many requests. Please wait a moment and try again."
- **Invalid URL:** Show "Couldn't access this website. Please check the URL and try again."
- **Timeout:** Show "Website took too long to load. Please try again."

### Gemini Errors
- **Invalid JSON response:** Retry once. If still invalid, show "AI processing failed. Please try again."
- **Rate limit:** Show "AI service is busy. Please wait a moment."
- **Content filter:** Show "Could not process this website's content. Please try a different URL."

### General
- All errors should be shown in a dismissible banner at the top of the page
- Include a "Try Again" button that resets to the input state
- Console.log all raw error responses for debugging

---

## Build Order (Recommended for Step-by-Step Teaching)

This is the suggested order for building the app on camera, where each step produces a visible, testable result:

### Lesson 1: Project Setup + Config
- Create file structure
- Set up `index.html` with basic layout
- Add `styles.css` with the app UI
- Create `config.js` with API key placeholders
- **Result:** Static UI with URL input and asset checkboxes

### Lesson 2: Firecrawl Integration
- Build `scraper.js`
- Build `brand-extractor.js`
- Wire up the Generate button to scrape and log raw data to console
- **Result:** Paste a URL, see raw scraped data in console

### Lesson 3: Gemini Integration
- Build `ai-processor.js` with the brand prompt
- Wire it up after scraping
- Render the Brand Summary panel with extracted colors, name, tagline
- **Result:** Paste URL → see structured brand profile rendered on screen

### Lesson 4: Business Card Template
- Build `templates/business-card.js`
- Render front and back in the preview panel
- Add front/back toggle
- **Result:** Full business card generated from any website URL

### Lesson 5: Letterhead Template
- Build `templates/letterhead.js`
- Add to the tab navigation
- **Result:** Professional letterhead generated

### Lesson 6: Invoice Template
- Build `templates/invoice.js`
- Add to tab navigation
- **Result:** Complete invoice with sample line items

### Lesson 7: Brochure Template
- Build `templates/brochure.js` (the most complex template)
- Add outside/inside toggle
- **Result:** Full tri-fold brochure with real content

### Lesson 8: Inline Editor + Export
- Build `editor.js` — click-to-edit on all assets
- Build `exporter.js` — PNG and JPG export
- Add export buttons
- **Result:** Complete, functional Brand Kit Generator

---

## Testing Checklist

After building, test with these types of websites:
- [ ] A corporate/enterprise site (e.g., a consulting firm)
- [ ] A small local business (e.g., a restaurant or salon)
- [ ] A SaaS/tech company
- [ ] A single-page site with minimal content
- [ ] A non-English website (to test character handling)

For each test, verify:
- [ ] Brand colors are extracted and look correct
- [ ] Business name is clean (no "| Home" suffixes)
- [ ] Contact info is populated
- [ ] All selected assets generate without errors
- [ ] Text editing works on all editable fields
- [ ] PNG export produces a high-quality image
- [ ] JPG export produces a high-quality image
- [ ] Brochure text wraps correctly
- [ ] Invoice calculations display correctly

---

## Summary

This is a complete specification for the AI Brand Kit Generator. The system takes a single URL input, scrapes the website via Firecrawl, processes the brand identity via Gemini, and generates 4 professional SVG-based assets (business card, letterhead, tri-fold brochure, invoice) with inline text editing and high-resolution export.

The app is built as a standalone HTML/CSS/JS web application with no framework dependencies. API keys are stored in a config file and not exposed to end users.