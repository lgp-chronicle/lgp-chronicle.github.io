// Armory renders include a transparent canvas around the figure. Measure a small
// copy so a new character can stand beside the archived, already trimmed models.
export function measureEntranceFrame(img: HTMLImageElement) {
  const factor = Math.min(
    1,
    256 / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(img.naturalWidth * factor));
  const height = Math.max(1, Math.round(img.naturalHeight * factor));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, width, height);
  return silhouetteFrame(ctx.getImageData(0, 0, width, height));
}

export function silhouetteFrame({
  data: pixels,
  width,
  height,
}: Pick<ImageData, "data" | "width" | "height">) {
  let left = width,
    right = -1,
    top = height,
    bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] < 32) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (
    right < left ||
    (left === 0 && top === 0 && right === width - 1 && bottom === height - 1)
  )
    return;
  return {
    center: ((left + right + 1) / 2 / width) * 100,
    feet: ((bottom + 1) / height) * 100,
    height: ((bottom - top + 1) / height) * 100,
  };
}
