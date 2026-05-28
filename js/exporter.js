async function exportAsImage(svgElement, format, filename) {
  format = (format || "png").toLowerCase();
  filename = filename || "asset";

  // Wait for any fonts already requested to be ready
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) {}
  }

  // Clone and ensure width/height attributes so the image renders at intrinsic size
  const clone = svgElement.cloneNode(true);
  const viewBox = clone.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length === 4) {
      clone.setAttribute("width", String(parts[2]));
      clone.setAttribute("height", String(parts[3]));
    }
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = 3;
      const w = img.naturalWidth || (parseInt(clone.getAttribute("width"), 10));
      const h = img.naturalHeight || (parseInt(clone.getAttribute("height"), 10));
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (format === "jpg" || format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, w, h);

      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const quality = format === "png" ? undefined : 0.95;

      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to render image"));
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${filename}.${format === "jpeg" ? "jpg" : format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);
        }, 1000);
        resolve();
      }, mimeType, quality);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      console.error("Image load failed for export", err);
      reject(new Error("Could not render SVG to image for export."));
    };
    img.src = url;
  });
}
