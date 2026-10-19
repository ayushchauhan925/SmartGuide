import QRCode from "qrcode";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function generateQRCode(
  uniquePublicId: string
): Promise<{ qrImagePath: string; publicUrl: string; dataUrl: string }> {
  const publicUrl = `${APP_URL}/a/${uniquePublicId}`;
  const qrDir = path.join(path.resolve(UPLOAD_DIR), "qr");
  await fs.mkdir(qrDir, { recursive: true });

  const filename = `qr-${uuidv4()}.png`;
  const filePath = path.join(qrDir, filename);

  const dataUrl = await QRCode.toDataURL(publicUrl, {
    width: 512,
    margin: 2,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });

  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

  return {
    qrImagePath: `qr/${filename}`,
    publicUrl,
    dataUrl,
  };
}
