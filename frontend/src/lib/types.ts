export type Role = "viewer" | "editor" | "admin";
export type ArtefactStatus = "active" | "inactive" | "draft";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: { artefacts: number };
}

export interface Location {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  _count?: { artefacts: number };
}

export interface ArtefactImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  storagePath?: string;
}

export interface ArtefactAudio {
  id: string;
  audioUrl: string;
  duration: number | null;
}

export interface QrCode {
  id: string;
  uniqueShortCode: string;
  publicUrl: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: string | null;
  createdAt: string;
}

export interface Artefact {
  id: string;
  uniquePublicId: string;
  title: string;
  description: string | null;
  status: ArtefactStatus;
  metadata: Record<string, string> | null;
  categoryId: string | null;
  locationId: string | null;
  category: Category | null;
  location: Location | null;
  images: ArtefactImage[];
  audio?: ArtefactAudio | null;
  qrCode?: QrCode | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: Pick<User, "id" | "name" | "email">;
}
