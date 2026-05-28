// Fetches an image URL and converts it to a data URI so it can be safely
// embedded into an SVG and rasterised via canvas without CORS taint.
// Strategy: direct CORS fetch → corsproxy.io → allorigins → empty fallback.

const _IMG_CACHE = new Map();

async function _tryFetchAsDataUri(url) {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return "";
    const blob = await res.blob();
    if (!blob || blob.size === 0) return "";
    if (blob.size > 6 * 1024 * 1024) return ""; // skip huge files
    if (!/^image\//.test(blob.type)) return ""; // must be an image
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : "");
      fr.onerror = () => resolve("");
      fr.readAsDataURL(blob);
    });
  } catch (e) {
    return "";
  }
}

async function loadImageAsDataUri(url) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:")) return url;
  if (_IMG_CACHE.has(url)) return _IMG_CACHE.get(url);

  const sources = [
    url,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  for (const src of sources) {
    const result = await _tryFetchAsDataUri(src);
    if (result) {
      _IMG_CACHE.set(url, result);
      return result;
    }
  }
  _IMG_CACHE.set(url, "");
  return "";
}

async function resolveBrandImages(brandProfile) {
  const imagery = brandProfile.imagery || {};
  // Firecrawl screenshot is highest-priority hero fallback — already CORS-safe
  const firecrawlShot = brandProfile._firecrawlScreenshot || "";

  const [logo, heroFromUrl, ...supporting] = await Promise.all([
    loadImageAsDataUri(imagery.logoUrl),
    loadImageAsDataUri(imagery.heroUrl),
    ...(imagery.supportingUrls || []).slice(0, 2).map(loadImageAsDataUri)
  ]);

  let hero = heroFromUrl;
  if (!hero && firecrawlShot) {
    hero = await loadImageAsDataUri(firecrawlShot);
  }

  brandProfile.images = {
    logo: logo || "",
    hero: hero || "",
    supporting: supporting.filter(Boolean)
  };
  return brandProfile;
}
