// Shared helpers
function _BC_FONT(profile) {
  const fam = (profile && profile.typography && profile.typography.fontFamily) || "DM Sans";
  const safe = String(fam).replace(/[<>"']/g, "");
  const importFam = encodeURIComponent(safe).replace(/%20/g, "+");
  return `<defs><style>@import url('https://fonts.googleapis.com/css2?family=${importFam}:wght@400;500;600;700;800&amp;display=swap'); text { font-family: '${safe}', system-ui, sans-serif; }</style></defs>`;
}
const _BC_ESC = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Logo helper. shape can be 'circle' or 'square' (rounded).
function _bcLogo(profile, x, y, size, fillColor, textColor, shape) {
  const logo = profile.images && profile.images.logo;
  const initial = (profile.businessName || "B").charAt(0).toUpperCase();
  const useSquare = shape === "square";
  const uid = `bc-logo-${Math.round(x)}-${Math.round(y)}-${Math.round(size)}-${useSquare ? "s" : "c"}`;

  if (logo) {
    const clipShape = useSquare
      ? `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 5}"/>`
      : `<circle cx="${x}" cy="${y}" r="${size}"/>`;
    const bgShape = useSquare
      ? `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 5}" fill="#ffffff"/>`
      : `<circle cx="${x}" cy="${y}" r="${size}" fill="#ffffff"/>`;
    return `
      <defs><clipPath id="${uid}">${clipShape}</clipPath></defs>
      ${bgShape}
      <image href="${logo}" x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${uid})"/>
    `;
  }
  // Fallback monogram
  const fallbackShape = useSquare
    ? `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 5}" fill="${fillColor}"/>`
    : `<circle cx="${x}" cy="${y}" r="${size}" fill="${fillColor}"/>`;
  return `
    ${fallbackShape}
    <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central"
          font-size="${size * 1.1}" font-weight="700" fill="${textColor}">${_BC_ESC(initial)}</text>
  `;
}

// Reusable contact-line icons
function _bcIcon(type, primary) {
  switch (type) {
    case "phone":
      return `<path d="M2,2 L7,2 L9,7 L6,9 C7,12 10,15 13,16 L15,13 L20,15 L20,20 C12,20 2,10 2,2 Z" fill="${primary}"/>`;
    case "email":
      return `<path d="M0,4 L20,4 L20,16 L0,16 Z M0,4 L10,12 L20,4" stroke="${primary}" stroke-width="1.6" fill="none"/>`;
    case "web":
      return `<circle cx="10" cy="10" r="9" fill="none" stroke="${primary}" stroke-width="1.6"/>
              <path d="M1,10 L19,10 M10,1 C14,5 14,15 10,19 C6,15 6,5 10,1" fill="none" stroke="${primary}" stroke-width="1.4"/>`;
    case "pin":
      return `<path d="M10,2 C14,6 14,12 10,16 C6,12 6,6 10,2 Z" fill="${primary}"/>
              <circle cx="10" cy="8" r="2.4" fill="#ffffff"/>`;
    default: return "";
  }
}

// ============ STYLE 1: Classic Light (image 1) ============
function _bcClassicLight(profile) {
  const { primary, accent, dark, light, textOnPrimary } = profile.colors;
  const name = profile.businessName, tagline = profile.tagline || "";
  const owner = profile.people || {}, contact = profile.contact || {};

  const front = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 890 510">
    ${_BC_FONT(profile)}
    <rect width="890" height="510" fill="#ffffff"/>

    <!-- subtle corner triangles -->
    <path d="M 890 0 L 890 180 L 740 0 Z" fill="${primary}" opacity="0.14"/>
    <path d="M 0 510 L 0 380 L 180 510 Z" fill="${primary}" opacity="0.14"/>

    <!-- Logo centered top -->
    ${_bcLogo(profile, 445, 135, 55, primary, textOnPrimary, "circle")}

    <text x="445" y="230" text-anchor="middle" font-size="30" font-weight="700" fill="${dark}" letter-spacing="3"
          data-editable="true" data-field="businessName">${_BC_ESC(String(name).toUpperCase())}</text>
    <line x1="370" y1="245" x2="520" y2="245" stroke="${primary}" stroke-width="2"/>
    <text x="445" y="268" text-anchor="middle" font-size="13" fill="${dark}" opacity="0.65" letter-spacing="4"
          data-editable="true" data-field="tagline">${_BC_ESC(String(tagline).toUpperCase())}</text>

    <!-- QR placeholder -->
    <rect x="395" y="300" width="100" height="100" fill="none" stroke="${dark}" stroke-width="1.5" opacity="0.4"/>
    <rect x="412" y="317" width="66" height="66" fill="${dark}" opacity="0.18"/>

    <!-- accent bar with curve -->
    <path d="M 0 440 Q 445 390 890 440 L 890 510 L 0 510 Z" fill="${primary}"/>
    <g transform="translate(340, 472)">
      ${_bcIcon("web", textOnPrimary).replace(/\$\{primary\}/g, textOnPrimary)}
      <text x="32" y="14" font-size="17" fill="${textOnPrimary}" font-weight="500"
            data-editable="true" data-field="website">${_BC_ESC(contact.website || profile.sourceUrl || "")}</text>
    </g>
  </svg>`;

  const back = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 890 510">
    ${_BC_FONT(profile)}
    <rect width="890" height="510" fill="${dark}"/>
    <path d="M 0 0 L 280 0 L 200 510 L 0 510 Z" fill="${primary}"/>

    ${_bcLogo(profile, 110, 100, 50, "#ffffff", primary, "circle")}

    <text x="340" y="160" font-size="34" font-weight="700" fill="#ffffff"
          data-editable="true" data-field="ownerName">${_BC_ESC(owner.ownerName)}</text>
    <text x="340" y="194" font-size="14" fill="${primary}" font-weight="600" letter-spacing="3"
          data-editable="true" data-field="ownerTitle">${_BC_ESC(String(owner.ownerTitle).toUpperCase())}</text>

    <g transform="translate(340, 270)">
      <circle cx="14" cy="14" r="14" fill="${primary}"/>
      <path d="M5,5 L10,5 L13,11 L9,14 C11,17 14,20 17,22 L20,18 L26,21 L26,26 C17,26 5,14 5,5 Z" fill="#ffffff" transform="scale(0.9) translate(2,2)"/>
      <text x="44" y="20" font-size="16" fill="#ffffff"
            data-editable="true" data-field="phone">${_BC_ESC(owner.ownerPhone || contact.phone)}</text>
    </g>
    <g transform="translate(340, 320)">
      <circle cx="14" cy="14" r="14" fill="${primary}"/>
      <path d="M5,9 L23,9 L23,19 L5,19 Z M5,9 L14,15 L23,9" stroke="#ffffff" stroke-width="1.6" fill="none"/>
      <text x="44" y="20" font-size="16" fill="#ffffff"
            data-editable="true" data-field="email">${_BC_ESC(owner.ownerEmail || contact.email)}</text>
    </g>
    <g transform="translate(340, 370)">
      <circle cx="14" cy="14" r="14" fill="${primary}"/>
      <circle cx="14" cy="14" r="7" fill="none" stroke="#ffffff" stroke-width="1.4"/>
      <path d="M7,14 L21,14 M14,7 C17,11 17,17 14,21 C11,17 11,11 14,7" stroke="#ffffff" stroke-width="1.2" fill="none"/>
      <text x="44" y="20" font-size="16" fill="#ffffff"
            data-editable="true" data-field="website2">${_BC_ESC(contact.website || profile.sourceUrl || "")}</text>
    </g>
    <g transform="translate(340, 420)">
      <circle cx="14" cy="14" r="14" fill="${primary}"/>
      <path d="M14,5 C19,11 19,19 14,25 C9,19 9,11 14,5 Z" fill="#ffffff" transform="scale(0.9) translate(1.5,1.5)"/>
      <text x="44" y="20" font-size="14" fill="#ffffff"
            data-editable="true" data-field="address">${_BC_ESC(contact.address)}</text>
    </g>
  </svg>`;

  return { front, back };
}

// ============ STYLE 2: Bold Dark (image 2) ============
function _bcBoldDark(profile) {
  const { primary, accent, dark, textOnPrimary } = profile.colors;
  const name = profile.businessName, tagline = profile.tagline || "";
  const owner = profile.people || {}, contact = profile.contact || {};

  const front = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 890 510">
    ${_BC_FONT(profile)}
    <rect width="890" height="510" fill="${dark}"/>
    <!-- left chevron accent -->
    <path d="M 0 0 L 120 0 L 60 255 L 120 510 L 0 510 Z" fill="${primary}"/>
    <path d="M 60 255 L 220 255 L 280 510 L 120 510 Z" fill="${dark}"/>
    <path d="M 60 255 L 200 255 L 260 510 L 100 510 Z" fill="${primary}" opacity="0.4"/>

    ${_bcLogo(profile, 445, 175, 60, primary, textOnPrimary, "circle")}

    <text x="445" y="295" text-anchor="middle" font-size="32" font-weight="700" fill="#ffffff" letter-spacing="3"
          data-editable="true" data-field="businessName">${_BC_ESC(String(name).toUpperCase())}</text>

    <rect x="370" y="315" width="150" height="3" fill="${primary}"/>

    <text x="445" y="355" text-anchor="middle" font-size="13" fill="#ffffff" opacity="0.7" letter-spacing="6"
          data-editable="true" data-field="tagline">${_BC_ESC(String(tagline).toUpperCase())}</text>
  </svg>`;

  const back = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 890 510">
    ${_BC_FONT(profile)}
    <rect width="890" height="510" fill="${dark}"/>
    <!-- right chevron accent -->
    <path d="M 890 0 L 770 0 L 830 255 L 770 510 L 890 510 Z" fill="${primary}"/>
    <path d="M 830 255 L 670 255 L 610 510 L 770 510 Z" fill="${dark}"/>
    <path d="M 830 255 L 690 255 L 630 510 L 790 510 Z" fill="${primary}" opacity="0.4"/>

    <text x="60" y="120" font-size="32" font-weight="700" fill="#ffffff" letter-spacing="3"
          data-editable="true" data-field="ownerName">${_BC_ESC(String(owner.ownerName).toUpperCase())}</text>

    <rect x="60" y="140" width="100" height="3" fill="${primary}"/>
    <text x="170" y="155" font-size="13" fill="${primary}" font-weight="600" letter-spacing="3"
          data-editable="true" data-field="ownerTitle">${_BC_ESC(owner.ownerTitle)}</text>

    <g transform="translate(60, 230)">
      <path d="M14,7 C18,11 18,17 14,21 C10,17 10,11 14,7 Z" fill="#ffffff"/>
      <circle cx="14" cy="13" r="2.6" fill="${dark}"/>
      <text x="44" y="20" font-size="15" fill="#ffffff"
            data-editable="true" data-field="address">${_BC_ESC(contact.address)}</text>
    </g>
    <g transform="translate(60, 280)">
      <path d="M5,5 L10,5 L13,11 L9,14 C11,17 14,20 17,22 L20,18 L26,21 L26,26 C17,26 5,14 5,5 Z" fill="#ffffff"/>
      <text x="44" y="20" font-size="15" fill="#ffffff"
            data-editable="true" data-field="phone">${_BC_ESC(owner.ownerPhone || contact.phone)}</text>
    </g>
    <g transform="translate(60, 330)">
      <path d="M3,7 L25,7 L25,22 L3,22 Z M3,7 L14,16 L25,7" stroke="#ffffff" stroke-width="2" fill="none"/>
      <text x="44" y="20" font-size="15" fill="#ffffff"
            data-editable="true" data-field="email">${_BC_ESC(owner.ownerEmail || contact.email)}</text>
    </g>
    <g transform="translate(60, 380)">
      <circle cx="14" cy="14" r="10" fill="none" stroke="#ffffff" stroke-width="1.8"/>
      <path d="M4,14 L24,14 M14,4 C18,9 18,19 14,24 C10,19 10,9 14,4" stroke="#ffffff" stroke-width="1.4" fill="none"/>
      <text x="44" y="20" font-size="15" fill="#ffffff"
            data-editable="true" data-field="website">${_BC_ESC(contact.website || profile.sourceUrl || "")}</text>
    </g>
  </svg>`;

  return { front, back };
}

// ============ STYLE 3: Elegant Curves (image 3) ============
// Redesigned: hero on left within smooth curve, clean right-side text block,
// logo aligned with the business name baseline.
function _bcElegantCurves(profile) {
  const { primary, accent, dark, light, textOnPrimary } = profile.colors;
  const name = profile.businessName, tagline = profile.tagline || "";
  const owner = profile.people || {}, contact = profile.contact || {};
  const hero = profile.images && profile.images.hero;

  const front = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 890 510">
    ${_BC_FONT(profile)}
    <rect width="890" height="510" fill="#ffffff"/>

    <!-- Hero left zone, clipped by a smooth curve -->
    ${hero
      ? `<defs><clipPath id="bc-elg-hero"><path d="M 0 0 L 380 0 Q 320 255 380 510 L 0 510 Z"/></clipPath></defs>
         <image href="${hero}" x="0" y="0" width="430" height="510" preserveAspectRatio="xMidYMid slice" clip-path="url(#bc-elg-hero)"/>`
      : `<path d="M 0 0 L 380 0 Q 320 255 380 510 L 0 510 Z" fill="${dark}"/>
         <text x="180" y="270" text-anchor="middle" font-size="160" font-weight="700" fill="#ffffff" opacity="0.18">${_BC_ESC((name||"B").charAt(0).toUpperCase())}</text>`
    }

    <!-- Decorative curves transitioning from hero to white -->
    <path d="M 360 0 Q 480 255 360 510" stroke="${primary}" stroke-width="22" fill="none" opacity="0.95"/>
    <path d="M 410 0 Q 530 255 410 510" stroke="${accent}" stroke-width="10" fill="none" opacity="0.85"/>

    <!-- Logo and business name aligned -->
    <g transform="translate(500, 195)">
      ${_bcLogo(profile, 30, 0, 32, primary, textOnPrimary, "circle")}
      <text x="78" y="6" font-size="28" font-weight="700" fill="${dark}"
            data-editable="true" data-field="businessName">${_BC_ESC(name)}</text>
      <line x1="78" y1="22" x2="220" y2="22" stroke="${primary}" stroke-width="2"/>
      <text x="78" y="42" font-size="11" fill="${dark}" opacity="0.65" letter-spacing="4"
            data-editable="true" data-field="tagline">${_BC_ESC(String(tagline).toUpperCase())}</text>
    </g>

    <text x="500" y="450" font-size="13" fill="${dark}" opacity="0.7" letter-spacing="3"
          data-editable="true" data-field="website">${_BC_ESC(contact.website || profile.sourceUrl || "")}</text>
  </svg>`;

  const back = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 890 510">
    ${_BC_FONT(profile)}
    <rect width="890" height="510" fill="${dark}"/>
    <rect x="450" y="0" width="440" height="510" fill="#ffffff"/>

    <path d="M 470 0 Q 590 255 470 510" stroke="${primary}" stroke-width="20" fill="none" opacity="0.9"/>
    <path d="M 510 0 Q 630 255 510 510" stroke="${accent}" stroke-width="8" fill="none" opacity="0.8"/>

    ${_bcLogo(profile, 780, 400, 40, primary, textOnPrimary, "circle")}

    <text x="60" y="105" font-size="30" font-weight="700" fill="${primary}"
          data-editable="true" data-field="ownerName">${_BC_ESC(owner.ownerName)}</text>
    <text x="60" y="135" font-size="15" fill="#ffffff" opacity="0.9"
          data-editable="true" data-field="ownerTitle">${_BC_ESC(owner.ownerTitle)}</text>

    <g transform="translate(60, 215)">
      <path d="M14,7 C18,11 18,17 14,21 C10,17 10,11 14,7 Z" fill="${primary}"/>
      <circle cx="14" cy="13" r="2.6" fill="${dark}"/>
      <text x="44" y="20" font-size="13" fill="#ffffff"
            data-editable="true" data-field="address">${_BC_ESC(contact.address)}</text>
    </g>
    <g transform="translate(60, 265)">
      <path d="M5,5 L10,5 L13,11 L9,14 C11,17 14,20 17,22 L20,18 L26,21 L26,26 C17,26 5,14 5,5 Z" fill="${primary}"/>
      <text x="44" y="20" font-size="13" fill="#ffffff"
            data-editable="true" data-field="phone">${_BC_ESC(owner.ownerPhone || contact.phone)}</text>
    </g>
    <g transform="translate(60, 315)">
      <path d="M3,7 L25,7 L25,22 L3,22 Z M3,7 L14,16 L25,7" stroke="${primary}" stroke-width="2" fill="none"/>
      <text x="44" y="20" font-size="13" fill="#ffffff"
            data-editable="true" data-field="email">${_BC_ESC(owner.ownerEmail || contact.email)}</text>
    </g>
    <g transform="translate(60, 365)">
      <circle cx="14" cy="14" r="10" fill="none" stroke="${primary}" stroke-width="2"/>
      <path d="M4,14 L24,14 M14,4 C18,9 18,19 14,24 C10,19 10,9 14,4" stroke="${primary}" stroke-width="1.4" fill="none"/>
      <text x="44" y="20" font-size="13" fill="#ffffff"
            data-editable="true" data-field="website2">${_BC_ESC(contact.website || profile.sourceUrl || "")}</text>
    </g>
  </svg>`;

  return { front, back };
}

const BUSINESS_CARD_STYLES = [
  { id: "classic-light", name: "Classic Light", description: "Light cover with accent strip", generate: _bcClassicLight },
  { id: "bold-dark", name: "Bold Dark", description: "Dark with bold chevron accent", generate: _bcBoldDark },
  { id: "elegant-curves", name: "Elegant Curves", description: "Curved hero with refined right-side layout", generate: _bcElegantCurves }
];

function generateBusinessCard(profile, styleId) {
  const style = BUSINESS_CARD_STYLES.find(s => s.id === styleId) || BUSINESS_CARD_STYLES[0];
  return style.generate(profile);
}
