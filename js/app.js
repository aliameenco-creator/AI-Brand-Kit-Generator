(function () {
  const state = {
    brandProfile: null,
    selected: [],
    activeStyle: {},   // { 'business-card': 'classic-light', ... }
    currentTab: null,
    currentSub: null,
    editor: null
  };

  const ASSET_LABELS = {
    "business-card": "Business Card",
    "letterhead": "Letterhead",
    "brochure": "Brochure",
    "invoice": "Invoice"
  };

  const ASSET_SUB_TOGGLES = {
    "business-card": [{ key: "front", label: "Front" }, { key: "back", label: "Back" }],
    "brochure": [{ key: "outside", label: "Outside" }, { key: "inside", label: "Inside" }]
  };

  // Maps asset key -> { styleListVar, profileKey, generatorFn }
  const ASSET_REGISTRY = {
    "business-card": { styles: () => BUSINESS_CARD_STYLES, generate: generateBusinessCard, profileKey: "businessCard" },
    "letterhead":    { styles: () => LETTERHEAD_STYLES,    generate: generateLetterhead,    profileKey: "letterhead" },
    "brochure":      { styles: () => BROCHURE_STYLES,      generate: generateBrochure,      profileKey: "brochure" },
    "invoice":       { styles: () => INVOICE_STYLES,       generate: generateInvoice,       profileKey: "invoice" }
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("generate-btn").addEventListener("click", generateBrandKit);
    document.getElementById("url-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") generateBrandKit();
    });
    document.getElementById("summary-toggle").addEventListener("click", () => {
      document.getElementById("brand-summary").classList.toggle("collapsed");
    });
    document.getElementById("error-dismiss").addEventListener("click", hideError);
    document.getElementById("export-png").addEventListener("click", () => exportCurrent("png"));
    document.getElementById("export-jpg").addEventListener("click", () => exportCurrent("jpg"));
  });

  function getSelectedAssets() {
    return Array.from(document.querySelectorAll('input[name="asset"]:checked')).map(el => el.value);
  }

  function validateUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (e) { return false; }
  }

  function showError(msg) {
    document.getElementById("error-message").textContent = msg;
    document.getElementById("error-banner").classList.remove("hidden");
  }

  function hideError() {
    document.getElementById("error-banner").classList.add("hidden");
  }

  function setProgressStep(step, status) {
    document.getElementById("progress-section").classList.remove("hidden");
    document.querySelectorAll(".progress-step").forEach((el) => {
      const s = parseInt(el.getAttribute("data-step"), 10);
      el.classList.remove("active", "complete");
      if (s < step) el.classList.add("complete");
      else if (s === step) el.classList.add(status === "done" ? "complete" : "active");
    });
  }

  function hideProgress() {
    document.getElementById("progress-section").classList.add("hidden");
  }

  async function generateBrandKit() {
    hideError();
    const url = document.getElementById("url-input").value.trim();
    const selected = getSelectedAssets();

    if (!validateUrl(url)) {
      showError("Please enter a valid website URL (must start with http:// or https://)");
      return;
    }
    if (selected.length === 0) {
      showError("Please select at least one asset to generate");
      return;
    }
    if (CONFIG.FIRECRAWL_API_KEY === "YOUR_FIRECRAWL_API_KEY" || CONFIG.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
      showError("Add your Firecrawl and Gemini API keys in config.js before generating.");
      return;
    }

    const btn = document.getElementById("generate-btn");
    btn.disabled = true;
    btn.textContent = "Generating...";

    document.getElementById("results-section").classList.add("hidden");
    document.getElementById("brand-summary").classList.add("hidden");
    state.selected = selected;

    try {
      setProgressStep(1, "active");
      const raw = await scrapeWebsite(url);

      setProgressStep(2, "active");
      const rawBrand = extractBrandData(raw, url);
      console.log("Extracted raw brand data:", rawBrand);

      const profile = await processBrandData(rawBrand);
      profile.sourceUrl = url;
      console.log("Gemini brand profile:", profile);

      // Resolve images (CORS-permitting) so templates can embed them
      await resolveBrandImages(profile);
      console.log("Loaded images:", {
        logo: !!profile.images.logo,
        hero: !!profile.images.hero,
        supporting: profile.images.supporting.length
      });

      state.brandProfile = profile;
      window.brandProfile = profile;
      renderBrandSummary(profile);

      // Seed active styles from AI recommendation
      state.activeStyle = {
        "business-card": profile.styles.businessCard,
        "letterhead": profile.styles.letterhead,
        "brochure": profile.styles.brochure,
        "invoice": profile.styles.invoice
      };

      setProgressStep(3, "active");
      // brief delay so the UI shows the third step animating
      await new Promise(r => setTimeout(r, 150));
      setProgressStep(3, "done");

      renderTabs(selected);
      setActiveAsset(selected[0]);

      hideProgress();
      document.getElementById("results-section").classList.remove("hidden");

      const hint = document.getElementById("preview-hint");
      hint.classList.add("visible");
      setTimeout(() => hint.classList.remove("visible"), 4000);
    } catch (err) {
      console.error(err);
      hideProgress();
      showError(err.message || "Something went wrong. Please try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate ▶";
    }
  }

  function renderBrandSummary(profile) {
    const summaryEl = document.getElementById("brand-summary");
    const contentEl = document.getElementById("summary-content");
    const colors = profile.colors;
    const swatches = ["primary", "secondary", "accent", "dark", "light"]
      .map(k => `<span class="swatch" style="background:${colors[k]}" title="${k}: ${colors[k]}"></span>`)
      .join("");

    contentEl.innerHTML = `
      <div class="summary-item"><div class="key">Name</div><div class="val">${escapeHtml(profile.businessName)}</div></div>
      <div class="summary-item"><div class="key">Industry</div><div class="val">${escapeHtml(profile.industry)}</div></div>
      <div class="summary-item"><div class="key">Tagline</div><div class="val">"${escapeHtml(profile.tagline)}"</div></div>
      <div class="summary-item"><div class="key">Colors</div><div class="color-swatches">${swatches}</div></div>
    `;
    summaryEl.classList.remove("hidden", "collapsed");
  }

  function renderTabs(selected) {
    const tabsEl = document.getElementById("asset-tabs");
    tabsEl.innerHTML = "";
    selected.forEach(key => {
      const btn = document.createElement("button");
      btn.className = "tab";
      btn.textContent = ASSET_LABELS[key];
      btn.dataset.asset = key;
      btn.addEventListener("click", () => setActiveAsset(key));
      tabsEl.appendChild(btn);
    });
  }

  function setActiveAsset(assetKey) {
    state.currentTab = assetKey;
    document.querySelectorAll("#asset-tabs .tab").forEach(t => {
      t.classList.toggle("active", t.dataset.asset === assetKey);
    });

    // Sub toggles
    const subToggles = ASSET_SUB_TOGGLES[assetKey];
    const subEl = document.getElementById("sub-toggle");
    subEl.innerHTML = "";
    if (subToggles) {
      subEl.classList.remove("hidden");
      subToggles.forEach((sub, i) => {
        const b = document.createElement("button");
        b.textContent = sub.label;
        b.dataset.sub = sub.key;
        if (i === 0) b.classList.add("active");
        b.addEventListener("click", () => setActiveSub(sub.key));
        subEl.appendChild(b);
      });
      state.currentSub = subToggles[0].key;
    } else {
      subEl.classList.add("hidden");
      state.currentSub = "single";
    }

    renderStylePicker(assetKey);
    renderActivePreview();
  }

  function setActiveSub(subKey) {
    state.currentSub = subKey;
    document.querySelectorAll("#sub-toggle button").forEach(b => {
      b.classList.toggle("active", b.dataset.sub === subKey);
    });
    renderActivePreview();
  }

  function renderStylePicker(assetKey) {
    const registry = ASSET_REGISTRY[assetKey];
    const pickerEl = document.getElementById("style-picker");
    const stripEl = document.getElementById("style-strip");
    const hintEl = document.getElementById("style-picker-hint");

    const styles = registry.styles();
    pickerEl.classList.remove("hidden");
    stripEl.innerHTML = "";

    const aiChoice = state.brandProfile && state.brandProfile.styles
      && state.brandProfile.styles[registry.profileKey];

    styles.forEach(style => {
      const card = document.createElement("div");
      card.className = "style-card";
      if (state.activeStyle[assetKey] === style.id) card.classList.add("active");
      card.dataset.styleId = style.id;

      // Build thumbnail: render the variant at small size using the brand profile.
      const variantSvg = generateThumbnail(registry, style, state.brandProfile);

      card.innerHTML = `
        <div class="thumb">
          ${aiChoice === style.id ? '<div class="ai-badge">AI PICK</div>' : ""}
          ${variantSvg}
        </div>
        <div class="style-name">${escapeHtml(style.name)}</div>
        <div class="style-desc">${escapeHtml(style.description || "")}</div>
      `;

      card.addEventListener("click", () => {
        state.activeStyle[assetKey] = style.id;
        // update active state
        document.querySelectorAll("#style-strip .style-card").forEach(c => {
          c.classList.toggle("active", c.dataset.styleId === style.id);
        });
        renderActivePreview();
      });

      stripEl.appendChild(card);
    });

    hintEl.textContent = aiChoice
      ? `AI recommended "${(styles.find(s => s.id === aiChoice) || {}).name || aiChoice}" based on your industry`
      : "";
  }

  function generateThumbnail(registry, style, profile) {
    if (!profile) return "";
    try {
      const result = style.generate(profile);
      // result can be a string or { front, back } / { outside, inside } / { single }
      if (typeof result === "string") return result;
      return result.front || result.outside || result.single || Object.values(result)[0] || "";
    } catch (e) {
      console.warn("Thumbnail render failed for", style.id, e);
      return "";
    }
  }

  function renderActivePreview() {
    const assetKey = state.currentTab;
    if (!assetKey || !state.brandProfile) return;
    const registry = ASSET_REGISTRY[assetKey];
    const styleId = state.activeStyle[assetKey];
    const result = registry.generate(state.brandProfile, styleId);

    const svgString = typeof result === "string"
      ? result
      : (result[state.currentSub] || result.single || result.front || result.outside || Object.values(result)[0]);

    const stage = document.getElementById("preview-stage");
    stage.innerHTML = svgString;
    const svgEl = stage.querySelector("svg");
    if (svgEl) state.editor = new InlineEditor(stage);
  }

  async function exportCurrent(format) {
    const stage = document.getElementById("preview-stage");
    const svgEl = stage.querySelector("svg");
    if (!svgEl) { showError("Nothing to export yet."); return; }
    const name = (state.brandProfile && state.brandProfile.businessName) || "brand";
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "brand";
    const part = state.currentSub && state.currentSub !== "single" ? `-${state.currentSub}` : "";
    const styleSuffix = state.activeStyle[state.currentTab] ? `-${state.activeStyle[state.currentTab]}` : "";
    const filename = `${slug}-${state.currentTab}${styleSuffix}${part}`;
    try {
      await exportAsImage(svgEl, format, filename);
    } catch (err) {
      console.error(err);
      showError(err.message || "Export failed.");
    }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
