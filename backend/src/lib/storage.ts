import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const APP_URL = process.env.APP_URL ?? "http://localhost:4000";

const MAX_IMAGE_BYTES = parseInt(process.env.MAX_IMAGE_SIZE_MB ?? "10") * 1024 * 1024;
const MAX_AUDIO_BYTES = parseInt(process.env.MAX_AUDIO_SIZE_MB ?? "20") * 1024 * 1024;

// Allowed MIME types mapped to safe extensions
const IMAGE_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
  "image/gif":  ".gif",
};
const AUDIO_MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3":  ".mp3",
  "audio/wav":  ".wav",
  "audio/x-wav":".wav",
  "audio/ogg":  ".ogg",
};

// Magic bytes for real file-type detection (not trusting client MIME)
function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WebP: RIFF....WEBP
  if (buf.length >= 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "image/webp";
  // MP3: ID3 or FF FB/F3/F2
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return "audio/mpeg";
  if (buf[0] === 0xFF && (buf[1] === 0xFB || buf[1] === 0xF3 || buf[1] === 0xF2)) return "audio/mpeg";
  // WAV: RIFF....WAVE
  if (buf.length >= 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WAVE") return "audio/wav";
  // OGG: OggS
  if (buf.slice(0, 4).toString() === "OggS") return "audio/ogg";
  return null;
}

export function validateBufferMime(buf: Buffer, kind: "image" | "audio"): string | null {
  const detected = detectMimeFromBuffer(buf);
  if (!detected) return "File type could not be verified";
  if (kind === "image" && !IMAGE_MIME_TO_EXT[detected]) return "File content does not match an allowed image format";
  if (kind === "audio" && !AUDIO_MIME_TO_EXT[detected]) return "File content does not match an allowed audio format";
  return null;
}

export function validateImageFile(mimeType: string, size: number): string | null {
  if (!IMAGE_MIME_TO_EXT[mimeType]) return "Invalid image type. Allowed: JPEG, PNG, WebP, GIF";
  if (size > MAX_IMAGE_BYTES) return `Image too large. Max ${process.env.MAX_IMAGE_SIZE_MB ?? 10}MB`;
  return null;
}

export function validateAudioFile(mimeType: string, size: number): string | null {
  if (!AUDIO_MIME_TO_EXT[mimeType]) return "Invalid audio type. Allowed: MP3, WAV, OGG";
  if (size > MAX_AUDIO_BYTES) return `Audio too large. Max ${process.env.MAX_AUDIO_SIZE_MB ?? 20}MB`;
  return null;
}

export async function saveFile(
  buffer: Buffer,
  _originalName: string,
  subDir: string
): Promise<{ storagePath: string; url: string }> {
  // Detect real MIME from magic bytes — ignore client-supplied filename/type
  const detectedMime = detectMimeFromBuffer(buffer);
  const ext =
    (detectedMime && (IMAGE_MIME_TO_EXT[detectedMime] ?? AUDIO_MIME_TO_EXT[detectedMime])) ?? ".bin";

  const filename = `${uuidv4()}${ext}`;
  const baseDir = path.resolve(UPLOAD_DIR);
  // Prevent path traversal in subDir
  const safeSubDir = path.basename(subDir);
  const dir = path.join(baseDir, safeSubDir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  const storagePath = `${safeSubDir}/${filename}`;
  return { storagePath, url: `${APP_URL}/uploads/${storagePath}` };
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    // Prevent path traversal
    const safe = path.normalize(storagePath).replace(/^(\.\.[/\\])+/, "");
    await fs.unlink(path.join(path.resolve(UPLOAD_DIR), safe));
  } catch { /* ignore */ }
}

export function getFileUrl(storagePath: string): string {
  return `${APP_URL}/uploads/${storagePath}`;
}

export function getFilePath(storagePath: string): string {
  return path.join(path.resolve(UPLOAD_DIR), storagePath);
}
