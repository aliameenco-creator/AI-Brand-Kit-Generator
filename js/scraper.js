async function scrapeWebsite(url) {
  const response = await fetch(`${CONFIG.FIRECRAWL_BASE_URL}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONFIG.FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      url: url,
      formats: ["markdown", "html"],
      onlyMainContent: false,
      includeTags: ["meta", "link", "header", "footer", "nav", "h1", "h2", "p", "img", "a"],
      waitFor: 3000
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Firecrawl error:", response.status, text);
    if (response.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
    if (response.status === 400 || response.status === 404) throw new Error("Couldn't access this website. Please check the URL and try again.");
    if (response.status === 408 || response.status === 504) throw new Error("Website took too long to load. Please try again.");
    throw new Error(`Scrape failed (${response.status}). Please try again.`);
  }

  const data = await response.json();
  if (!data.success && data.error) {
    console.error("Firecrawl returned error:", data);
    throw new Error("Couldn't access this website. Please check the URL and try again.");
  }
  return data;
}
