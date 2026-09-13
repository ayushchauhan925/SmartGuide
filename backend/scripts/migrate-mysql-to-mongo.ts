/**
 * Migration script: MySQL → MongoDB
 * Reads all data from MySQL (smartguide DB) and inserts into MongoDB.
 * Run with: npx tsx scripts/migrate-mysql-to-mongo.ts
 */

import mysql from "mysql2/promise";
import { MongoClient, ObjectId } from "mongodb";

const MYSQL_URL = process.env.MYSQL_URL ?? "mysql://smartguide:smartguide123@127.0.0.1:3306/smartguide";
const MONGO_URL = process.env.DATABASE_URL ?? "mongodb://127.0.0.1:27018/smartguide?replicaSet=rs0&directConnection=true";

// Maps old int IDs → new ObjectId strings per table
const idMap: Record<string, Map<number, string>> = {
  users: new Map(),
  categories: new Map(),
  locations: new Map(),
  artefacts: new Map(),
  artefact_images: new Map(),
  artefact_audio: new Map(),
  qr_codes: new Map(),
  audit_logs: new Map(),
};

function newId() {
  return new ObjectId().toHexString();
}

function mapId(table: string, oldId: number | null | undefined): string | null {
  if (oldId == null) return null;
  const id = idMap[table]?.get(oldId);
  return id ?? null;
}

async function main() {
  console.log("Connecting to MySQL...");
  const db = await mysql.createConnection(MYSQL_URL);

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const mongo = client.db();

  console.log("\nDropping existing MongoDB collections...");
  const collections = ["users", "categories", "locations", "artefacts", "artefact_images", "artefact_audio", "qr_codes", "audit_logs"];
  for (const col of collections) {
    await mongo.collection(col).drop().catch(() => {}); // ignore if not exists
    console.log(`  ✓ dropped ${col}`);
  }

  // ─── USERS ────────────────────────────────────────────────────────────
  console.log("\nMigrating users...");
  const [users] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM users");
  const userDocs = users.map((u) => {
    const newOid = newId();
    idMap.users.set(u.id, newOid);
    return {
      _id: new ObjectId(newOid),
      name: u.name,
      email: u.email,
      password_hash: u.password_hash,
      role: u.role,
      is_active: Boolean(u.is_active),
      created_at: new Date(u.created_at),
      updated_at: new Date(u.updated_at),
    };
  });
  if (userDocs.length) await mongo.collection("users").insertMany(userDocs);
  console.log(`  ✓ ${userDocs.length} users`);

  // ─── CATEGORIES ───────────────────────────────────────────────────────
  console.log("Migrating categories...");
  const [categories] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM categories");
  const catDocs = categories.map((c) => {
    const newOid = newId();
    idMap.categories.set(c.id, newOid);
    return {
      _id: new ObjectId(newOid),
      name: c.name,
      description: c.description ?? null,
      created_at: new Date(c.created_at),
    };
  });
  if (catDocs.length) await mongo.collection("categories").insertMany(catDocs);
  console.log(`  ✓ ${catDocs.length} categories`);

  // ─── LOCATIONS ────────────────────────────────────────────────────────
  console.log("Migrating locations...");
  const [locations] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM locations");
  const locDocs = locations.map((l) => {
    const newOid = newId();
    idMap.locations.set(l.id, newOid);
    return {
      _id: new ObjectId(newOid),
      name: l.name,
      type: l.type ?? null,
      description: l.description ?? null,
      created_at: new Date(l.created_at),
    };
  });
  if (locDocs.length) await mongo.collection("locations").insertMany(locDocs);
  console.log(`  ✓ ${locDocs.length} locations`);

  // ─── ARTEFACTS ────────────────────────────────────────────────────────
  console.log("Migrating artefacts...");
  const [artefacts] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM artefacts");
  const artefactDocs = artefacts.map((a) => {
    const newOid = newId();
    idMap.artefacts.set(a.id, newOid);
    const catId = mapId("categories", a.category_id);
    const locId = mapId("locations", a.location_id);
    let metadata = null;
    if (a.metadata) {
      try { metadata = typeof a.metadata === "string" ? JSON.parse(a.metadata) : a.metadata; } catch {}
    }
    return {
      _id: new ObjectId(newOid),
      unique_public_id: a.unique_public_id,
      title: a.title,
      description: a.description ?? null,
      metadata,
      category_id: catId ? new ObjectId(catId) : null,
      location_id: locId ? new ObjectId(locId) : null,
      status: a.status,
      created_at: new Date(a.created_at),
      updated_at: new Date(a.updated_at),
    };
  });
  if (artefactDocs.length) await mongo.collection("artefacts").insertMany(artefactDocs);
  console.log(`  ✓ ${artefactDocs.length} artefacts`);

  // ─── ARTEFACT IMAGES ──────────────────────────────────────────────────
  console.log("Migrating artefact images...");
  const [images] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM artefact_images");
  const imageDocs = images.map((img) => {
    const newOid = newId();
    idMap.artefact_images.set(img.id, newOid);
    const artId = mapId("artefacts", img.artefact_id);
    return {
      _id: new ObjectId(newOid),
      artefact_id: artId ? new ObjectId(artId) : null,
      storage_path: img.storage_path,
      image_url: img.image_url,
      alt_text: img.alt_text ?? null,
      display_order: img.display_order ?? 0,
      created_at: new Date(img.created_at),
    };
  });
  if (imageDocs.length) await mongo.collection("artefact_images").insertMany(imageDocs);
  console.log(`  ✓ ${imageDocs.length} images`);

  // ─── ARTEFACT AUDIO ───────────────────────────────────────────────────
  console.log("Migrating artefact audio...");
  const [audios] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM artefact_audio");
  const audioDocs = audios.map((aud) => {
    const newOid = newId();
    idMap.artefact_audio.set(aud.id, newOid);
    const artId = mapId("artefacts", aud.artefact_id);
    return {
      _id: new ObjectId(newOid),
      artefact_id: artId ? new ObjectId(artId) : null,
      storage_path: aud.storage_path,
      audio_url: aud.audio_url,
      duration: aud.duration ?? null,
      created_at: new Date(aud.created_at),
    };
  });
  if (audioDocs.length) await mongo.collection("artefact_audio").insertMany(audioDocs);
  console.log(`  ✓ ${audioDocs.length} audio files`);

  // ─── QR CODES ─────────────────────────────────────────────────────────
  console.log("Migrating QR codes...");
  const [qrCodes] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM qr_codes");
  const qrDocs = qrCodes.map((qr) => {
    const newOid = newId();
    idMap.qr_codes.set(qr.id, newOid);
    const artId = mapId("artefacts", qr.artefact_id);
    return {
      _id: new ObjectId(newOid),
      artefact_id: artId ? new ObjectId(artId) : null,
      unique_short_code: qr.unique_short_code,
      public_url: qr.public_url,
      qr_image_path: qr.qr_image_path ?? null,
      is_active: Boolean(qr.is_active),
      scan_count: qr.scan_count ?? 0,
      last_scanned_at: qr.last_scanned_at ? new Date(qr.last_scanned_at) : null,
      created_at: new Date(qr.created_at),
      updated_at: new Date(qr.updated_at),
    };
  });
  if (qrDocs.length) await mongo.collection("qr_codes").insertMany(qrDocs);
  console.log(`  ✓ ${qrDocs.length} QR codes`);

  // ─── AUDIT LOGS ───────────────────────────────────────────────────────
  console.log("Migrating audit logs...");
  const [auditLogs] = await db.query<mysql.RowDataPacket[]>("SELECT * FROM audit_logs");
  const auditDocs = auditLogs.map((log) => {
    const newOid = newId();
    idMap.audit_logs.set(log.id, newOid);
    const userId = mapId("users", log.user_id);
    let changes = null;
    if (log.changes) {
      try { changes = typeof log.changes === "string" ? JSON.parse(log.changes) : log.changes; } catch {}
    }
    return {
      _id: new ObjectId(newOid),
      user_id: userId ? new ObjectId(userId) : null,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id ? String(log.entity_id) : null,
      changes,
      ip_address: log.ip_address ?? null,
      created_at: new Date(log.created_at),
    };
  });
  if (auditDocs.length) await mongo.collection("audit_logs").insertMany(auditDocs);
  console.log(`  ✓ ${auditDocs.length} audit log entries`);

  // ─── INDEXES ──────────────────────────────────────────────────────────
  console.log("\nCreating indexes...");
  await mongo.collection("users").createIndex({ email: 1 }, { unique: true });
  await mongo.collection("categories").createIndex({ name: 1 }, { unique: true });
  await mongo.collection("artefacts").createIndex({ unique_public_id: 1 }, { unique: true });
  await mongo.collection("artefacts").createIndex({ status: 1 });
  await mongo.collection("artefact_images").createIndex({ artefact_id: 1, display_order: 1 });
  await mongo.collection("artefact_audio").createIndex({ artefact_id: 1 }, { unique: true });
  await mongo.collection("qr_codes").createIndex({ artefact_id: 1 }, { unique: true });
  await mongo.collection("qr_codes").createIndex({ unique_short_code: 1 }, { unique: true });
  await mongo.collection("qr_codes").createIndex({ public_url: 1 }, { unique: true });
  await mongo.collection("audit_logs").createIndex({ entity_type: 1, entity_id: 1 });
  await mongo.collection("audit_logs").createIndex({ created_at: -1 });
  console.log("  ✓ All indexes created");

  await db.end();
  await client.close();

  console.log("\n✅ Migration complete!");
  console.log("\nSummary:");
  console.log(`  Users:        ${userDocs.length}`);
  console.log(`  Categories:   ${catDocs.length}`);
  console.log(`  Locations:    ${locDocs.length}`);
  console.log(`  Artefacts:    ${artefactDocs.length}`);
  console.log(`  Images:       ${imageDocs.length}`);
  console.log(`  Audio:        ${audioDocs.length}`);
  console.log(`  QR Codes:     ${qrDocs.length}`);
  console.log(`  Audit Logs:   ${auditDocs.length}`);
}

main().catch((err) => { console.error("Migration failed:", err); process.exit(1); });
