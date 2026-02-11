const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const JPEG_QUALITY = 0.85;
const THUMB_WIDTH = 120;
const THUMB_HEIGHT = 90;
const THUMB_QUALITY = 0.6;
const SMALL_FILE_THRESHOLD = 200 * 1024; // 200KB

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob"));
      },
      type,
      quality,
    );
  });
}

function fitDimensions(
  width: number,
  height: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  if (width <= maxW && height <= maxH) return { width, height };
  const ratio = Math.min(maxW / width, maxH / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/** Optimize a screenshot canvas to a JPEG blob, capped at 1920×1080 */
export async function optimizeScreenshot(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  const { width, height } = fitDimensions(
    canvas.width,
    canvas.height,
    MAX_WIDTH,
    MAX_HEIGHT,
  );

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, width, height);

  return canvasToBlob(out, "image/jpeg", JPEG_QUALITY);
}

/** Optimize a user-attached image file. Non-images and SVGs are returned as-is. */
export async function optimizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  // SVGs are vector — no raster optimization possible
  if (file.type === "image/svg+xml") return file;
  if (file.size <= SMALL_FILE_THRESHOLD) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitDimensions(
      bitmap.width,
      bitmap.height,
      MAX_WIDTH,
      MAX_HEIGHT,
    );

    // If already within bounds and small enough, skip
    if (
      width === bitmap.width &&
      height === bitmap.height &&
      file.size <= SMALL_FILE_THRESHOLD
    ) {
      bitmap.close();
      return file;
    }

    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Keep PNG for transparency, use JPEG for everything else
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = outputType === "image/jpeg" ? JPEG_QUALITY : undefined;

    return canvasToBlob(out, outputType, quality);
  } catch {
    // Corrupt or unsupported image — return original file
    return file;
  }
}

/** Optimize any image blob to JPEG, capped at max dimensions */
export async function optimizeBlobToJpeg(blob: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = fitDimensions(
      bitmap.width,
      bitmap.height,
      MAX_WIDTH,
      MAX_HEIGHT,
    );
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvasToBlob(out, "image/jpeg", JPEG_QUALITY);
  } catch {
    // If optimization fails, return the original blob
    return blob;
  }
}

/** Generate a small thumbnail data URL from a canvas or image blob */
export async function generateThumbnail(
  source: HTMLCanvasElement | Blob,
): Promise<string> {
  const out = document.createElement("canvas");
  out.width = THUMB_WIDTH;
  out.height = THUMB_HEIGHT;
  const ctx = out.getContext("2d")!;

  if (source instanceof HTMLCanvasElement) {
    ctx.drawImage(source, 0, 0, THUMB_WIDTH, THUMB_HEIGHT);
    return out.toDataURL("image/jpeg", THUMB_QUALITY);
  }

  // Blob — try to render as image (skip SVG — createImageBitmap doesn't support it)
  if (source.type.startsWith("image/") && source.type !== "image/svg+xml") {
    try {
      const bitmap = await createImageBitmap(source);
      ctx.drawImage(bitmap, 0, 0, THUMB_WIDTH, THUMB_HEIGHT);
      bitmap.close();
      return out.toDataURL("image/jpeg", THUMB_QUALITY);
    } catch {
      // Fall through to generic icon
    }
  }

  // Non-image or unsupported image — draw a generic file icon
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);
  ctx.fillStyle = "#6b7280";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ext = getExtFromMime(source.type);
  ctx.fillText(ext.toUpperCase(), THUMB_WIDTH / 2, THUMB_HEIGHT / 2 - 8);
  ctx.font = "10px sans-serif";
  ctx.fillText("FILE", THUMB_WIDTH / 2, THUMB_HEIGHT / 2 + 8);
  return out.toDataURL("image/png");
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/zip": "zip",
    "application/json": "json",
  };
  return map[mime] || mime.split("/")[1]?.substring(0, 4) || "file";
}

/** Format bytes as human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
