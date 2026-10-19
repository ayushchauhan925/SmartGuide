import sharp, { type Metadata } from "sharp";

const MAX_DIMENSION = 2000;

/**
 * Decodes the upload (rejecting files that are not real images), applies EXIF rotation,
 * caps the longest side at 2000px and re-encodes as WebP. Animated GIFs are kept as-is.
 */
export async function optimizeImage(
  buffer: Buffer,
  originalName: string
): Promise<{ buffer: Buffer; filename: string }> {
  let meta: Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new Error("File is not a valid image");
  }
  if (!meta.format) throw new Error("File is not a valid image");

  if (meta.format === "gif" && (meta.pages ?? 1) > 1) {
    return { buffer, filename: originalName };
  }

  const out = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return { buffer: out, filename: `${base}.webp` };
}
