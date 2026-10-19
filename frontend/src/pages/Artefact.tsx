import { AudioPlayer } from "@/components/visitor/AudioPlayer";
import { ImageGallery } from "@/components/visitor/ImageGallery";
import { Link } from "react-router-dom";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Headphones, Images, MapPin, Route } from "lucide-react";
import { SiteHeader } from "@/components/visitor/SiteHeader";
import { SiteFooter } from "@/components/visitor/SiteFooter";
import { ArtefactCover } from "@/components/visitor/ArtefactCover";
import { ArtefactCard } from "@/components/visitor/ArtefactCard";
import { TextToSpeech } from "@/components/visitor/TextToSpeech";
import { ScanTracker } from "@/components/visitor/ScanTracker";
import { LanguageSwitcher } from "@/components/visitor/LanguageSwitcher";
import { FeedbackWidget } from "@/components/visitor/FeedbackWidget";
import { FavoriteButton } from "@/components/visitor/FavoriteButton";
import { AccessibilityControls } from "@/components/visitor/AccessibilityControls";
import { DEFAULT_LANGUAGE } from "@/lib/languages";
import { useParams, useSearchParams } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ArtefactNotFound from "./ArtefactNotFound";
import { VideoEmbed } from "@/components/visitor/VideoEmbed";
import { ModelViewer } from "@/components/visitor/ModelViewer";

const META_LABELS: Record<string, string> = {
  period:       "Period / Era",
  material:     "Material",
  dimensions:   "Dimensions",
  discovered_at: "Discovered at",
  artist:       "Artist",
  origin:       "Origin",
  language:     "Language",
};

type CardData = {
  uniquePublicId: string;
  title: string;
  category: { name: string } | null;
  location: { name: string } | null;
  images: { imageUrl: string; altText: string | null }[];
};

interface PageData {
  artefact: {
    id: number;
    uniquePublicId: string;
    title: string;
    metadata: Record<string, string> | null;
    videoUrl: string | null;
    modelUrl: string | null;
    mapX: number | null;
    mapY: number | null;
    category: { name: string } | null;
    location: { name: string; floorPlanUrl: string | null } | null;
    images: { id: number; imageUrl: string; altText: string | null }[];
    audio: { audioUrl: string; duration: number | null } | null;
  };
  lang: string;
  availableLangs: string[];
  title: string;
  description: string | null;
  tourNav: { title: string; slug: string; index: number; total: number; prev?: string; next?: string } | null;
  related: CardData[];
}

export default function ArtefactPage() {
  const { uniquePublicId } = useParams() as { uniquePublicId: string };
  const [sp] = useSearchParams();
  const qs = new URLSearchParams();
  if (sp.get("lang")) qs.set("lang", sp.get("lang")!);
  if (sp.get("tour")) qs.set("tour", sp.get("tour")!);
  const { data, loading, notFound } = useFetch<PageData>(
    `/api/v1/public/artefacts/${encodeURIComponent(uniquePublicId)}/page${qs.size ? `?${qs}` : ""}`
  );
  useDocumentTitle(data ? `${data.title} — SmartGuide` : notFound ? "Not Found — SmartGuide" : null, data?.description);

  if (notFound) return <ArtefactNotFound />;
  if (loading || !data) {
    return (
      <div className="sg-visitor min-h-screen" style={{ background: "var(--sg-paper)" }}>
        <div className="h-[78vh] min-h-[480px] max-h-[820px] animate-pulse bg-stone-900" />
      </div>
    );
  }

  const { artefact, lang, availableLangs, title, description, tourNav, related } = data;
  const langQuery = lang !== DEFAULT_LANGUAGE ? `&lang=${lang}` : "";

  const heroImage = artefact.images[0];
  const metadata = artefact.metadata;
  const metaFields = metadata ? Object.entries(metadata).filter(([, v]) => v?.trim()) : [];
  const place = [artefact.category?.name, artefact.location?.name].filter(Boolean).join("  ·  ");
  const langSuffix = lang !== DEFAULT_LANGUAGE ? `?lang=${lang}` : "";

  return (
    <div className="sg-visitor min-h-screen" style={{ background: "var(--sg-paper)", color: "var(--sg-text)" }}>
      <ScanTracker publicId={artefact.uniquePublicId} language={lang} />

      <SiteHeader tone="dark" compact>
        <Suspense fallback={null}>
          <LanguageSwitcher current={lang} available={availableLangs} />
        </Suspense>
        <FavoriteButton publicId={artefact.uniquePublicId} />
        <AccessibilityControls />
      </SiteHeader>

      {/* ── Immersive hero ─────────────────────────────────── */}
      <section className="relative -mt-14 h-[78vh] min-h-[480px] max-h-[820px] overflow-hidden bg-stone-950 text-white">
        <div className="sg-ken-burns absolute inset-0">
          <ArtefactCover
            title={artefact.title}
            imageUrl={heroImage?.imageUrl}
            alt={heroImage?.altText ?? title}
            sizes="100vw"
            priority
            hero
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0C0B] via-[#0D0C0B]/45 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-3xl px-6 pb-16 sm:pb-20">
            {place && (
              <p className="sg-reveal sg-eyebrow" style={{ color: "#E2C27A" }}>{place}</p>
            )}
            <h1
              className="sg-reveal mt-3 font-display font-bold leading-[1.04] tracking-tight"
              style={{ fontSize: "clamp(2.3rem, 7vw, 4.6rem)", textShadow: "0 4px 30px rgba(0,0,0,0.5)", ["--d" as string]: "80ms" }}
            >
              {title}
            </h1>
            <div className="sg-reveal mt-5 flex flex-wrap gap-2 text-xs" style={{ ["--d" as string]: "160ms" }}>
              {(artefact.audio || description) && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Headphones className="h-3.5 w-3.5" style={{ color: "#E2C27A" }} />
                  {artefact.audio ? "Audio guide" : "Read aloud"}
                </span>
              )}
              {artefact.images.length > 1 && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <Images className="h-3.5 w-3.5" style={{ color: "#E2C27A" }} /> {artefact.images.length} images
                </span>
              )}
              {artefact.location && (
                <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5" style={{ color: "#E2C27A" }} /> {artefact.location.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content sheet ──────────────────────────────────── */}
      <main className="relative -mt-8 rounded-t-[2rem]" style={{ background: "var(--sg-paper)" }}>
        <div className="mx-auto max-w-3xl px-5 pt-8 sm:px-6">

          {tourNav && (
            <nav
              aria-label="Tour navigation"
              className="sg-reveal mb-8 flex items-center gap-2 rounded-full p-1.5 text-sm text-white"
              style={{ background: "linear-gradient(135deg, #1B1815, #0D0C0B)", boxShadow: "0 20px 40px -24px rgba(0,0,0,0.6)" }}
            >
              {tourNav.prev ? (
                <Link to={`/a/${tourNav.prev}?tour=${tourNav.slug}${langQuery}`} aria-label="Previous stop" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : <span className="h-10 w-10" />}
              <Link to={`/tours/${tourNav.slug}`} className="min-w-0 flex-1 text-center">
                <span className="flex items-center justify-center gap-1.5 truncate text-[13px] font-semibold">
                  <Route className="h-3.5 w-3.5 shrink-0" style={{ color: "#E2C27A" }} /> {tourNav.title}
                </span>
                <span className="mt-1 flex justify-center gap-1" aria-label={`Stop ${tourNav.index + 1} of ${tourNav.total}`}>
                  {Array.from({ length: tourNav.total }).map((_, i) => (
                    <span key={i} className="h-1 rounded-full transition-all" style={{ width: i === tourNav!.index ? 18 : 6, background: i <= tourNav!.index ? "#E2C27A" : "rgba(255,255,255,0.2)" }} />
                  ))}
                </span>
              </Link>
              {tourNav.next ? (
                <Link to={`/a/${tourNav.next}?tour=${tourNav.slug}${langQuery}`} className="flex h-10 items-center gap-1 rounded-full px-4 font-semibold" style={{ background: "linear-gradient(135deg, #F0D58F, #C9A04A)", color: "#1A1408" }}>
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              ) : <span className="h-10 w-10" />}
            </nav>
          )}

          {/* Listen */}
          {(artefact.audio || description) && (
            <section className="sg-reveal space-y-3">
              {artefact.audio && <AudioPlayer src={artefact.audio.audioUrl} duration={artefact.audio.duration} />}
              {description && <TextToSpeech text={`${title}. ${description}`} lang={lang} title={title} />}
            </section>
          )}

          {/* Story */}
          {description && (
            <section className="mt-14">
              <SectionTitle eyebrow="The story" />
              <div
                className="sg-text sg-dropcap"
                lang={lang}
                style={{ lineHeight: 1.85, color: "#3A3532", whiteSpace: "pre-wrap" }}
              >
                {description}
              </div>
            </section>
          )}

          {/* Details */}
          {metaFields.length > 0 && (
            <section className="mt-14">
              <SectionTitle eyebrow="At a glance" />
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {metaFields.map(([key, val], i) => (
                  <div
                    key={key}
                    className="sg-reveal rounded-2xl border bg-white p-4"
                    style={{ borderColor: "var(--sg-line)", ["--d" as string]: `${i * 50}ms` }}
                  >
                    <dt className="sg-eyebrow text-[10px] text-stone-400">{META_LABELS[key] ?? key.replace(/_/g, " ")}</dt>
                    <dd className="mt-1.5 font-display text-lg font-semibold leading-snug text-stone-900">{val}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Gallery */}
          {artefact.images.length > 1 && (
            <section className="mt-14">
              <SectionTitle eyebrow={`Gallery · ${artefact.images.length} images`} />
              <ImageGallery images={artefact.images} title={title} />
            </section>
          )}

          {/* Video */}
          {artefact.videoUrl && (
            <section className="mt-14">
              <SectionTitle eyebrow="Watch" />
              <div className="overflow-hidden rounded-2xl shadow-xl shadow-stone-900/10">
                <VideoEmbed url={artefact.videoUrl} title={title} />
              </div>
            </section>
          )}

          {/* 3D model / AR */}
          {artefact.modelUrl && (
            <section className="mt-14">
              <SectionTitle eyebrow="In 3D · drag to rotate" />
              <div className="overflow-hidden rounded-2xl">
                <ModelViewer src={artefact.modelUrl} alt={`3D model of ${title}`} />
              </div>
            </section>
          )}

          {/* Where to find it */}
          {artefact.location && (
            <section className="sg-hero-bg sg-grain mt-14 overflow-hidden rounded-3xl p-6 text-white sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10" style={{ boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.3)" }}>
                  <MapPin className="h-5 w-5" style={{ color: "#E2C27A" }} />
                </span>
                <div>
                  <p className="sg-eyebrow text-[10px] text-stone-400">Where to find it</p>
                  <p className="mt-1 font-display text-2xl font-bold">{artefact.location.name}</p>
                  {artefact.category && <p className="mt-0.5 text-sm text-stone-400">{artefact.category.name}</p>}
                </div>
              </div>
              {artefact.location.floorPlanUrl && (
                <div className="relative mt-6 overflow-hidden rounded-2xl bg-white">
                  <img src={artefact.location.floorPlanUrl} alt={`Floor plan of ${artefact.location.name}`} className="block w-full" />
                  {artefact.mapX !== null && artefact.mapY !== null && (
                    <span
                      aria-label="This artefact is here"
                      className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      style={{ left: `${artefact.mapX}%`, top: `${artefact.mapY}%` }}
                    >
                      <span className="absolute h-6 w-6 animate-ping rounded-full opacity-60" style={{ background: "#C9A04A" }} />
                      <span className="relative h-4 w-4 rounded-full border-2 border-white shadow-lg" style={{ background: "#C9A04A" }} />
                    </span>
                  )}
                </div>
              )}
            </section>
          )}

          <FeedbackWidget publicId={artefact.uniquePublicId} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mx-auto mt-20 max-w-5xl px-5 sm:px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="sg-eyebrow" style={{ color: "var(--sg-gold-deep)" }}>Keep exploring</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">You might also like</h2>
              </div>
              <Link to="/explore" className="hidden text-sm font-semibold text-stone-700 hover:text-stone-900 sm:block">View all →</Link>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {related.map((r, i) => (
                <li key={r.uniquePublicId}>
                  <ArtefactCard a={r} index={i} href={`/a/${r.uniquePublicId}${langSuffix}`} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionTitle({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <p className="sg-eyebrow shrink-0" style={{ color: "var(--sg-gold-deep)" }}>{eyebrow}</p>
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, var(--sg-line), transparent)" }} />
    </div>
  );
}
