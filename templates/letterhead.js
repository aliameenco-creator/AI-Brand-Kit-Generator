function _LH_FONT(profile) {
  const fam = (profile && profile.typography && profile.typography.fontFamily) || "DM Sans";
  const safe = String(fam).replace(/[<>"']/g, "");
  const importFam = encodeURIComponent(safe).replace(/%20/g, "+");
  return `<defs><style>@import url('https://fonts.googleapis.com/css2?family=${importFam}:wght@400;500;600;700;800&amp;display=swap'); text { font-family: '${safe}', system-ui, sans-serif; }</style></defs>`;
}
const _LH_ESC = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function _lhLogo(profile, x, y, size, fill, textColor) {
  const logo = profile.images && profile.images.logo;
  const initial = (profile.businessName || "B").charAt(0).toUpperCase();
  if (logo) {
    const uid = `lh-logo-${Math.round(x)}-${Math.round(y)}-${Math.round(size)}`;
    return `
      <defs><clipPath id="${uid}"><rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 4}"/></clipPath></defs>
      <rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 4}" fill="#ffffff"/>
      <image href="${logo}" x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${uid})"/>
    `;
  }
  return `
    <rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 4}" fill="${fill}"/>
    <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central"
          font-size="${size * 1.1}" font-weight="700" fill="${textColor}">${_LH_ESC(initial)}</text>
  `;
}

// ============ STYLE 1: Geometric Accent (image 4) ============
function _lhGeometric(profile) {
  const { primary, accent, dark, textOnPrimary } = profile.colors;
  const name = profile.businessName, tagline = profile.tagline || "";
  const contact = profile.contact || {};

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2100 2970">
    ${_LH_FONT(profile)}
    <rect width="2100" height="2970" fill="#ffffff"/>

    <!-- Top-right geometric shapes -->
    <path d="M 2100 0 L 2100 320 L 1780 0 Z" fill="${primary}"/>
    <path d="M 1820 0 L 2100 280 L 2100 420 L 1720 0 Z" fill="${dark}"/>
    <circle cx="1700" cy="240" r="10" fill="${primary}"/>
    <circle cx="1750" cy="240" r="10" fill="${primary}"/>
    <line x1="1700" y1="240" x2="1450" y2="240" stroke="${primary}" stroke-width="4"/>

    <!-- Top-left logo block -->
    <g transform="translate(160, 180)">
      ${_lhLogo(profile, 80, 80, 70, primary, textOnPrimary)}
      <text x="200" y="60" font-size="56" font-weight="700" fill="${dark}" letter-spacing="3"
            data-editable="true" data-field="businessName">${_LH_ESC(String(name).toUpperCase())}</text>
      <text x="200" y="120" font-size="22" fill="${dark}" opacity="0.6" letter-spacing="4"
            data-editable="true" data-field="tagline">${_LH_ESC(String(tagline).toUpperCase())}</text>
    </g>

    <!-- Recipient block + DATE -->
    <g transform="translate(160, 540)">
      <text x="0" y="0" font-size="28" font-weight="700" fill="${primary}" letter-spacing="3"
            data-editable="true" data-field="recipientName">RECIPIENT NAME</text>
      <text x="0" y="42" font-size="20" fill="${dark}" opacity="0.65" letter-spacing="3"
            data-editable="true" data-field="recipientTitle">TITLE / COMPANY</text>
      <line x1="0" y1="70" x2="500" y2="70" stroke="${dark}" stroke-width="1.5" opacity="0.25"/>

      <text x="0" y="130" font-size="22" font-weight="700" fill="${dark}">PHONE:</text>
      <text x="160" y="130" font-size="22" fill="${dark}" opacity="0.85"
            data-editable="true" data-field="phone">${_LH_ESC(contact.phone)}</text>

      <text x="0" y="172" font-size="22" font-weight="700" fill="${dark}">WEB:</text>
      <text x="160" y="172" font-size="22" fill="${dark}" opacity="0.85"
            data-editable="true" data-field="website">${_LH_ESC(contact.website)}</text>

      <text x="0" y="214" font-size="22" font-weight="700" fill="${dark}">EMAIL:</text>
      <text x="160" y="214" font-size="22" fill="${dark}" opacity="0.85"
            data-editable="true" data-field="email">${_LH_ESC(contact.email)}</text>

      <text x="0" y="256" font-size="22" font-weight="700" fill="${dark}">ADDRESS:</text>
      <text x="0" y="298" font-size="20" fill="${dark}" opacity="0.85"
            data-editable="true" data-field="address">${_LH_ESC(contact.address)}</text>

      <text x="1700" y="0" font-size="22" font-weight="700" fill="${primary}" text-anchor="end" letter-spacing="3"
            data-editable="true" data-field="dateLabel">DATE | ${_LH_ESC(new Date().toLocaleDateString())}</text>
    </g>

    <!-- Decorative side stripe -->
    <rect x="100" y="1080" width="8" height="1100" fill="${primary}"/>
    <rect x="124" y="1080" width="8" height="1100" fill="${dark}"/>

    <!-- Body text — wrap-mode editable block -->
    <g transform="translate(180, 1130)">
      <text font-size="28" fill="${dark}" opacity="0.85"
            data-editable="true" data-wrap="true" data-wrap-chars="68" data-line-height="44" data-wrap-x="0" data-field="bodyText">
        <tspan x="0" dy="0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor</tspan>
        <tspan x="0" dy="44">incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices</tspan>
        <tspan x="0" dy="44">gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.</tspan>
        <tspan x="0" dy="88">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor</tspan>
        <tspan x="0" dy="44">incididunt ut labore et dolore magna aliqua.</tspan>
        <tspan x="0" dy="88">Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas</tspan>
        <tspan x="0" dy="44">accumsan lacus vel facilisis. Sed do eiusmod tempor incididunt.</tspan>
      </text>
    </g>

    <!-- Signature -->
    <g transform="translate(180, 2400)">
      <path d="M 0 40 Q 80 0 160 30 T 320 20" stroke="${primary}" stroke-width="4" fill="none"/>
      <line x1="0" y1="90" x2="400" y2="90" stroke="${dark}" stroke-width="2"/>
      <text x="0" y="135" font-size="26" font-weight="700" fill="${dark}"
            data-editable="true" data-field="signatureName">${_LH_ESC(profile.people && profile.people.ownerName)}</text>
      <text x="0" y="165" font-size="20" fill="${dark}" opacity="0.65" letter-spacing="3"
            data-editable="true" data-field="signatureTitle">${_LH_ESC(String((profile.people && profile.people.ownerTitle) || "").toUpperCase())}</text>
    </g>

    <!-- Bottom geometric shapes -->
    <path d="M 0 2970 L 0 2700 L 320 2970 Z" fill="${primary}"/>
    <path d="M 280 2970 L 0 2680 L 0 2580 L 380 2970 Z" fill="${dark}"/>
    <path d="M 2100 2970 L 2100 2820 L 1950 2970 Z" fill="${primary}"/>

    <!-- Footer info -->
    <g transform="translate(500, 2790)">
      <g>
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <path d="M5,5 L10,5 L13,11 L9,14 C11,17 14,20 17,22 L20,18 L25,21 L25,25 C16,25 5,14 5,5 Z" fill="#ffffff" transform="scale(1) translate(4,4)"/>
        <text x="50" y="27" font-size="22" fill="${dark}"
              data-editable="true" data-field="footerPhone">${_LH_ESC(contact.phone)}</text>
      </g>
      <g transform="translate(500, 0)">
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <circle cx="18" cy="18" r="9" fill="none" stroke="#ffffff" stroke-width="2"/>
        <path d="M9,18 L27,18 M18,9 C21,12 21,24 18,27 C15,24 15,12 18,9" stroke="#ffffff" stroke-width="1.6" fill="none"/>
        <text x="50" y="27" font-size="22" fill="${dark}"
              data-editable="true" data-field="footerWeb">${_LH_ESC(contact.website)}</text>
      </g>
      <g transform="translate(1000, 0)">
        <circle cx="18" cy="18" r="18" fill="${primary}"/>
        <path d="M18,7 C24,13 24,23 18,29 C12,23 12,13 18,7 Z" fill="#ffffff"/>
        <text x="50" y="27" font-size="18" fill="${dark}"
              data-editable="true" data-field="footerAddress">${_LH_ESC(contact.address)}</text>
      </g>
    </g>
  </svg>`;
}

// ============ STYLE 2: Clean Modern (image 5) ============
function _lhCleanModern(profile) {
  const { primary, accent, dark, textOnPrimary } = profile.colors;
  const name = profile.businessName, tagline = profile.tagline || "";
  const contact = profile.contact || {};
  const owner = profile.people || {};

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2100 2970">
    ${_LH_FONT(profile)}
    <rect width="2100" height="2970" fill="#ffffff"/>

    <!-- Top decorative triangles -->
    <path d="M 1400 0 L 2100 0 L 2100 320 Z" fill="${dark}"/>
    <path d="M 1620 0 L 2100 0 L 2100 230 Z" fill="${primary}"/>
    <path d="M 1750 0 L 2100 0 L 2100 140 Z" fill="${accent}" opacity="0.6"/>

    <!-- Date pill -->
    <text x="1880" y="190" text-anchor="end" font-size="22" fill="${textOnPrimary}" font-weight="700" letter-spacing="3"
          data-editable="true" data-field="dateLabel">DATE:</text>
    <text x="1880" y="234" text-anchor="end" font-size="30" font-weight="700" fill="${textOnPrimary}"
          data-editable="true" data-field="dateValue">${_LH_ESC(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }))}</text>

    <!-- Logo + name (centered left) -->
    <g transform="translate(200, 230)">
      ${_lhLogo(profile, 80, 80, 70, primary, textOnPrimary)}
      <text x="80" y="220" text-anchor="middle" font-size="32" font-weight="700" fill="${dark}" letter-spacing="4"
            data-editable="true" data-field="businessName">${_LH_ESC(String(name).toUpperCase())}</text>
      <text x="80" y="252" text-anchor="middle" font-size="16" fill="${dark}" opacity="0.6" letter-spacing="3"
            data-editable="true" data-field="tagline">${_LH_ESC(String(tagline).toUpperCase())}</text>
    </g>

    <!-- Recipient sidebar -->
    <g transform="translate(180, 680)">
      <text x="0" y="0" font-size="24" fill="${dark}" font-weight="500" letter-spacing="3"
            data-editable="true" data-field="toLabel">TO,</text>
      <text x="0" y="64" font-size="40" font-weight="700" fill="${primary}"
            data-editable="true" data-field="recipientName">RECIPIENT</text>
      <text x="0" y="100" font-size="20" fill="${dark}" opacity="0.7"
            data-editable="true" data-field="recipientTitle">Title / Role</text>

      <g transform="translate(0, 170)">
        <circle cx="16" cy="16" r="16" fill="${primary}"/>
        <path d="M5,5 L10,5 L13,11 L9,14 C11,17 14,20 17,22 L20,18 L26,21 L26,26 C17,26 5,14 5,5 Z" fill="#ffffff" transform="scale(0.9) translate(2,2)"/>
        <text x="50" y="24" font-size="20" fill="${dark}"
              data-editable="true" data-field="phone">${_LH_ESC(contact.phone)}</text>
      </g>
      <g transform="translate(0, 220)">
        <circle cx="16" cy="16" r="16" fill="${primary}"/>
        <path d="M4,7 L20,7 L20,17 L4,17 Z M4,7 L12,13 L20,7" stroke="#ffffff" stroke-width="1.6" fill="none" transform="scale(1) translate(4,7)"/>
        <text x="50" y="24" font-size="20" fill="${dark}"
              data-editable="true" data-field="website">${_LH_ESC(contact.website)}</text>
      </g>
      <g transform="translate(0, 270)">
        <circle cx="16" cy="16" r="16" fill="${primary}"/>
        <path d="M12,5 C16,9 16,15 12,19 C8,15 8,9 12,5 Z" fill="#ffffff" transform="scale(1) translate(4,4)"/>
        <text x="50" y="24" font-size="18" fill="${dark}"
              data-editable="true" data-field="address">${_LH_ESC(contact.address)}</text>
      </g>

      <!-- Vertical divider -->
      <line x1="420" y1="-50" x2="420" y2="1620" stroke="${dark}" stroke-width="2" opacity="0.35"/>
    </g>

    <!-- Body — wrap-mode editable block -->
    <g transform="translate(660, 680)">
      <text x="0" y="0" font-size="34" font-weight="700" fill="${dark}"
            data-editable="true" data-field="greeting">Dear Sir,</text>
      <text font-size="26" fill="${dark}" opacity="0.85"
            data-editable="true" data-wrap="true" data-wrap-chars="50" data-line-height="42" data-wrap-x="0" data-field="bodyText">
        <tspan x="0" dy="110">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do</tspan>
        <tspan x="0" dy="42">eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut</tspan>
        <tspan x="0" dy="42">enim ad minim veniam, quis nostrud exercitation ullamco laboris.</tspan>
        <tspan x="0" dy="84">Duis aute irure dolor in reprehenderit in voluptate velit esse</tspan>
        <tspan x="0" dy="42">cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat</tspan>
        <tspan x="0" dy="42">cupidatat non proident, sunt in culpa qui officia deserunt mollit.</tspan>
      </text>
    </g>

    <!-- Sign-off -->
    <g transform="translate(180, 2300)">
      <text x="0" y="0" font-size="24" fill="${dark}" letter-spacing="3"
            data-editable="true" data-field="fromLabel">FROM,</text>
      <text x="0" y="64" font-size="42" font-weight="700" fill="${primary}"
            data-editable="true" data-field="ownerName">${_LH_ESC(String(owner.ownerName).toUpperCase())}</text>
      <text x="0" y="100" font-size="22" fill="${dark}" opacity="0.7"
            data-editable="true" data-field="ownerTitle">${_LH_ESC(owner.ownerTitle)}</text>
    </g>

    <g transform="translate(1500, 2300)">
      <path d="M 0 60 Q 80 20 160 50 T 320 40" stroke="${primary}" stroke-width="4" fill="none"/>
      <line x1="0" y1="120" x2="380" y2="120" stroke="${dark}" stroke-width="2" opacity="0.4"/>
      <text x="190" y="160" text-anchor="middle" font-size="20" fill="${dark}" opacity="0.65" letter-spacing="5">SIGNATURE</text>
    </g>

    <!-- Bottom decorative shapes -->
    <path d="M 0 2970 L 700 2970 L 0 2680 Z" fill="${dark}"/>
    <path d="M 0 2970 L 530 2970 L 0 2760 Z" fill="${primary}"/>
    <path d="M 0 2970 L 320 2970 L 0 2850 Z" fill="${accent}" opacity="0.6"/>

    <!-- Footer info -->
    <g transform="translate(800, 2800)">
      <g>
        <circle cx="20" cy="20" r="20" fill="${primary}"/>
        <path d="M9,7 L19,7 L19,18 L9,18 Z M9,7 L14,12 L19,7" stroke="#ffffff" stroke-width="2" fill="none" transform="translate(3,5)"/>
        <text x="56" y="28" font-size="22" fill="${dark}"
              data-editable="true" data-field="footerEmail">${_LH_ESC(contact.email)}</text>
      </g>
      <g transform="translate(420, 0)">
        <circle cx="20" cy="20" r="20" fill="${primary}"/>
        <path d="M5,5 L10,5 L13,11 L9,14 C11,17 14,20 17,22 L20,18 L25,21 L25,25 C16,25 5,14 5,5 Z" fill="#ffffff" transform="translate(4,4)"/>
        <text x="56" y="28" font-size="22" fill="${dark}"
              data-editable="true" data-field="footerPhone">${_LH_ESC(contact.phone)}</text>
      </g>
      <g transform="translate(840, 0)">
        <circle cx="20" cy="20" r="20" fill="${primary}"/>
        <path d="M14,7 C20,13 20,23 14,29 C8,23 8,13 14,7 Z" fill="#ffffff" transform="translate(4,1)"/>
        <text x="56" y="28" font-size="18" fill="${dark}"
              data-editable="true" data-field="footerAddress">${_LH_ESC(contact.address)}</text>
      </g>
    </g>
  </svg>`;
}

const LETTERHEAD_STYLES = [
  { id: "geometric-accent", name: "Geometric Accent", description: "Bold corner shapes and accent stripe", generate: _lhGeometric },
  { id: "clean-modern", name: "Clean Modern", description: "Minimalist sidebar layout with signature", generate: _lhCleanModern }
];

function generateLetterhead(profile, styleId) {
  const style = LETTERHEAD_STYLES.find(s => s.id === styleId) || LETTERHEAD_STYLES[0];
  return style.generate(profile);
}
