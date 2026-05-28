(function () {
  const state = {
    brandProfile: null,
    selected: [],
    activeStyle: {},
    currentTab: null,
    currentSub: null,
    editor: null,
    customLogo: ""  // base64 data URI of user-uploaded logo (overrides scraped)
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

    // Custom logo upload
    document.getElementById("logo-upload").addEventListener("change", handleLogoUpload);
    document.getElementById("clear-logo-btn").addEventListener("click", clearCustomLogo);

    // AI Refine
    document.getElementById("refine-btn").addEventListener("click", handleRefine);
    document.getElementById("refine-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleRefine();
    });
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
  function hideError() { document.getElementById("error-banner").classList.add("hidden"); }

  function setProgressStep(step, status) {
    document.getElementById("progress-section").classList.remove("hidden");
    document.querySelectorAll(".progress-step").forEach((el) => {
      const s = parseInt(el.getAttribute("data-step"), 10);
      el.classList.remove("active", "complete");
      if (s < step) el.classList.add("complete");
      else if (s === step) el.classList.add(status === "done" ? "complete" : "active");
    });
  }
  function hideProgress() { document.getElementById("progress-section").classList.add("hidden"); }

  // ============ FONT LOADING ============
  function ensureGoogleFontLoaded(fontFamily) {
    if (!fontFamily) return Promise.resolve();
    const id = `gfont-${fontFamily.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return waitForFont(fontFamily);
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
    return waitForFont(fontFamily);
  }

  function waitForFont(fontFamily) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      document.fonts.load(`400 16px "${fontFamily}"`).then(() => document.fonts.load(`700 16px "${fontFamily}"`)),
      new Promise(r => setTimeout(r, 4000))
    ]).then(() => {});
  }

  // ============ MAIN FLOW ============
  async function generateBrandKit() {
    hideError();
    const url = document.getElementById("url-input").value.trim();
    const selected = getSelectedAssets();

    if (!validateUrl(url)) { showError("Please enter a valid website URL (must start with http:// or https://)"); return; }
    if (selected.length === 0) { showError("Please select at least one asset to generate"); return; }
    if (CONFIG.FIRECRAWL_API_KEY === "YOUR_FIRECRAWL_API_KEY" || CONFIG.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
      showError("Add your Firecrawl and Gemini API keys in config.js before generating."); return;
    }

    const btn = document.getElementById("generate-btn");
    btn.disabled = true;
    btn.textContent = "Generating...";

    document.getElementById("results-section").classList.add("hidden");
    document.getElementById("brand-summary").classList.add("hidden");
    state.selected = selected;
    state.customLogo = ""; // reset custom logo on new generation

    try {
      setProgressStep(1, "active");
      const raw = await scrapeWebsite(url);

      setProgressStep(2, "active");
      const rawBrand = extractBrandData(raw, url);
      console.log("Extracted raw brand data:", rawBrand);

      const profile = await processBrandData(rawBrand);
      profile.sourceUrl = url;
      profile._firecrawlScreenshot = rawBrand.screenshotUrl || "";
      console.log("Gemini brand profile:", profile);

      // Load the scraped/AI-picked font in parallel with image loading
      const [_, __] = await Promise.all([
        ensureGoogleFontLoaded(profile.typography && profile.typography.fontFamily),
        resolveBrandImages(profile)
      ]);
      console.log("Loaded images:", {
        logo: !!profile.images.logo,
        hero: !!profile.images.hero,
        supporting: profile.images.supporting.length
      });
      console.log("Font:", profile.typography && profile.typography.fontFamily);

      state.brandProfile = profile;
      window.brandProfile = profile;
      renderBrandSummary(profile);

      state.activeStyle = {
        "business-card": profile.styles.businessCard,
        "letterhead": profile.styles.letterhead,
        "brochure": profile.styles.brochure,
        "invoice": profile.styles.invoice
      };

      setProgressStep(3, "active");
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
    const hintEl = document.getElementById("brand-toolbar-hint");
    const colors = profile.colors;
    const swatches = ["primary", "secondary", "accent", "dark", "light"]
      .map(k => `<span class="swatch" style="background:${colors[k]}" title="${k}: ${colors[k]}"></span>`)
      .join("");
    const fontName = (profile.typography && profile.typography.fontFamily) || "DM Sans";

    contentEl.innerHTML = `
      <div class="summary-item"><div class="key">Name</div><div class="val">${escapeHtml(profile.businessName)}</div></div>
      <div class="summary-item"><div class="key">Industry</div><div class="val">${escapeHtml(profile.industry)}</div></div>
      <div class="summary-item"><div class="key">Tagline</div><div class="val">"${escapeHtml(profile.tagline)}"</div></div>
      <div class="summary-item"><div class="key">Colors</div><div class="color-swatches">${swatches}</div></div>
      <div class="summary-item"><div class="key">Font</div><div class="val" style="font-family:'${escapeHtml(fontName)}',system-ui,sans-serif">${escapeHtml(fontName)}</div></div>
      <div class="summary-item"><div class="key">Logo</div><div class="val">${profile.images.logo ? "✓ Scraped from site" : "Monogram fallback (upload custom)"}</div></div>
    `;
    hintEl.textContent = profile.images.logo
      ? "Scraped logo is being used. Upload to override."
      : "No logo found on the site — upload one for best results.";
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
    // Reset refine input each tab switch
    document.getElementById("refine-input").value = "";
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

  // ============ CUSTOM LOGO UPLOAD ============
  async function handleLogoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showError("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { showError("Logo file is too large (max 5MB)."); return; }
    const dataUri = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error("Could not read file"));
      fr.readAsDataURL(file);
    });
    state.customLogo = dataUri;
    if (state.brandProfile) {
      state.brandProfile.images.logo = dataUri;
      // Also re-render style picker thumbnails so they pick up the new logo
      renderStylePicker(state.currentTab);
      renderActivePreview();
    }
    document.getElementById("brand-toolbar-hint").textContent = "Custom logo applied to all assets.";
    e.target.value = ""; // allow re-uploading the same file later
  }

  function clearCustomLogo() {
    if (!state.brandProfile) return;
    state.customLogo = "";
    // restore from the scraped imagery (re-resolve from data URI cache)
    if (state.brandProfile.imagery && state.brandProfile.imagery.logoUrl) {
      loadImageAsDataUri(state.brandProfile.imagery.logoUrl).then(uri => {
        state.brandProfile.images.logo = uri || "";
        renderStylePicker(state.currentTab);
        renderActivePreview();
        document.getElementById("brand-toolbar-hint").textContent = uri
          ? "Reverted to scraped logo."
          : "No scraped logo available — using monogram fallback.";
      });
    } else {
      state.brandProfile.images.logo = "";
      renderStylePicker(state.currentTab);
      renderActivePreview();
      document.getElementById("brand-toolbar-hint").textContent = "Using monogram fallback.";
    }
  }

  // ============ AI REFINE ============
  async function handleRefine() {
    const input = document.getElementById("refine-input");
    const btn = document.getElementById("refine-btn");
    const instruction = input.value.trim();
    if (!instruction) { showError("Type what you want the AI to change."); return; }
    if (!state.brandProfile || !state.currentTab) return;
    btn.disabled = true;
    btn.textContent = "Refining...";
    try {
      const patch = await refineBrandAsset(state.brandProfile, state.currentTab, instruction);
      // Deep-merge the patch into the profile
      mergeProfilePatch(state.brandProfile, patch);
      // Re-render
      renderStylePicker(state.currentTab);
      renderActivePreview();
      input.value = "";
      document.getElementById("refine-hint").textContent = "✓ Updated. Click Refine again to keep iterating.";
      setTimeout(() => {
        document.getElementById("refine-hint").textContent = "Refines the current asset's text content using AI";
      }, 4000);
    } catch (err) {
      console.error(err);
      showError(err.message || "Refinement failed.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Refine";
    }
  }

  function mergeProfilePatch(target, patch) {
    if (!patch || typeof patch !== "object") return;
    Object.keys(patch).forEach(k => {
      const v = patch[k];
      if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) {
        mergeProfilePatch(target[k], v);
      } else {
        target[k] = v;
      }
    });
  }

  // ============ EXPORT ============
  async function exportCurrent(format) {
    const stage = document.getElementById("preview-stage");
    const svgEl = stage.querySelector("svg");
    if (!svgEl) { showError("Nothing to export yet."); return; }
    const name = (state.brandProfile && state.brandProfile.businessName) || "brand";
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "brand";
    const part = state.currentSub && state.currentSub !== "single" ? `-${state.currentSub}` : "";
    const styleSuffix = state.activeStyle[state.currentTab] ? `-${state.activeStyle[state.currentTab]}` : "";
    const filename = `${slug}-${state.currentTab}${styleSuffix}${part}`;
    try { await exportAsImage(svgEl, format, filename); }
    catch (err) { console.error(err); showError(err.message || "Export failed."); }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
})();
