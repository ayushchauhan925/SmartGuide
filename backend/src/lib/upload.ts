import multer from "multer";

const MAX_BYTES = Math.max(
  parseInt(process.env.MAX_IMAGE_SIZE_MB ?? "10"),
  parseInt(process.env.MAX_AUDIO_SIZE_MB ?? "20")
) * 1024 * 1024;

/** Multipart parser that keeps files in memory; per-type size/MIME checks happen in lib/storage. */
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 20 } });
