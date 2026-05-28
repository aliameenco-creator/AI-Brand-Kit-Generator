function extractBrandData(firecrawlResponse, sourceUrl) {
  const payload = firecrawlResponse.data || firecrawlResponse;
  const html = payload.html || "";
  const markdown = payload.markdown || "";
  const metadata = payload.metadata || {};

  const doc = parseHtml(html);

  const rawName = pickName(doc, metadata);
  const rawTagline = pickTagline(doc, metadata);
  const rawLogoUrl = pickLogo(doc, metadata, sourceUrl);
  const rawColors = pickColors(html);
  const rawContact = pickContact(html, markdown);
  const rawSocials = pickSocials(html, markdown);
  const rawServices = pickServices(doc, markdown);
  const rawImages = pickImages(doc, sourceUrl, rawLogoUrl);
  const rawFonts = pickFonts(doc, html);
  const screenshotUrl = payload.screenshot || (payload.metadata && payload.metadata.screenshot) || "";

  return {
    rawName,
    rawTagline,
    rawLogoUrl,
    rawImages,
    rawFonts,
    rawColors,
    rawContact,
    rawSocials,
    rawServices,
    rawContent: markdown || textContent(doc),
    sourceUrl: sourceUrl,
    screenshotUrl
  };
}

// Extract font families used by the website.
// Looks at: Google Fonts link tags, <style> blocks, inline style attrs.
// Returns an ordered list (most-likely-primary first).
function pickFonts(doc, html) {
  const counts = new Map();
  const bump = (name, weight) => {
    if (!name) return;
    const clean = String(name).trim().replace(/^["']|["']$/g, "");
    if (!clean || clean.length > 40) return;
    if (/^(system-ui|-apple-system|BlinkMacSystemFont|sans-serif|serif|monospace|cursive|fantasy|ui-|inherit|initial|unset|var\()/i.test(clean)) return;
    counts.set(clean, (counts.get(clean) || 0) + weight);
  };

  // 1) Google Fonts <link> tags — strongest signal
  if (doc) {
    Array.from(doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.bunny.net"]')).forEach(link => {
      const href = link.getAttribute("href") || "";
      const matches = href.matchAll(/family=([^&]+)/gi);
      for (const m of matches) {
        // Could be multiple families separated by | or &family= already split
        const families = decodeURIComponent(m[1]).split("|");
        families.forEach(fam => {
          const name = fam.split(":")[0].replace(/\+/g, " ").trim();
          bump(name, 10);
        });
      }
    });
  }

  // 2) font-family declarations in any CSS in HTML (style tags, inline styles, head)
  const cssRegex = /font-family\s*:\s*([^;}\n]+)/gi;
  let match;
  while ((match = cssRegex.exec(html)) !== null) {
    const decl = match[1].split("!")[0]; // drop !important
    const first = decl.split(",")[0];
    bump(first, 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 5);
}

function pickImages(doc, sourceUrl, logoUrl) {
  if (!doc) return [];
  const seen = new Set();
  if (logoUrl) seen.add(logoUrl);
  const out = [];

  // Patterns that strongly indicate the image is NOT a brand hero photo
  const BAD_PATTERNS = /(app-?store|google-?play|play-?store|badge|btn|button|sprite|icon[-/_]|social|facebook|twitter|instagram|linkedin|youtube|whatsapp|tiktok|pinterest|spinner|loader|placeholder|emoji|favicon|avatar|gravatar|qr-?code|payment|visa|mastercard|paypal|stripe|amex|powered-?by|cookie|gdpr|track|pixel)/i;

  const candidates = [
    ...Array.from(doc.querySelectorAll('meta[property="og:image"]')).map(m => ({ src: m.getAttribute("content"), alt: "", w: 0, h: 0, source: "og" })),
    ...Array.from(doc.querySelectorAll('meta[name="twitter:image"]')).map(m => ({ src: m.getAttribute("content"), alt: "", w: 0, h: 0, source: "tw" })),
    ...Array.from(doc.querySelectorAll("img")).map(img => ({
      src: img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || "",
      alt: img.getAttribute("alt") || "",
      w: parseInt(img.getAttribute("width") || "0", 10),
      h: parseInt(img.getAttribute("height") || "0", 10),
      source: "img"
    }))
  ];

  candidates.forEach(c => {
    const src = c.src;
    if (!src) return;
    if (src.startsWith("data:")) return;
    // Filter known badges/icons/social
    if (BAD_PATTERNS.test(src) || BAD_PATTERNS.test(c.alt || "")) return;
    // Skip svg/gif unless explicit logo
    if (/\.(svg|gif)(\?|$|#)/i.test(src) && !/logo|brand/i.test(src)) return;
    // Skip tiny declared sizes
    if (c.w && c.w < 200 && c.h && c.h < 200) return;
    // Skip extreme aspect ratios (banners/buttons)
    if (c.w && c.h) {
      const ar = c.w / c.h;
      if (ar > 5 || ar < 0.2) return;
    }
    let absolute = src;
    try { absolute = new URL(src, sourceUrl).href; } catch (e) { return; }
    if (seen.has(absolute)) return;
    seen.add(absolute);
    out.push(absolute);
  });
  return out.slice(0, 10);
}

function parseHtml(html) {
  try {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  } catch (e) {
    return null;
  }
}

function textContent(doc) {
  if (!doc) return "";
  return (doc.body && doc.body.textContent || "").trim();
}

function metaContent(doc, selector) {
  if (!doc) return "";
  const el = doc.querySelector(selector);
  return el ? (el.getAttribute("content") || "").trim() : "";
}

function pickName(doc, metadata) {
  const candidates = [
    metadata.ogSiteName,
    metadata["og:site_name"],
    metaContent(doc, 'meta[property="og:site_name"]'),
    metadata.title,
    doc && doc.querySelector("title") ? doc.querySelector("title").textContent : "",
    doc && doc.querySelector("h1") ? doc.querySelector("h1").textContent : ""
  ];
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c).trim();
  }
  return "";
}

function pickTagline(doc, metadata) {
  const candidates = [
    metadata.description,
    metadata.ogDescription,
    metaContent(doc, 'meta[name="description"]'),
    metaContent(doc, 'meta[property="og:description"]'),
    doc && doc.querySelector("h2") ? doc.querySelector("h2").textContent : "",
    doc && doc.querySelector("p") ? doc.querySelector("p").textContent : ""
  ];
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c).trim();
  }
  return "";
}

function pickLogo(doc, metadata, sourceUrl) {
  if (!doc) return "";

  // First: hunt for an <img> in header/nav whose alt/class/src contains "logo"
  const logoKeywords = /logo|brand|wordmark/i;
  const headerImgs = Array.from(doc.querySelectorAll(
    "header img, nav img, [class*='header'] img, [class*='nav'] img, [class*='logo'] img, [id*='logo'] img, a[href='/'] img, a[href='#'] img"
  ));
  for (const img of headerImgs) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    const alt = img.getAttribute("alt") || "";
    const cls = img.getAttribute("class") || "";
    if (src && (logoKeywords.test(src) || logoKeywords.test(alt) || logoKeywords.test(cls))) {
      try { return new URL(src, sourceUrl).href; } catch (e) { return src; }
    }
  }
  // Fallback: any img with logo keyword
  const anyLogoImg = Array.from(doc.querySelectorAll("img")).find(img => {
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    return logoKeywords.test(src) || logoKeywords.test(alt);
  });
  if (anyLogoImg) {
    const src = anyLogoImg.getAttribute("src") || anyLogoImg.getAttribute("data-src");
    try { return new URL(src, sourceUrl).href; } catch (e) { return src; }
  }
  // Fallback: first <img> inside header/nav (often the brand mark)
  const firstHeaderImg = doc.querySelector("header img, nav img");
  if (firstHeaderImg) {
    const src = firstHeaderImg.getAttribute("src") || firstHeaderImg.getAttribute("data-src");
    if (src) {
      try { return new URL(src, sourceUrl).href; } catch (e) { return src; }
    }
  }
  // Last resort: og:image (often a hero, not a logo — but better than nothing)
  const fallback = metadata.ogImage
    || metaContent(doc, 'meta[property="og:image"]')
    || metaContent(doc, 'link[rel="icon"]')
    || metaContent(doc, 'link[rel="shortcut icon"]');
  if (fallback) {
    try { return new URL(fallback, sourceUrl).href; } catch (e) { return fallback; }
  }
  return "";
}

function pickColors(html) {
  const colors = new Set();
  const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
  const matches = html.match(hexRegex) || [];
  matches.forEach(m => {
    let hex = m.toLowerCase();
    if (hex.length === 4) {
      hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    colors.add(hex);
  });
  return Array.from(colors).slice(0, 12);
}

function pickContact(html, markdown) {
  const combined = `${html}\n${markdown}`;
  const phone = (combined.match(/\+?\d[\d\s().-]{7,}\d/) || [""])[0].trim();
  const email = (combined.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [""])[0].trim();
  const addressMatch = combined.match(/\d{1,5}\s+[\w .,'-]{4,80},\s*[\w .'-]{2,40},?\s*[A-Z]{2}\s*\d{4,6}/);
  return {
    phone,
    email,
    address: addressMatch ? addressMatch[0].trim() : ""
  };
}

function pickSocials(html, markdown) {
  const combined = `${html}\n${markdown}`;
  const find = (re) => {
    const m = combined.match(re);
    return m ? m[0] : "";
  };
  return {
    twitter: find(/https?:\/\/(www\.)?(twitter|x)\.com\/[A-Za-z0-9_]+/),
    linkedin: find(/https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[A-Za-z0-9_-]+/),
    instagram: find(/https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+/),
    facebook: find(/https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.-]+/)
  };
}

function pickServices(doc, markdown) {
  const services = [];
  if (doc) {
    doc.querySelectorAll("h2, h3").forEach(h => {
      const t = (h.textContent || "").trim();
      if (t && t.length < 60) services.push(t);
    });
  }
  if (services.length < 3 && markdown) {
    const bullets = markdown.match(/^[-*]\s+(.{3,60})$/gm) || [];
    bullets.forEach(b => services.push(b.replace(/^[-*]\s+/, "").trim()));
  }
  return Array.from(new Set(services)).slice(0, 12);
}
