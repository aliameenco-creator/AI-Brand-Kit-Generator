// Fetches an image URL and converts it to a data URI so it can be embedded
// in an SVG and exported via canvas without CORS-tainting issues.
// Returns "" (empty string) on any failure so templates can fall back gracefully.
async function loadImageAsDataUri(url) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return "";
    const blob = await res.blob();
    if (!blob || blob.size === 0) return "";
    if (blob.size > 5 * 1024 * 1024) return ""; // skip huge images
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : "");
      fr.onerror = () => resolve("");
      fr.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Image fetch failed (CORS or network):", url, e && e.message);
    return "";
  }
}

async function resolveBrandImages(brandProfile) {
  const imagery = brandProfile.imagery || {};
  const [logo, hero, ...supporting] = await Promise.all([
    loadImageAsDataUri(imagery.logoUrl),
    loadImageAsDataUri(imagery.heroUrl),
    ...(imagery.supportingUrls || []).slice(0, 2).map(loadImageAsDataUri)
  ]);
  brandProfile.images = {
    logo: logo || "",
    hero: hero || "",
    supporting: supporting.filter(Boolean)
  };
  return brandProfile;
}
