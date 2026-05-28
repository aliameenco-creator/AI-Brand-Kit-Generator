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
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Gemini error:", response.status, text);
    if (response.status === 429) throw new Error("AI service is busy. Please wait a moment.");
    if (response.status === 400) throw new Error("Could not process this website's content. Please try a different URL.");
    throw new Error(`AI processing failed (${response.status}). Please try again.`);
  }

  const data = await response.json();
  const text = data.candidates && data.candidates[0]
    && data.candidates[0].content
    && data.candidates[0].content.parts
    && data.candidates[0].content.parts[0]
    && data.candidates[0].content.parts[0].text;

  if (!text) {
    console.error("Gemini empty response:", data);
    throw new Error("AI processing failed. Please try again.");
  }

  try {
    return normalizeProfile(JSON.parse(text));
  } catch (e) {
    console.warn("First JSON parse failed, retrying...", e, text);
    // single retry by extracting JSON from text if model added stray content
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return normalizeProfile(JSON.parse(match[0]));
      } catch (e2) {
        console.error("Retry parse failed:", e2);
      }
    }
    throw new Error("AI processing failed. Please try again.");
  }
}

function normalizeProfile(p) {
  p = p || {};
  p.businessName = p.businessName || "Your Business";
  p.tagline = p.tagline || "Quality services for your needs";
  p.industry = p.industry || "Business Services";

  const safeHex = (h, fallback) => (typeof h === "string" && /^#[0-9a-fA-F]{6}$/.test(h)) ? h : fallback;
  p.colors = p.colors || {};
  p.colors.primary = safeHex(p.colors.primary, "#2563eb");
  p.colors.secondary = safeHex(p.colors.secondary, "#1e40af");
  p.colors.accent = safeHex(p.colors.accent, "#f59e0b");
  p.colors.dark = safeHex(p.colors.dark, "#111827");
  p.colors.light = safeHex(p.colors.light, "#f8fafc");
  p.colors.textOnPrimary = safeHex(p.colors.textOnPrimary, "#ffffff");
  p.colors.textOnLight = safeHex(p.colors.textOnLight, "#111827");
  p.colors.textOnDark = safeHex(p.colors.textOnDark, "#ffffff");

  p.contact = p.contact || {};
  p.contact.phone = p.contact.phone || "";
  p.contact.email = p.contact.email || "";
  p.contact.address = p.contact.address || "";
  p.contact.website = p.contact.website || "";

  p.socials = p.socials || {};
  p.socials.twitter = p.socials.twitter || "";
  p.socials.linkedin = p.socials.linkedin || "";
  p.socials.instagram = p.socials.instagram || "";
  p.socials.facebook = p.socials.facebook || "";

  p.people = p.people || {};
  p.people.ownerName = p.people.ownerName || "John Smith";
  p.people.ownerTitle = p.people.ownerTitle || "Founder & CEO";
  p.people.ownerEmail = p.people.ownerEmail || p.contact.email || "name@domain.com";
  p.people.ownerPhone = p.people.ownerPhone || p.contact.phone || "";

  while ((p.services || []).length < 6) {
    (p.services = p.services || []).push("Service " + (p.services.length + 1));
  }
  p.services = p.services.slice(0, 6);

  p.brochure = p.brochure || {};
  p.brochure.headline = p.brochure.headline || "Built For Your Success";
  p.brochure.subheadline = p.brochure.subheadline || "Solutions tailored to help your business grow with confidence.";
  p.brochure.aboutTitle = p.brochure.aboutTitle || "About Us";
  p.brochure.aboutText = p.brochure.aboutText || "We are a dedicated team of professionals committed to delivering quality outcomes for every client we serve.";
  p.brochure.servicesTitle = p.brochure.servicesTitle || "Our Services";
  p.brochure.serviceDescriptions = (p.brochure.serviceDescriptions || []).slice(0, 6);
  while (p.brochure.serviceDescriptions.length < 6) {
    const i = p.brochure.serviceDescriptions.length;
    p.brochure.serviceDescriptions.push({
      name: p.services[i] || `Service ${i + 1}`,
      description: "Professional, reliable service delivered by experienced specialists who care about your results."
    });
  }
  p.brochure.whyUsTitle = p.brochure.whyUsTitle || "Why Choose Us";
  p.brochure.whyUsPoints = (p.brochure.whyUsPoints || []).slice(0, 4);
  while (p.brochure.whyUsPoints.length < 4) {
    p.brochure.whyUsPoints.push("Trusted by clients across the industry");
  }
  p.brochure.ctaText = p.brochure.ctaText || "Get in touch today for a free consultation";

  p.invoice = p.invoice || {};
  p.invoice.prefix = p.invoice.prefix || "INV";
  p.invoice.taxRate = typeof p.invoice.taxRate === "number" ? p.invoice.taxRate : 0;
  p.invoice.currency = p.invoice.currency || "$";
  p.invoice.paymentTerms = p.invoice.paymentTerms || "Net 30";
  p.invoice.bankDetails = p.invoice.bankDetails || "Bank: National Bank | Account: XXXX-XXXX-XXXX | Routing: XXXXXXXXX";
  p.invoice.notes = p.invoice.notes || "Thank you for your business.";

  p.imagery = p.imagery || {};
  p.imagery.logoUrl = p.imagery.logoUrl || "";
  p.imagery.heroUrl = p.imagery.heroUrl || "";
  p.imagery.supportingUrls = Array.isArray(p.imagery.supportingUrls) ? p.imagery.supportingUrls : [];

  p.styles = p.styles || {};
  const VALID_STYLES = {
    businessCard: ["classic-light", "bold-dark", "elegant-curves"],
    letterhead: ["geometric-accent", "clean-modern"],
    brochure: ["corporate-structured", "bold-imagery"],
    invoice: ["classic-accent", "bold-header"]
  };
  for (const k of Object.keys(VALID_STYLES)) {
    if (!VALID_STYLES[k].includes(p.styles[k])) {
      p.styles[k] = VALID_STYLES[k][0];
    }
  }

  // Will be filled by image-loader after AI
  p.images = p.images || { logo: "", hero: "", supporting: [] };

  // Typography
  p.typography = p.typography || {};
  const COMMON_GOOGLE_FONTS = new Set([
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Source Sans 3", "Source Sans Pro",
    "Nunito", "Nunito Sans", "Raleway", "Work Sans", "DM Sans", "Manrope", "Plus Jakarta Sans",
    "Playfair Display", "Merriweather", "Lora", "PT Serif", "Cormorant Garamond", "EB Garamond",
    "Oswald", "Bebas Neue", "Archivo", "Karla", "Quicksand", "Mulish", "Rubik", "Outfit",
    "Space Grotesk", "Urbanist", "Figtree", "Public Sans", "IBM Plex Sans", "IBM Plex Serif",
    "Libre Baskerville", "Libre Franklin", "Crimson Text", "Cardo", "Vollkorn", "Bitter"
  ]);
  const fam = (p.typography.fontFamily || "").trim();
  p.typography.fontFamily = fam && /^[A-Za-z][A-Za-z0-9 ]{1,40}$/.test(fam) ? fam : "DM Sans";
  // If Gemini returned an obscure non-Google font, fall back gracefully
  if (!COMMON_GOOGLE_FONTS.has(p.typography.fontFamily)) {
    // still allow it — Google Fonts will 404 silently and SVG falls back to sans-serif
  }

  return p;
}

// ============ AI REFINE (used by per-face refine button) ============
// Takes the current profile, an asset key (business-card / letterhead / brochure / invoice),
// and a user instruction. Returns a partial profile patch with updated fields.
async function refineBrandAsset(brandProfile, assetKey, instruction) {
  const focus = {
    "business-card": "businessName, tagline, people (ownerName, ownerTitle, ownerEmail, ownerPhone), contact",
    "letterhead": "businessName, tagline, contact, people (ownerName, ownerTitle)",
    "brochure": "brochure (headline, subheadline, aboutText, serviceDescriptions, whyUsPoints, ctaText), services",
    "invoice": "invoice (prefix, currency, paymentTerms, bankDetails, notes), services"
  }[assetKey] || "any";

  const prompt = `You are refining one asset of an existing brand profile.

Current brand profile JSON:
${JSON.stringify(brandProfile, (k, v) => k === "images" || k === "_firecrawlScreenshot" ? undefined : v, 2)}

The user wants to refine the "${assetKey}" asset. Their instruction:
"${instruction}"

Update only the fields that are relevant to this asset. Focus on: ${focus}.

Return a SINGLE JSON object containing only the changed top-level fields, preserving the existing schema (e.g. if you change the headline, return {"brochure": {"headline": "...", ...other unchanged brochure fields preserved}}).

CRITICAL: Return only valid JSON. No markdown, no backticks, no commentary.`;

  const response = await fetch(
    `${CONFIG.GEMINI_BASE_URL}/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    }
  );
  if (!response.ok) {
    const t = await response.text();
    console.error("Refine error:", response.status, t);
    throw new Error("Refinement failed. Please try again.");
  }
  const data = await response.json();
  const text = data.candidates && data.candidates[0]
    && data.candidates[0].content
    && data.candidates[0].content.parts
    && data.candidates[0].content.parts[0]
    && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error("Empty response from refinement.");
  try { return JSON.parse(text); }
  catch (e) {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Could not parse refinement JSON.");
  }
}

function buildBrandPrompt(rawData) {
  return `
You are a professional brand strategist and designer. I've scraped a business website and extracted raw data. Your job is to analyze this data and produce a clean, structured brand profile that will be used to generate professional business assets (business card, letterhead, brochure, invoice).

## RAW EXTRACTED DATA:

Business Name (raw): ${rawData.rawName}
Tagline (raw): ${rawData.rawTagline}
Logo URL: ${rawData.rawLogoUrl || "Not found"}
Image candidates (from website): ${JSON.stringify(rawData.rawImages || [])}
Fonts detected on website: ${JSON.stringify(rawData.rawFonts || [])}
Colors found: ${JSON.stringify(rawData.rawColors)}
Contact info: ${JSON.stringify(rawData.rawContact)}
Social links: ${JSON.stringify(rawData.rawSocials)}
Services: ${JSON.stringify(rawData.rawServices)}
Website URL: ${rawData.sourceUrl}

Page content:
${(rawData.rawContent || "").substring(0, 4000)}

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
  },

  "imagery": {
    "logoUrl": "Pick the best LOGO URL — the company's brand mark. Usually small (under 400px), often contains the word 'logo' in its filename, lives in the site header. Return empty string if no genuine logo found.",
    "heroUrl": "Pick the best HERO PHOTO URL — a large representative photo of the business's product, team, space, or work. MUST be a real photo, not a UI element, button, or icon. Empty string if no good photo found.",
    "supportingUrls": ["Up to 2 additional photo URLs that show different aspects of the business (people, spaces, products). Empty array if none."]
  },

  "typography": {
    "fontFamily": "The PRIMARY font family this brand uses. Pick from the 'Fonts detected' list above if any are real Google Fonts (e.g. 'Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Playfair Display', 'DM Sans'). If the list is empty or only contains generic fallbacks, choose ONE Google Font that suits the brand's industry and personality. Return the family name only (no weights, no quotes).",
    "fontStyle": "One of: 'modern-sans', 'classic-serif', 'rounded-friendly', 'geometric-bold', 'editorial-serif' — the visual character of the chosen font."
  },

  "styles": {
    "businessCard": "One of: 'classic-light', 'bold-dark', 'elegant-curves' — pick the style that best matches the brand's industry and personality",
    "letterhead": "One of: 'geometric-accent', 'clean-modern' — pick what fits",
    "brochure": "One of: 'corporate-structured', 'bold-imagery' — pick what fits",
    "invoice": "One of: 'classic-accent', 'bold-header' — pick what fits"
  }
}

STYLE SELECTION GUIDANCE:
- 'bold-dark' / 'bold-imagery' / 'bold-header' work for: creative agencies, tech, modern brands
- 'classic-light' / 'corporate-structured' / 'classic-accent' work for: professional services, B2B, finance, healthcare
- 'elegant-curves' / 'clean-modern' work for: lifestyle, hospitality, design, luxury

IMAGE SELECTION RULES (CRITICAL — read carefully):
- NEVER pick app-store badges or Google Play buttons (often have 'play.google.com', 'apps.apple.com', or 'app-store' in the URL).
- NEVER pick social-media icons (Facebook, Instagram, Twitter, LinkedIn, YouTube buttons).
- NEVER pick payment-method logos (Visa, Mastercard, PayPal, Stripe).
- NEVER pick generic UI elements: arrows, dividers, decorative shapes, loaders.
- The heroUrl MUST be a substantive photograph showing the business's actual product, team, space, or work — something a human would call a "real photo".
- If the candidates list contains only icons/badges/buttons and no real photos, return empty strings for heroUrl and supportingUrls rather than picking something bad.
- The logoUrl is the company's own brand mark only — never a third-party badge.
- Use ONLY URLs from the Image candidates list above. Do not invent URLs.

IMPORTANT RULES:
- Return ONLY the JSON object. No markdown, no backticks, no explanation.
- All colors must be valid 6-digit hex codes.
- If data is missing, generate realistic placeholder content that matches the business type.
- All text must be professional, polished, and ready to print.
- The brochure content should sound like real marketing copy, not generic filler.
- Services should be specific to the industry, not generic.
`;
}
