import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AudioPlayer } from "@/components/visitor/AudioPlayer";
import { ImageGallery } from "@/components/visitor/ImageGallery";
import { ShareButtons } from "@/components/visitor/ShareButtons";
import Image from "next/image";
import { BookOpen, MapPin, Tag, Calendar, Ruler, Globe } from "lucide-react";

interface Props {
  params: Promise<{ uniquePublicId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uniquePublicId } = await params;
  const artefact = await prisma.artefact.findUnique({
    where: { uniquePublicId, status: "active" },
    select: { title: true, description: true },
  });
  if (!artefact) return { title: "Not Found — SmartGuide" };
  return {
    title: `${artefact.title} — SmartGuide`,
    description: artefact.description?.slice(0, 160) ?? undefined,
  };
}

const META_ICONS: Record<string, typeof MapPin> = {
  period:       Calendar,
  material:     Globe,
  dimensions:   Ruler,
  discovered_at: MapPin,
};

export default async function ArtefactPage({ params }: Props) {
  const { uniquePublicId } = await params;

  const artefact = await prisma.artefact.findUnique({
    where: { uniquePublicId, status: "active" },
    include: {
      category: { select: { name: true } },
      location: { select: { name: true } },
      images: { orderBy: { displayOrder: "asc" } },
      audio: true,
    },
  });

  if (!artefact) notFound();

  const heroImage = artefact.images[0];
  const galleryImages = artefact.images.slice(1);
  const metadata = artefact.metadata as Record<string, string> | null;
  const metaFields = metadata ? Object.entries(metadata).filter(([, v]) => v) : [];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* ── Sticky header ────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-[#111110] border border-white/10 flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-[#D4A840]" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold text-stone-800 tracking-tight">
              Smart<span className="text-[#D4A840]">Guide</span>
            </span>
          </div>
          {(artefact.category || artefact.location) && (
            <div className="hidden sm:flex items-center gap-2">
              {artefact.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600">
                  <Tag className="h-2.5 w-2.5" />
                  {artefact.category.name}
                </span>
              )}
              {artefact.location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-medium text-stone-600">
                  <MapPin className="h-2.5 w-2.5" />
                  {artefact.location.name}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="pb-20">
        {/* ── Hero image ───────────────────────────────── */}
        <div
          className="relative w-full bg-stone-900 overflow-hidden"
          style={{ maxHeight: "65vh", aspectRatio: "16/9" }}
        >
          {heroImage ? (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.altText ?? artefact.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1C1917, #111110)" }}>
              <BookOpen className="h-20 w-20 text-stone-800" strokeWidth={1} />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

          {/* Tags overlay */}
          {(artefact.category || artefact.location) && (
            <div className="absolute top-5 left-5 flex flex-wrap gap-2 sm:hidden">
              {artefact.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-medium text-white/90">
                  <Tag className="h-2.5 w-2.5" />
                  {artefact.category.name}
                </span>
              )}
              {artefact.location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-medium text-white/90">
                  <MapPin className="h-2.5 w-2.5" />
                  {artefact.location.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Title block ──────────────────────────────── */}
        <div className="mx-auto max-w-3xl px-5 pt-8">
          <h1
            className="font-display text-3xl sm:text-4xl font-bold text-stone-900 leading-tight tracking-tight mb-2"
          >
            {artefact.title}
          </h1>
          {(artefact.category || artefact.location) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 mt-2">
              {artefact.category && (
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-stone-400" />
                  {artefact.category.name}
                </span>
              )}
              {artefact.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-stone-400" />
                  {artefact.location.name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Content ──────────────────────────────────── */}
        <div className="mx-auto max-w-3xl px-5 mt-8 space-y-10">
          {/* Audio guide */}
          {artefact.audio && (
            <AudioPlayer src={artefact.audio.audioUrl} duration={artefact.audio.duration} />
          )}

          {/* Description */}
          {artefact.description && (
            <section>
              <div className="museum-rule mb-5">About</div>
              <p className="text-stone-700 leading-[1.8] text-[15px] whitespace-pre-wrap">
                {artefact.description}
              </p>
            </section>
          )}

          {/* Metadata grid */}
          {metaFields.length > 0 && (
            <section>
              <div className="museum-rule mb-5">Provenance & Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metaFields.map(([key, val]) => {
                  const IconComp = META_ICONS[key] ?? Globe;
                  return (
                    <div
                      key={key}
                      className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3.5"
                    >
                      <div className="h-7 w-7 rounded-lg bg-gold-100 flex items-center justify-center shrink-0 mt-0.5">
                        <IconComp className="h-3.5 w-3.5 text-gold-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-0.5">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm font-semibold text-stone-800">{val}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Additional images gallery */}
          {galleryImages.length > 0 && (
            <section>
              <div className="museum-rule mb-5">Gallery</div>
              <ImageGallery images={artefact.images} title={artefact.title} />
            </section>
          )}

          {/* Share */}
          <section>
            <div className="museum-rule mb-5">Share</div>
            <ShareButtons title={artefact.title} />
          </section>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-white py-8 px-5 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-md bg-[#111110] flex items-center justify-center">
            <BookOpen className="h-3 w-3 text-[#D4A840]" />
          </div>
          <span className="text-xs font-bold text-stone-700">
            Smart<span className="text-[#D4A840]">Guide</span>
          </span>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Scan. Explore. Discover.
        </p>
      </footer>
    </div>
  );
}
