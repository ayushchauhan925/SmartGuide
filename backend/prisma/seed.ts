import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // Admin user
  const passwordHash = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@smartguide.demo" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@smartguide.demo",
      passwordHash,
      role: "admin",
    },
  });
  console.log("Created admin:", admin.email);

  // Editor user
  const editorHash = await bcrypt.hash("editor1234", 12);
  await prisma.user.upsert({
    where: { email: "editor@smartguide.demo" },
    update: {},
    create: {
      name: "Jane Editor",
      email: "editor@smartguide.demo",
      passwordHash: editorHash,
      role: "editor",
    },
  });

  // Categories
  const [antiquities, paintings, sculptures] = await Promise.all([
    prisma.category.upsert({ where: { name: "Antiquities" }, update: {}, create: { name: "Antiquities", description: "Ancient artefacts from early civilizations" } }),
    prisma.category.upsert({ where: { name: "Paintings" }, update: {}, create: { name: "Paintings", description: "Oil, watercolour and mixed media works" } }),
    prisma.category.upsert({ where: { name: "Sculptures" }, update: {}, create: { name: "Sculptures", description: "Three-dimensional works in stone, bronze and clay" } }),
  ]);

  // Locations
  const gallery1 = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Gallery 1 - Ancient Civilizations", type: "Gallery" },
  });
  const gallery2 = await prisma.location.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "Gallery 2 - Renaissance", type: "Gallery" },
  });
  const gallery3 = await prisma.location.upsert({
    where: { id: 3 },
    update: {},
    create: { name: "Sculpture Hall", type: "Hall" },
  });

  // Artefacts
  const artefacts = [
    {
      title: "Ancient Greek Amphora",
      description: "A beautifully preserved terracotta amphora from ancient Greece, circa 550 BCE. This vessel was used for storing wine or olive oil and features striking red-figure pottery decoration depicting scenes from Greek mythology — specifically the labours of Hercules.\n\nThe vessel stands 42cm tall and shows remarkable craftsmanship in both form and the precision of its painted narrative. It was excavated from a burial site in the Attic region of Greece in 1897.",
      categoryId: antiquities.id,
      locationId: gallery1.id,
      status: "active" as const,
      metadata: { period: "550 BCE", material: "Terracotta", dimensions: "42cm height, 28cm diameter", discovered_at: "Attica, Greece (1897)" },
    },
    {
      title: "Madonna and Child",
      description: "A stunning example of Italian Renaissance painting, attributed to a follower of Fra Angelico. This tempera on panel work depicts the Virgin Mary with the infant Jesus in a tender embrace, surrounded by golden halos characteristic of Byzantine-influenced early Renaissance style.\n\nThe painting shows exceptional use of ultramarine blue — one of the most expensive pigments of the era — in the Virgin's robes, suggesting this was a prestigious commission.",
      categoryId: paintings.id,
      locationId: gallery2.id,
      status: "active" as const,
      metadata: { period: "c. 1430–1450", material: "Tempera on panel", dimensions: "78cm × 52cm", discovered_at: "Florence, Italy" },
    },
    {
      title: "Marble Bust of Emperor Augustus",
      description: "A fine marble portrait bust of the first Roman Emperor, Augustus (63 BCE – 14 CE), carved in the classical tradition. The idealized features — strong brow, aquiline nose, composed expression — represent the official imperial image that was disseminated throughout the Roman Empire.\n\nThis piece was likely produced in a Roman workshop and served a civic or domestic cult function. It is one of over 150 known portrait types of Augustus.",
      categoryId: sculptures.id,
      locationId: gallery3.id,
      status: "active" as const,
      metadata: { period: "1st century CE", material: "Carrara marble", dimensions: "58cm height", discovered_at: "Rome, Italy (1854)" },
    },
    {
      title: "Bronze Age Axe Head",
      description: "A socketed bronze axe head from the Late Bronze Age (c. 1000–700 BCE). This weapon-tool hybrid represents the technological advancement of metallurgy in ancient Europe and would have been a prized possession — both a functional tool and a status symbol.\n\nThe greenish patina is a natural result of centuries of oxidation and adds to the artefact's historical character.",
      categoryId: antiquities.id,
      locationId: gallery1.id,
      status: "active" as const,
      metadata: { period: "c. 1000–700 BCE", material: "Bronze", dimensions: "18cm length, 12cm width at blade" },
    },
    {
      title: "Modern Abstract No. 7",
      description: "A striking oil-on-canvas abstract work from the mid-20th century expressionist movement. The dynamic interplay of cobalt blues, burnt siennas, and raw umbers creates a sense of turbulent energy barely contained within the frame.\n\nThis work is part of a series the artist described as 'the colour of memory' — an attempt to translate emotional states directly into paint without figurative mediation.",
      categoryId: paintings.id,
      locationId: gallery2.id,
      status: "draft" as const,
      metadata: { period: "1962", material: "Oil on canvas", dimensions: "120cm × 95cm" },
    },
  ];

  for (const artefact of artefacts) {
    await prisma.artefact.upsert({
      where: { uniquePublicId: `seed-${artefact.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}` },
      update: {},
      create: {
        uniquePublicId: `seed-${artefact.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Math.random().toString(36).slice(2, 8)}`,
        ...artefact,
        metadata: artefact.metadata,
      },
    });
  }

  // Re-fetch to get real IDs and create QR codes for active ones
  const active = await prisma.artefact.findMany({ where: { status: "active" } });
  for (const a of active) {
    const publicUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/a/${a.uniquePublicId}`;
    await prisma.qrCode.upsert({
      where: { artefactId: a.id },
      update: {},
      create: {
        artefactId: a.id,
        uniqueShortCode: a.uniquePublicId.slice(0, 8),
        publicUrl,
        isActive: true,
      },
    });
  }

  console.log("Seeding complete!");
  console.log("\n=== LOGIN CREDENTIALS ===");
  console.log("Admin: admin@smartguide.demo / admin1234");
  console.log("Editor: editor@smartguide.demo / editor1234");
  console.log("\n=== SAMPLE ARTEFACT URLS ===");
  const allArtefacts = await prisma.artefact.findMany({ where: { status: "active" }, select: { title: true, uniquePublicId: true } });
  allArtefacts.forEach((a) => {
    console.log(`  ${a.title}: /a/${a.uniquePublicId}`);
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
