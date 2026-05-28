const _IN_FONT = `<defs><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;display=swap'); text { font-family: 'DM Sans', system-ui, sans-serif; }</style></defs>`;
const _IN_ESC = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function _inLogo(profile, x, y, size, fill, textColor) {
  const logo = profile.images && profile.images.logo;
  const initial = (profile.businessName || "B").charAt(0).toUpperCase();
  const uid = `in-logo-${Math.round(x)}-${Math.round(y)}-${Math.round(size)}`;
  if (logo) {
    return `
      <defs><clipPath id="${uid}"><rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 5}"/></clipPath></defs>
      <rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 5}" fill="#ffffff"/>
      <image href="${logo}" x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${uid})"/>
    `;
  }
  return `
    <rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size / 5}" fill="${fill}"/>
    <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central"
          font-size="${size * 1.1}" font-weight="700" fill="${textColor}">${_IN_ESC(initial)}</text>
  `;
}

function _inItems(profile) {
  const services = profile.services || [];
  return [
    { desc: services[0] || "Lorem Ipsum Dolor", qty: 1, rate: 50 },
    { desc: services[1] || "Pellentesque id neque ligula", qty: 3, rate: 20 },
    { desc: services[2] || "Interdum et malesuada fames", qty: 2, rate: 10 },
    { desc: services[3] || "Vivamus volutpat faucibus", qty: 1, rate: 90 }
  ];
}

// ============ STYLE 1: Classic Accent (image 8) ============
function _inClassicAccent(profile) {
  const { primary, accent, dark, light, textOnPrimary } = profile.colors;
  const name = profile.businessName, contact = profile.contact || {};
  const inv = profile.invoice || {};
  const items = _inItems(profile);
  const currency = inv.currency || "$";
  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
  const tax = Math.round(subtotal * (inv.taxRate || 0));
  const total = subtotal + tax;
  const fmt = (n) => `${currency}${n.toFixed(2)}`;
  const invNumber = `${inv.prefix || "INV"}-${String(new Date().getFullYear()).slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-001`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2100 2970">
    ${_IN_FONT}
    <rect width="2100" height="2970" fill="#ffffff"/>

    <!-- Header -->
    <g transform="translate(140, 150)">
      ${_inLogo(profile, 60, 60, 55, primary, textOnPrimary)}
      <text x="150" y="50" font-size="44" font-weight="700" fill="${dark}"
            data-editable="true" data-field="businessName">${_IN_ESC(name)}</text>
      <text x="150" y="92" font-size="20" fill="${dark}" opacity="0.6" letter-spacing="4"
            data-editable="true" data-field="tagline">${_IN_ESC(String(profile.tagline || "").toUpperCase())}</text>

      <text x="1820" y="60" text-anchor="end" font-size="96" font-weight="700" fill="${dark}" letter-spacing="8"
            data-editable="true" data-field="invoiceTitle">INVOICE</text>
    </g>

    <!-- Yellow accent bar -->
    <rect x="140" y="350" width="1820" height="70" fill="${primary}"/>
    <rect x="140" y="420" width="1820" height="10" fill="${dark}"/>

    <!-- Bill To & meta -->
    <g transform="translate(140, 530)">
      <text x="0" y="0" font-size="32" font-weight="700" fill="${dark}"
            data-editable="true" data-field="billToLabel">Invoice to:</text>
      <text x="0" y="60" font-size="32" font-weight="700" fill="${dark}"
            data-editable="true" data-field="clientName">Client Name</text>
      <text x="0" y="110" font-size="22" fill="${dark}" opacity="0.75">
        <tspan x="0" dy="0" data-editable="true" data-field="clientAddr-1">123 Dummy Street Area,</tspan>
        <tspan x="0" dy="34" data-editable="true" data-field="clientAddr-2">Location, Lorem Ipsum,</tspan>
        <tspan x="0" dy="34" data-editable="true" data-field="clientAddr-3">570xx59x</tspan>
      </text>

      <g transform="translate(1000, 10)">
        <text x="0" y="0" font-size="26" font-weight="700" fill="${dark}"
              data-editable="true" data-field="invNumLabel">Invoice#</text>
        <text x="780" y="0" text-anchor="end" font-size="26" fill="${dark}"
              data-editable="true" data-field="invNumber">${_IN_ESC(invNumber)}</text>

        <text x="0" y="60" font-size="26" font-weight="700" fill="${dark}"
              data-editable="true" data-field="dateLabel">Date</text>
        <text x="780" y="60" text-anchor="end" font-size="26" fill="${dark}"
              data-editable="true" data-field="dateValue">${_IN_ESC(new Date().toLocaleDateString())}</text>
      </g>
    </g>

    <!-- Items table -->
    <g transform="translate(140, 900)">
      <rect x="0" y="0" width="1820" height="76" fill="${dark}"/>
      <text x="40" y="50" font-size="22" font-weight="700" fill="${textOnPrimary}" letter-spacing="2">SL.</text>
      <text x="160" y="50" font-size="22" font-weight="700" fill="${textOnPrimary}" letter-spacing="2">ITEM DESCRIPTION</text>
      <text x="1180" y="50" font-size="22" font-weight="700" fill="${textOnPrimary}" letter-spacing="2" text-anchor="end">PRICE</text>
      <text x="1430" y="50" font-size="22" font-weight="700" fill="${textOnPrimary}" letter-spacing="2" text-anchor="end">QTY.</text>
      <text x="1780" y="50" font-size="22" font-weight="700" fill="${textOnPrimary}" letter-spacing="2" text-anchor="end">TOTAL</text>

      ${items.map((it, i) => {
        const y = 76 + i * 110;
        return `
        <rect x="0" y="${y}" width="1820" height="110" fill="${i % 2 === 0 ? "#ffffff" : light}"/>
        <text x="40" y="${y + 70}" font-size="24" font-weight="700" fill="${dark}">${i + 1}</text>
        <text x="160" y="${y + 70}" font-size="24" fill="${dark}"
              data-editable="true" data-field="item-${i}-desc">${_IN_ESC(it.desc)}</text>
        <text x="1180" y="${y + 70}" font-size="24" fill="${dark}" text-anchor="end"
              data-editable="true" data-field="item-${i}-rate">${_IN_ESC(fmt(it.rate))}</text>
        <text x="1430" y="${y + 70}" font-size="24" fill="${dark}" text-anchor="end"
              data-editable="true" data-field="item-${i}-qty">${it.qty}</text>
        <text x="1780" y="${y + 70}" font-size="24" font-weight="600" fill="${dark}" text-anchor="end"
              data-editable="true" data-field="item-${i}-amt">${_IN_ESC(fmt(it.qty * it.rate))}</text>
        `;
      }).join("")}

      <line x1="0" y1="${76 + items.length * 110}" x2="1820" y2="${76 + items.length * 110}" stroke="${dark}" stroke-width="1.5" opacity="0.3"/>
    </g>

    <!-- Totals -->
    <g transform="translate(140, ${900 + 76 + items.length * 110 + 50})">
      <text x="1180" y="0" font-size="22" fill="${dark}" font-weight="600" text-anchor="end">Sub Total:</text>
      <text x="1780" y="0" font-size="22" fill="${dark}" font-weight="700" text-anchor="end"
            data-editable="true" data-field="subtotal">${_IN_ESC(fmt(subtotal))}</text>

      <text x="1180" y="48" font-size="22" fill="${dark}" font-weight="600" text-anchor="end">Tax:</text>
      <text x="1780" y="48" font-size="22" fill="${dark}" font-weight="700" text-anchor="end"
            data-editable="true" data-field="tax">${(inv.taxRate * 100 || 0).toFixed(2)}%</text>

      <!-- Yellow total bar -->
      <rect x="900" y="78" width="920" height="80" fill="${primary}"/>
      <text x="1180" y="132" font-size="30" font-weight="700" fill="${dark}" text-anchor="end">Total:</text>
      <text x="1780" y="132" font-size="30" font-weight="700" fill="${dark}" text-anchor="end"
            data-editable="true" data-field="total">${_IN_ESC(fmt(total))}</text>
    </g>

    <!-- Notes & Payment -->
    <g transform="translate(140, ${900 + 76 + items.length * 110 + 280})">
      <text x="0" y="0" font-size="22" font-weight="700" fill="${dark}"
            data-editable="true" data-field="thanksLine">Thank you for your business</text>

      <text x="0" y="68" font-size="22" font-weight="700" fill="${dark}"
            data-editable="true" data-field="termsLabel">Terms &amp; Conditions</text>
      <text x="0" y="108" font-size="18" fill="${dark}" opacity="0.7">
        <tspan x="0" dy="0" data-editable="true" data-field="terms-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce</tspan>
        <tspan x="0" dy="28" data-editable="true" data-field="terms-2">dignissim porta consectetur.</tspan>
      </text>

      <text x="0" y="210" font-size="22" font-weight="700" fill="${dark}"
            data-editable="true" data-field="payInfoLabel">Payment Info:</text>
      <text x="0" y="250" font-size="18" fill="${dark}" opacity="0.85"
            data-editable="true" data-field="bankDetails">${_IN_ESC(inv.bankDetails)}</text>
    </g>

    <!-- Signature -->
    <g transform="translate(1380, ${900 + 76 + items.length * 110 + 450})">
      <line x1="0" y1="0" x2="440" y2="0" stroke="${dark}" stroke-width="2"/>
      <text x="220" y="40" text-anchor="middle" font-size="20" font-weight="700" fill="${dark}"
            data-editable="true" data-field="signLabel">Authorised Sign</text>
    </g>

    <!-- Bottom accent -->
    <rect x="0" y="2820" width="2100" height="8" fill="${primary}"/>
    <text x="1050" y="2890" text-anchor="middle" font-size="20" fill="${dark}" opacity="0.7"
          data-editable="true" data-field="footer">${_IN_ESC([name, contact.phone, contact.email, contact.website].filter(Boolean).join("   |   "))}</text>
  </svg>`;
}

// ============ STYLE 2: Bold Header (image 9) ============
function _inBoldHeader(profile) {
  const { primary, accent, dark, textOnPrimary, light } = profile.colors;
  const name = profile.businessName, contact = profile.contact || {};
  const inv = profile.invoice || {};
  const items = _inItems(profile);
  const currency = inv.currency || "$";
  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
  const tax = Math.round(subtotal * (inv.taxRate || 0));
  const total = subtotal + tax;
  const fmt = (n) => `${currency}${n.toFixed(2)}`;
  const invNumber = `${inv.prefix || "INV"}-${String(new Date().getFullYear()).slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-001`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2100 2970">
    ${_IN_FONT}
    <rect width="2100" height="2970" fill="#ffffff"/>

    <!-- Top brand row -->
    <g transform="translate(140, 150)">
      ${_inLogo(profile, 60, 60, 55, dark, "#ffffff")}
      <text x="150" y="50" font-size="42" font-weight="700" fill="${dark}"
            data-editable="true" data-field="businessName">${_IN_ESC(name)}</text>
      <text x="150" y="92" font-size="18" fill="${dark}" opacity="0.6" letter-spacing="4"
            data-editable="true" data-field="tagline">${_IN_ESC(String(profile.tagline || "").toUpperCase())}</text>

      <text x="1820" y="80" text-anchor="end" font-size="88" font-weight="700" fill="${primary}" letter-spacing="6"
            data-editable="true" data-field="invoiceTitle">INVOICE</text>
    </g>

    <line x1="140" y1="320" x2="1960" y2="320" stroke="${primary}" stroke-width="4"/>

    <!-- Dark bill-to block -->
    <rect x="140" y="380" width="1820" height="200" fill="${dark}"/>
    <text x="200" y="442" font-size="28" font-weight="700" fill="${textOnPrimary}"
          data-editable="true" data-field="billToLabel">Invoice to:</text>
    <text x="200" y="492" font-size="30" font-weight="700" fill="${textOnPrimary}"
          data-editable="true" data-field="clientName">Client Name</text>
    <text x="200" y="534" font-size="18" fill="${textOnPrimary}" opacity="0.75"
          data-editable="true" data-field="clientAddr">123 Dummy Street, Location, City</text>

    <g transform="translate(1300, 432)">
      <text x="0" y="0" font-size="22" font-weight="700" fill="${textOnPrimary}"
            data-editable="true" data-field="invNumLabel">Invoice#</text>
      <text x="540" y="0" text-anchor="end" font-size="22" fill="${textOnPrimary}"
            data-editable="true" data-field="invNumber">${_IN_ESC(invNumber)}</text>

      <text x="0" y="44" font-size="22" font-weight="700" fill="${textOnPrimary}"
            data-editable="true" data-field="dateLabel">Date</text>
      <text x="540" y="44" text-anchor="end" font-size="22" fill="${textOnPrimary}"
            data-editable="true" data-field="dateValue">${_IN_ESC(new Date().toLocaleDateString())}</text>
    </g>

    <!-- Items table -->
    <g transform="translate(140, 680)">
      <text x="40" y="50" font-size="20" font-weight="700" fill="${dark}" opacity="0.7" letter-spacing="2">SL.</text>
      <text x="160" y="50" font-size="20" font-weight="700" fill="${dark}" opacity="0.7" letter-spacing="2">Item Description</text>
      <text x="1180" y="50" font-size="20" font-weight="700" fill="${dark}" opacity="0.7" letter-spacing="2" text-anchor="end">Price</text>
      <text x="1430" y="50" font-size="20" font-weight="700" fill="${dark}" opacity="0.7" letter-spacing="2" text-anchor="end">Qty.</text>
      <text x="1780" y="50" font-size="20" font-weight="700" fill="${dark}" opacity="0.7" letter-spacing="2" text-anchor="end">Total</text>
      <line x1="0" y1="80" x2="1820" y2="80" stroke="${dark}" stroke-width="1.5" opacity="0.3"/>

      ${items.map((it, i) => {
        const y = 80 + i * 100;
        return `
        <text x="40" y="${y + 64}" font-size="22" font-weight="700" fill="${dark}">${i + 1}</text>
        <text x="160" y="${y + 64}" font-size="22" fill="${dark}"
              data-editable="true" data-field="item-${i}-desc">${_IN_ESC(it.desc)}</text>
        <text x="1180" y="${y + 64}" font-size="22" fill="${dark}" text-anchor="end"
              data-editable="true" data-field="item-${i}-rate">${_IN_ESC(fmt(it.rate))}</text>
        <text x="1430" y="${y + 64}" font-size="22" fill="${dark}" text-anchor="end"
              data-editable="true" data-field="item-${i}-qty">${it.qty}</text>
        <text x="1780" y="${y + 64}" font-size="22" font-weight="600" fill="${dark}" text-anchor="end"
              data-editable="true" data-field="item-${i}-amt">${_IN_ESC(fmt(it.qty * it.rate))}</text>
        <line x1="0" y1="${y + 100}" x2="1820" y2="${y + 100}" stroke="${dark}" stroke-width="0.8" opacity="0.15"/>
        `;
      }).join("")}
    </g>

    <!-- Totals + payment -->
    <g transform="translate(140, ${680 + 80 + items.length * 100 + 100})">
      <text x="0" y="0" font-size="22" font-weight="700" fill="${dark}"
            data-editable="true" data-field="thanksLine">Thank you for your business</text>

      <text x="0" y="64" font-size="20" font-weight="700" fill="${dark}"
            data-editable="true" data-field="payInfoLabel">Payment Info:</text>
      <text x="0" y="100" font-size="18" fill="${dark}" opacity="0.85"
            data-editable="true" data-field="bankDetails">${_IN_ESC(inv.bankDetails)}</text>

      <text x="1180" y="0" font-size="20" fill="${dark}" font-weight="600" text-anchor="end">Sub Total:</text>
      <text x="1780" y="0" font-size="20" fill="${dark}" font-weight="700" text-anchor="end"
            data-editable="true" data-field="subtotal">${_IN_ESC(fmt(subtotal))}</text>

      <text x="1180" y="44" font-size="20" fill="${dark}" font-weight="600" text-anchor="end">Tax:</text>
      <text x="1780" y="44" font-size="20" fill="${dark}" font-weight="700" text-anchor="end"
            data-editable="true" data-field="tax">${(inv.taxRate * 100 || 0).toFixed(2)}%</text>

      <line x1="900" y1="70" x2="1820" y2="70" stroke="${dark}" stroke-width="0.8" opacity="0.4"/>

      <text x="1180" y="128" font-size="30" font-weight="700" fill="${primary}" text-anchor="end">Total:</text>
      <text x="1780" y="128" font-size="30" font-weight="700" fill="${primary}" text-anchor="end"
            data-editable="true" data-field="total">${_IN_ESC(fmt(total))}</text>
    </g>

    <!-- Terms & signature -->
    <g transform="translate(140, ${680 + 80 + items.length * 100 + 360})">
      <text x="0" y="0" font-size="20" font-weight="700" fill="${dark}"
            data-editable="true" data-field="termsLabel">Terms &amp; Conditions</text>
      <text x="0" y="40" font-size="16" fill="${dark}" opacity="0.7">
        <tspan x="0" dy="0" data-editable="true" data-field="terms-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque magna</tspan>
        <tspan x="0" dy="24" data-editable="true" data-field="terms-2">vitae diam vehicula. Fusce dignissim porta consectetur.</tspan>
      </text>

      <g transform="translate(1380, 40)">
        <line x1="0" y1="0" x2="440" y2="0" stroke="${dark}" stroke-width="2"/>
        <text x="220" y="38" text-anchor="middle" font-size="18" font-weight="700" fill="${dark}"
              data-editable="true" data-field="signLabel">Authorised Sign</text>
      </g>
    </g>

    <!-- Bottom -->
    <rect x="0" y="2810" width="2100" height="80" fill="${dark}"/>
    <text x="1050" y="2862" text-anchor="middle" font-size="20" fill="${textOnPrimary}" opacity="0.9"
          data-editable="true" data-field="footer">${_IN_ESC([name, contact.phone, contact.email, contact.website].filter(Boolean).join("   |   "))}</text>
  </svg>`;
}

const INVOICE_STYLES = [
  { id: "classic-accent", name: "Classic Accent", description: "Light layout with accent total bar", generate: _inClassicAccent },
  { id: "bold-header", name: "Bold Header", description: "Dark bill-to block with red total", generate: _inBoldHeader }
];

function generateInvoice(profile, styleId) {
  const style = INVOICE_STYLES.find(s => s.id === styleId) || INVOICE_STYLES[0];
  return style.generate(profile);
}
