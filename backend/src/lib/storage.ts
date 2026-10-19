import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface StorageProvider {
  save(
    buffer: Buffer,
    originalName: string,
    subDir: string
  ): Promise<{ storagePath: string; url: string }>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string): string;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir = UPLOAD_DIR) {
    this.baseDir = path.resolve(baseDir);
  }

  async save(
    buffer: Buffer,
    originalName: string,
    subDir: string
  ): Promise<{ storagePath: string; url: string }> {
    const ext = path.extname(originalName).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    const dir = path.join(this.baseDir, subDir);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    const storagePath = path.join(subDir, filename).replace(/\\/g, "/");
    return { storagePath, url: this.getUrl(storagePath) };
  }

  async delete(storagePath: string): Promise<void> {
    const filePath = path.join(this.baseDir, storagePath);
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }
  }

  getUrl(storagePath: string): string {
    return `${APP_URL}/api/v1/files/${storagePath}`;
  }
}

export const storage = new LocalStorageProvider();

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/x-wav"];
const MAX_IMAGE_BYTES = (parseInt(process.env.MAX_IMAGE_SIZE_MB ?? "10") * 1024 * 1024);
const MAX_AUDIO_BYTES = (parseInt(process.env.MAX_AUDIO_SIZE_MB ?? "20") * 1024 * 1024);

export function validateImageFile(mimeType: string, size: number): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return "Invalid image type. Allowed: JPEG, PNG, WebP, GIF";
  if (size > MAX_IMAGE_BYTES) return `Image too large. Max ${process.env.MAX_IMAGE_SIZE_MB ?? 10}MB`;
  return null;
}

export function validateAudioFile(mimeType: string, size: number): string | null {
  if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) return "Invalid audio type. Allowed: MP3, WAV, OGG";
  if (size > MAX_AUDIO_BYTES) return `Audio too large. Max ${process.env.MAX_AUDIO_SIZE_MB ?? 20}MB`;
  return null;
}
