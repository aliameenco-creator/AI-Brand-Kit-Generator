const _BR_FONT = `<defs><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;display=swap'); text { font-family: 'DM Sans', system-ui, sans-serif; }</style></defs>`;
const _BR_ESC = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function _brWrap(text, maxChars) {
  const words = String(text || "").split(/\s+/);
  const lines = []; let current = "";
  words.forEach(w => {
    if ((current + " " + w).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = w;
    } else current = (current + " " + w).trim();
  });
  if (current) lines.push(current.trim());
  return lines;
}

function _brTspans(text, maxChars, x, lineHeight, field) {
  return _brWrap(text, maxChars).map((line, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}" data-editable="true" data-field="${field}-${i}">${_BR_ESC(line)}</tspan>`
  ).join("");
}

function _brLogo(profile, x, y, size, fill, textColor) {
  const logo = profile.images && profile.images.logo;
  const initial = (profile.businessName || "B").charAt(0).toUpperCase();
  if (logo) {
    const uid = `br-logo-${Math.round(x)}-${Math.round(y)}`;
    return `
      <defs><clipPath id="${uid}"><circle cx="${x}" cy="${y}" r="${size}"/></clipPath></defs>
      <circle cx="${x}" cy="${y}" r="${size}" fill="#ffffff"/>
      <image href="${logo}" x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${uid})"/>
    `;
  }
  return `
    <circle cx="${x}" cy="${y}" r="${size}" fill="${fill}"/>
    <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central"
          font-size="${size * 1.1}" font-weight="700" fill="${textColor}">${_BR_ESC(initial)}</text>
  `;
}

// ============ STYLE 1: Corporate Structured (image 6) ============
function _brCorporate(profile) {
  const { primary, secondary, accent, dark, light, textOnPrimary } = profile.colors;
  const name = profile.businessName, tagline = profile.tagline || "";
  const initial = (name || "B").charAt(0).toUpperCase();
  const b = profile.brochure || {}, contact = profile.contact || {}, services = b.serviceDescriptions || [];
  const hero = profile.images && profile.images.hero;

  // OUTSIDE
  const outside = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2970 2100">
    ${_BR_FONT}
    <rect width="2970" height="2100" fill="${light}"/>

    <!-- PANEL 3: services list -->
    <rect x="0" y="0" width="990" height="2100" fill="${light}"/>
    <rect x="0" y="0" width="990" height="280" fill="${primary}"/>
    <text x="80" y="180" font-size="64" font-weight="700" fill="${textOnPrimary}"
          data-editable="true" data-field="servicesListTitle">${_BR_ESC(b.servicesTitle)}</text>

    <g transform="translate(80, 340)">
      ${(services || []).slice(0, 6).map((s, i) => `
        <g transform="translate(0, ${i * 230})">
          <circle cx="36" cy="36" r="36" fill="${primary}"/>
          <text x="36" y="36" text-anchor="middle" dominant-baseline="central" font-size="32" font-weight="700" fill="${textOnPrimary}">${i + 1}</text>
          <text x="100" y="42" font-size="32" font-weight="700" fill="${dark}"
                data-editable="true" data-field="back-svc-${i}-name">${_BR_ESC(s.name)}</text>
          <text x="100" y="86" font-size="22" fill="${dark}" opacity="0.75">
            ${_brTspans(s.description, 38, 100, 32, `back-svc-${i}-desc`)}
          </text>
        </g>
      `).join("")}
    </g>

    <line x1="990" y1="40" x2="990" y2="2060" stroke="${dark}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.3"/>

    <!-- PANEL 4: back-flap (about + chart + CTA) -->
    <rect x="990" y="0" width="990" height="2100" fill="#ffffff"/>
    <text x="1070" y="200" font-size="56" font-weight="700" fill="${dark}"
          data-editable="true" data-field="aboutTitle">${_BR_ESC(b.aboutTitle)}</text>
    <rect x="1070" y="220" width="160" height="8" fill="${primary}"/>

    <text x="1070" y="320" font-size="28" fill="${dark}" opacity="0.85">
      ${_brTspans(b.aboutText, 32, 1070, 42, "about")}
    </text>

    <!-- Pie chart decoration -->
    <g transform="translate(1485, 1180)">
      <circle cx="0" cy="0" r="220" fill="${primary}"/>
      <path d="M 0 0 L 220 0 A 220 220 0 0 1 -69 209 Z" fill="${secondary}"/>
      <path d="M 0 0 L -69 209 A 220 220 0 0 1 -220 0 Z" fill="${accent}"/>
      <circle cx="0" cy="0" r="80" fill="#ffffff"/>
    </g>

    <text x="1485" y="1560" text-anchor="middle" font-size="32" font-weight="700" fill="${dark}"
          data-editable="true" data-field="whyUsTitle">${_BR_ESC(b.whyUsTitle)}</text>

    <g transform="translate(1070, 1620)">
      ${(b.whyUsPoints || []).slice(0, 4).map((pt, i) => `
        <g transform="translate(${(i % 2) * 430}, ${Math.floor(i / 2) * 130})">
          <circle cx="16" cy="16" r="12" fill="${primary}"/>
          <text x="48" y="24" font-size="20" fill="${dark}">
            ${_brTspans(pt, 26, 48, 26, `why-${i}`)}
          </text>
        </g>
      `).join("")}
    </g>

    <line x1="1980" y1="40" x2="1980" y2="2060" stroke="${dark}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.3"/>

    <!-- PANEL 1: COVER -->
    ${hero
      ? `<defs><clipPath id="br-cover-hero"><path d="M 1980 0 L 2970 0 L 2970 1050 Q 2475 1250 1980 1050 Z"/></clipPath></defs>
         <image href="${hero}" x="1980" y="0" width="990" height="1100" preserveAspectRatio="xMidYMid slice" clip-path="url(#br-cover-hero)"/>`
      : `<rect x="1980" y="0" width="990" height="1100" fill="${secondary}"/>
         <circle cx="2475" cy="500" r="200" fill="${primary}" opacity="0.3"/>
         <text x="2475" y="520" text-anchor="middle" dominant-baseline="central" font-size="160" font-weight="700" fill="${textOnPrimary}" opacity="0.5">${_BR_ESC(initial)}</text>`
    }

    <rect x="1980" y="1100" width="990" height="1000" fill="${primary}"/>

    <text x="2475" y="1300" text-anchor="middle" font-size="26" fill="${textOnPrimary}" opacity="0.85" letter-spacing="8"
          data-editable="true" data-field="cover-businessName">${_BR_ESC(String(name).toUpperCase())}</text>
    <text x="2475" y="1440" text-anchor="middle" font-size="76" font-weight="700" fill="${textOnPrimary}">
      ${(function () {
        const lines = _brWrap(b.headline, 14);
        return lines.map((line, i) =>
          `<tspan x="2475" dy="${i === 0 ? 0 : 86}" text-anchor="middle" data-editable="true" data-field="cover-headline-${i}">${_BR_ESC(line)}</tspan>`
        ).join("");
      })()}
    </text>

    <rect x="2225" y="1660" width="500" height="4" fill="${textOnPrimary}"/>

    <text x="2475" y="1770" text-anchor="middle" font-size="28" fill="${textOnPrimary}" opacity="0.9" font-style="italic">
      ${(function () {
        const lines = _brWrap(b.subheadline, 30);
        return lines.map((line, i) =>
          `<tspan x="2475" dy="${i === 0 ? 0 : 40}" text-anchor="middle" data-editable="true" data-field="cover-sub-${i}">${_BR_ESC(line)}</tspan>`
        ).join("");
      })()}
    </text>

    <text x="2475" y="2030" text-anchor="middle" font-size="24" fill="${textOnPrimary}" opacity="0.85" letter-spacing="4"
          data-editable="true" data-field="cover-website">${_BR_ESC(contact.website)}</text>
  </svg>`;

  // INSIDE
  const inside = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2970 2100">
    ${_BR_FONT}
    <rect width="2970" height="2100" fill="#ffffff"/>

    <!-- PANEL 5 -->
    <rect x="0" y="0" width="990" height="2100" fill="#ffffff"/>
    <text x="80" y="180" font-size="62" font-weight="700" fill="${primary}" letter-spacing="5"
          data-editable="true" data-field="aboutLabel">${_BR_ESC(String(b.aboutTitle).toUpperCase())}</text>
    <rect x="80" y="200" width="180" height="8" fill="${accent}"/>

    <text x="80" y="290" font-size="26" fill="${dark}" opacity="0.85">
      ${_brTspans(b.aboutText, 34, 80, 38, "in-about")}
    </text>

    <!-- Bar chart decoration -->
    <g transform="translate(80, 1140)">
      <rect x="0" y="200" width="60" height="100" fill="${primary}" opacity="0.4"/>
      <rect x="80" y="120" width="60" height="180" fill="${primary}" opacity="0.6"/>
      <rect x="160" y="80" width="60" height="220" fill="${primary}" opacity="0.8"/>
      <rect x="240" y="40" width="60" height="260" fill="${primary}"/>
      <rect x="320" y="160" width="60" height="140" fill="${secondary}" opacity="0.7"/>
      <rect x="400" y="60" width="60" height="240" fill="${secondary}"/>
      <line x1="0" y1="300" x2="490" y2="300" stroke="${dark}" stroke-width="3"/>
    </g>

    <text x="80" y="1640" font-size="56" font-weight="700" fill="${primary}"
          data-editable="true" data-field="pullQuoteMark">"</text>
    <text x="80" y="1720" font-size="32" font-weight="600" fill="${dark}" font-style="italic">
      ${_brTspans(profile.tagline, 28, 80, 44, "pull-tagline")}
    </text>

    <line x1="990" y1="40" x2="990" y2="2060" stroke="${dark}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.3"/>

    <!-- PANEL 6 -->
    <rect x="990" y="0" width="990" height="2100" fill="${light}"/>
    <text x="1070" y="180" font-size="52" font-weight="700" fill="${primary}"
          data-editable="true" data-field="midTitle">${_BR_ESC(b.servicesTitle)}</text>
    <rect x="1070" y="200" width="160" height="6" fill="${accent}"/>

    ${(services || []).slice(0, 3).map((s, i) => `
      <g transform="translate(1070, ${300 + i * 300})">
        <rect x="0" y="0" width="830" height="260" fill="#ffffff" stroke="${dark}" stroke-width="1.5" opacity="0.9"/>
        <rect x="0" y="0" width="12" height="260" fill="${primary}"/>
        <text x="50" y="70" font-size="34" font-weight="700" fill="${primary}"
              data-editable="true" data-field="in-svc-${i}-name">${_BR_ESC(s.name)}</text>
        <text x="50" y="130" font-size="22" fill="${dark}" opacity="0.85">
          ${_brTspans(s.description, 38, 50, 32, `in-svc-${i}-desc`)}
        </text>
      </g>
    `).join("")}

    <line x1="1980" y1="40" x2="1980" y2="2060" stroke="${dark}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.3"/>

    <!-- PANEL 2 -->
    <rect x="1980" y="0" width="990" height="2100" fill="#ffffff"/>
    <text x="2060" y="180" font-size="52" font-weight="700" fill="${primary}"
          data-editable="true" data-field="moreTitle">More Solutions</text>
    <rect x="2060" y="200" width="160" height="6" fill="${accent}"/>

    <!-- Services table -->
    <g transform="translate(2060, 300)">
      <rect x="0" y="0" width="830" height="64" fill="${primary}"/>
      <text x="40" y="42" font-size="20" font-weight="700" fill="${textOnPrimary}" letter-spacing="2">NO</text>
      <text x="160" y="42" font-size="20" font-weight="700" fill="${textOnPrimary}" letter-spacing="2">SERVICE</text>
      <text x="790" y="42" font-size="20" font-weight="700" fill="${textOnPrimary}" text-anchor="end" letter-spacing="2">RATING</text>

      ${(services || []).slice(0, 6).map((s, i) => `
        <g transform="translate(0, ${64 + i * 72})">
          <rect x="0" y="0" width="830" height="72" fill="${i % 2 === 0 ? "#ffffff" : light}" stroke="${dark}" stroke-width="0.5" opacity="0.5"/>
          <text x="40" y="46" font-size="22" fill="${dark}" font-weight="600">${i + 1}</text>
          <text x="160" y="46" font-size="22" fill="${dark}"
                data-editable="true" data-field="tbl-${i}-name">${_BR_ESC(s.name)}</text>
          <g transform="translate(620, 20)">
            ${[0, 1, 2, 3, 4].map(j => `<circle cx="${j * 36}" cy="16" r="12" fill="${j < 4 ? primary : light}" stroke="${primary}" stroke-width="1.2"/>`).join("")}
          </g>
        </g>
      `).join("")}
    </g>

    <!-- CTA box -->
    <rect x="2060" y="1660" width="830" height="320" fill="${primary}"/>
    <text x="2475" y="1770" text-anchor="middle" font-size="36" font-weight="700" fill="${textOnPrimary}">
      ${(function () {
        const lines = _brWrap(b.ctaText, 24);
        return lines.map((line, i) =>
          `<tspan x="2475" dy="${i === 0 ? 0 : 50}" text-anchor="middle" data-editable="true" data-field="cta-${i}">${_BR_ESC(line)}</tspan>`
        ).join("");
      })()}
    </text>
    <text x="2475" y="1930" text-anchor="middle" font-size="24" fill="${textOnPrimary}" opacity="0.9"
          data-editable="true" data-field="cta-contact">${_BR_ESC(contact.phone || contact.email || contact.website)}</text>
  </svg>`;

  return { outside, inside };
}

// ============ STYLE 2: Bold Imagery (image 7) ============
function _brBoldImagery(profile) {
  const { primary, accent, dark, textOnPrimary } = profile.colors;
  const name = profile.businessName, tagline = profile.tagline || "";
  const initial = (name || "B").charAt(0).toUpperCase();
  const b = profile.brochure || {}, contact = profile.contact || {}, services = b.serviceDescriptions || [];
  const hero = profile.images && profile.images.hero;
  const support1 = (profile.images && profile.images.supporting && profile.images.supporting[0]) || hero;
  const support2 = (profile.images && profile.images.supporting && profile.images.supporting[1]) || hero;

  const heroCircle = (cx, cy, r, src, fallbackColor) => src
    ? `<defs><clipPath id="brbi-c-${cx}-${cy}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
       <image href="${src}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#brbi-c-${cx}-${cy})"/>
       <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${primary}" stroke-width="8"/>`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fallbackColor}"/>
       <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${r * 0.8}" font-weight="700" fill="${textOnPrimary}" opacity="0.6">${_BR_ESC(initial)}</text>`;

  // OUTSIDE
  const outside = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2970 2100">
    ${_BR_FONT}
    <rect width="2970" height="2100" fill="${dark}"/>

    <!-- PANEL 3: hero left + about/quote -->
    ${hero
      ? `<defs><clipPath id="brbi-p3"><rect x="0" y="0" width="700" height="2100"/></clipPath></defs>
         <image href="${hero}" x="0" y="0" width="700" height="2100" preserveAspectRatio="xMidYMid slice" clip-path="url(#brbi-p3)"/>
         <rect x="0" y="0" width="700" height="2100" fill="${dark}" opacity="0.3"/>`
      : `<rect x="0" y="0" width="700" height="2100" fill="${primary}"/>
         <text x="350" y="900" text-anchor="middle" font-size="400" font-weight="700" fill="#ffffff" opacity="0.3">${_BR_ESC(initial)}</text>`
    }

    <!-- Quote circle on hero -->
    <circle cx="350" cy="700" r="220" fill="${primary}"/>
    <text x="350" y="630" text-anchor="middle" font-size="100" font-weight="700" fill="${textOnPrimary}">"</text>
    <text x="350" y="720" text-anchor="middle" font-size="22" fill="${textOnPrimary}" font-weight="600" letter-spacing="2">
      ${(function () {
        const lines = _brWrap(profile.tagline, 20);
        return lines.map((line, i) =>
          `<tspan x="350" dy="${i === 0 ? 0 : 30}" text-anchor="middle" data-editable="true" data-field="quote-${i}">${_BR_ESC(line)}</tspan>`
        ).join("");
      })()}
    </text>

    <rect x="700" y="0" width="290" height="2100" fill="${dark}"/>

    <!-- About column -->
    <text x="740" y="200" font-size="40" font-weight="700" fill="${textOnPrimary}" letter-spacing="4"
          data-editable="true" data-field="aboutLabel">ABOUT</text>
    <text x="740" y="252" font-size="30" font-weight="700" fill="${primary}" letter-spacing="3"
          data-editable="true" data-field="aboutCompanyLabel">OUR COMPANY</text>
    <rect x="740" y="272" width="80" height="6" fill="${primary}"/>

    <text x="740" y="350" font-size="20" fill="${textOnPrimary}" opacity="0.88">
      ${_brTspans(b.aboutText, 22, 740, 30, "bi-about")}
    </text>

    <!-- two key points (further down) -->
    <text x="740" y="1700" font-size="20" font-weight="700" fill="${primary}" letter-spacing="2">
      ${_brTspans(b.whyUsPoints && b.whyUsPoints[0] || "Trusted by clients across the industry", 22, 740, 26, "bi-pt-0")}
    </text>
    <text x="740" y="1880" font-size="20" font-weight="700" fill="${primary}" letter-spacing="2">
      ${_brTspans(b.whyUsPoints && b.whyUsPoints[1] || "Award-winning service excellence", 22, 740, 26, "bi-pt-1")}
    </text>

    <line x1="990" y1="40" x2="990" y2="2060" stroke="${primary}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.45"/>

    <!-- PANEL 4: headline + secondary hero -->
    <rect x="990" y="0" width="990" height="2100" fill="${dark}"/>
    <text x="1060" y="280" font-size="62" font-weight="700" fill="${textOnPrimary}">
      ${(function () {
        const lines = _brWrap(b.headline, 16);
        return lines.map((line, i) =>
          `<tspan x="1060" dy="${i === 0 ? 0 : 76}" data-editable="true" data-field="bi-headline-${i}">${_BR_ESC(line)}</tspan>`
        ).join("");
      })()}
    </text>

    <text x="1060" y="680" font-size="26" fill="${textOnPrimary}" opacity="0.75">
      ${_brTspans(b.subheadline, 32, 1060, 38, "bi-sub")}
    </text>

    <!-- Secondary hero circle -->
    ${heroCircle(1485, 1300, 290, support1, primary)}

    <!-- Brand mark badge bottom -->
    <g transform="translate(1485, 1830)">
      <circle cx="0" cy="0" r="100" fill="${primary}"/>
      <text x="0" y="-10" text-anchor="middle" font-size="22" fill="${textOnPrimary}" letter-spacing="3" font-weight="700">BROCHURE</text>
      <text x="0" y="22" text-anchor="middle" font-size="16" fill="${textOnPrimary}" opacity="0.85" letter-spacing="4">CATALOG</text>
    </g>

    <line x1="1980" y1="40" x2="1980" y2="2060" stroke="${primary}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.45"/>

    <!-- PANEL 1: COVER -->
    <rect x="1980" y="0" width="990" height="2100" fill="${dark}"/>
    <rect x="1980" y="0" width="60" height="2100" fill="${primary}"/>

    <text x="2090" y="240" font-size="28" fill="${textOnPrimary}" opacity="0.7" letter-spacing="4"
          data-editable="true" data-field="cover-tag">WE CREATE</text>
    <text x="2090" y="400" font-size="84" font-weight="700" fill="${textOnPrimary}">
      ${(function () {
        const lines = _brWrap(b.headline, 12);
        return lines.map((line, i) =>
          `<tspan x="2090" dy="${i === 0 ? 0 : 96}" data-editable="true" data-field="cover-bi-headline-${i}">${_BR_ESC(line)}</tspan>`
        ).join("");
      })()}
    </text>

    <text x="2090" y="940" font-size="28" fill="${primary}" font-style="italic">
      ${_brTspans(b.subheadline, 24, 2090, 40, "cover-bi-sub")}
    </text>

    <!-- Cover hero image -->
    ${heroCircle(2475, 1450, 280, support2, primary)}

    <!-- Bottom contact -->
    <g transform="translate(2090, 1880)">
      <g>
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <path d="M5,5 L10,5 L13,11 L9,14 C11,17 14,20 17,22 L20,18 L26,21 L26,26 C17,26 5,14 5,5 Z" fill="${textOnPrimary}" transform="translate(3,3)"/>
        <text x="50" y="26" font-size="20" fill="${textOnPrimary}"
              data-editable="true" data-field="cover-phone">${_BR_ESC(contact.phone)}</text>
      </g>
      <g transform="translate(0, 50)">
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <path d="M5,9 L23,9 L23,19 L5,19 Z M5,9 L14,15 L23,9" stroke="${textOnPrimary}" stroke-width="1.8" fill="none" transform="translate(3,3)"/>
        <text x="50" y="26" font-size="20" fill="${textOnPrimary}"
              data-editable="true" data-field="cover-email">${_BR_ESC(contact.email)}</text>
      </g>
      <g transform="translate(0, 100)">
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <circle cx="18" cy="18" r="9" fill="none" stroke="${textOnPrimary}" stroke-width="1.6" transform="translate(0,0)"/>
        <path d="M9,18 L27,18 M18,9 C21,12 21,24 18,27 C15,24 15,12 18,9" stroke="${textOnPrimary}" stroke-width="1.4" fill="none"/>
        <text x="50" y="26" font-size="20" fill="${textOnPrimary}"
              data-editable="true" data-field="cover-web">${_BR_ESC(contact.website)}</text>
      </g>
    </g>
  </svg>`;

  // INSIDE
  const inside = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2970 2100">
    ${_BR_FONT}
    <rect width="2970" height="2100" fill="${dark}"/>

    <!-- PANEL 5 -->
    ${heroCircle(490, 380, 280, support1, primary)}

    <text x="80" y="800" font-size="28" fill="${primary}" letter-spacing="4"
          data-editable="true" data-field="in-tag">A CREATIVE</text>
    <text x="80" y="900" font-size="56" font-weight="700" fill="${textOnPrimary}">
      ${(function () {
        const lines = _brWrap((profile.industry || "Business") + " That Moves People", 16);
        return lines.map((line, i) =>
          `<tspan x="80" dy="${i === 0 ? 0 : 70}" data-editable="true" data-field="in-h-${i}">${_BR_ESC(line)}</tspan>`
        ).join("");
      })()}
    </text>

    <text x="80" y="1280" font-size="50" font-weight="700" fill="${primary}" letter-spacing="4"
          data-editable="true" data-field="in-svcTitle">${_BR_ESC(String(b.servicesTitle).toUpperCase())}</text>
    <rect x="80" y="1300" width="160" height="8" fill="${primary}"/>

    <text x="80" y="1400" font-size="22" fill="${textOnPrimary}" opacity="0.78">
      ${_brTspans(b.aboutText, 34, 80, 32, "in-svc-intro")}
    </text>

    <!-- 3 services with numbered circles -->
    ${(services || []).slice(0, 3).map((s, i) => `
      <g transform="translate(80, ${1720 + i * 140})">
        <circle cx="36" cy="36" r="36" fill="${primary}"/>
        <text x="36" y="36" text-anchor="middle" dominant-baseline="central" font-size="32" font-weight="700" fill="${textOnPrimary}">${i + 1}</text>
        <text x="100" y="46" font-size="28" font-weight="700" fill="${textOnPrimary}"
              data-editable="true" data-field="in-bi-svc-${i}-name">${_BR_ESC(s.name)}</text>
      </g>
    `).join("")}

    <line x1="990" y1="40" x2="990" y2="2060" stroke="${primary}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.45"/>

    <!-- PANEL 6 -->
    <rect x="990" y="0" width="990" height="2100" fill="${dark}"/>

    <text x="1070" y="200" font-size="52" font-weight="700" fill="${textOnPrimary}" letter-spacing="4"
          data-editable="true" data-field="brochureLabel">BROCHURE</text>
    <text x="1070" y="300" font-size="44" font-weight="700" fill="${primary}"
          data-editable="true" data-field="businessTagLabel">${_BR_ESC(String(profile.industry || "").toUpperCase())} TEMPLATE</text>
    <rect x="1070" y="320" width="120" height="6" fill="${primary}"/>

    <text x="1070" y="420" font-size="22" fill="${textOnPrimary}" opacity="0.78">
      ${_brTspans(b.subheadline, 32, 1070, 32, "in-mid-sub")}
    </text>

    <!-- portrait middle -->
    ${heroCircle(1485, 1000, 240, support2, primary)}

    <!-- mid services -->
    ${(services || []).slice(3, 6).map((s, i) => `
      <g transform="translate(1070, ${1340 + i * 180})">
        <rect x="0" y="0" width="60" height="60" fill="${primary}" rx="8"/>
        <text x="30" y="30" text-anchor="middle" dominant-baseline="central" font-size="32" font-weight="700" fill="${textOnPrimary}">${i + 4}</text>
        <text x="84" y="36" font-size="28" font-weight="700" fill="${textOnPrimary}"
              data-editable="true" data-field="in-mid-svc-${i}-name">${_BR_ESC(s.name)}</text>
        <text x="84" y="76" font-size="20" fill="${textOnPrimary}" opacity="0.75">
          ${_brTspans(s.description, 44, 84, 26, `in-mid-svc-${i}-d`)}
        </text>
      </g>
    `).join("")}

    <line x1="1980" y1="40" x2="1980" y2="2060" stroke="${primary}" stroke-width="1.5" stroke-dasharray="8,10" opacity="0.45"/>

    <!-- PANEL 2: Mission + Success -->
    <rect x="1980" y="0" width="990" height="2100" fill="${dark}"/>

    <rect x="2050" y="180" width="80" height="8" fill="${primary}"/>
    <text x="2050" y="240" font-size="22" fill="${primary}" letter-spacing="4"
          data-editable="true" data-field="missionTag">OUR PURPOSE</text>
    <text x="2050" y="310" font-size="50" font-weight="700" fill="${textOnPrimary}" letter-spacing="3"
          data-editable="true" data-field="missionTitle">OUR MISSION</text>

    <text x="2050" y="400" font-size="20" fill="${textOnPrimary}" opacity="0.78">
      ${_brTspans(b.aboutText, 34, 2050, 28, "mission-text")}
    </text>

    ${(b.whyUsPoints || []).slice(0, 4).map((pt, i) => `
      <g transform="translate(2050, ${780 + i * 80})">
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <path d="M10,18 L15,23 L26,12" stroke="${textOnPrimary}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="58" y="26" font-size="20" fill="${textOnPrimary}" font-weight="600">
          ${_brTspans(pt, 26, 58, 26, `mission-pt-${i}`)}
        </text>
      </g>
    `).join("")}

    <rect x="2050" y="1180" width="80" height="8" fill="${primary}"/>
    <text x="2050" y="1280" font-size="50" font-weight="700" fill="${textOnPrimary}" letter-spacing="3"
          data-editable="true" data-field="successTitle">OUR SUCCESS</text>

    ${(b.whyUsPoints || []).slice(0, 4).map((pt, i) => `
      <g transform="translate(2050, ${1370 + i * 90})">
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <path d="M10,18 L15,23 L26,12" stroke="${textOnPrimary}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <text x="58" y="26" font-size="22" font-weight="700" fill="${textOnPrimary}">
          ${_brTspans(pt, 24, 58, 28, `success-pt-${i}`)}
        </text>
      </g>
    `).join("")}

    <!-- CTA bar -->
    <rect x="2050" y="1900" width="830" height="120" fill="${primary}"/>
    <text x="2465" y="1970" text-anchor="middle" font-size="30" font-weight="700" fill="${textOnPrimary}"
          data-editable="true" data-field="bi-cta">${_BR_ESC(b.ctaText)}</text>
  </svg>`;

  return { outside, inside };
}

const BROCHURE_STYLES = [
  { id: "corporate-structured", name: "Corporate Structured", description: "Clean info-dense layout with charts", generate: _brCorporate },
  { id: "bold-imagery", name: "Bold Imagery", description: "Dark theme with circular hero photos", generate: _brBoldImagery }
];

function generateBrochure(profile, styleId) {
  const style = BROCHURE_STYLES.find(s => s.id === styleId) || BROCHURE_STYLES[0];
  return style.generate(profile);
}
