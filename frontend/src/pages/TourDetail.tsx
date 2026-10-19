import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useParams } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import NotFoundPage from "./NotFound";
import { SiteHeader } from "@/components/visitor/SiteHeader";
import { SiteFooter } from "@/components/visitor/SiteFooter";
import { ArtefactCover } from "@/components/visitor/ArtefactCover";

interface TourData {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  stops: {
    id: number;
    note: string | null;
    artefact: { uniquePublicId: string; title: string; location: { name: string } | null; images: { imageUrl: string }[] };
  }[];
}

export default function TourPage() {
  const { slug } = useParams() as { slug: string };
  const { data, loading, notFound } = useFetch<{ tour: TourData }>(`/api/v1/public/tours/${encodeURIComponent(slug)}`);
  const tour = data?.tour;
  useDocumentTitle(tour ? `${tour.title} — SmartGuide` : notFound ? "Tour not found — SmartGuide" : null);
  if (notFound) return <NotFoundPage />;
  if (loading || !tour) return <div className="sg-hero-bg min-h-screen" />;
  const first = tour.stops[0];

  return (
    <div className="sg-visitor min-h-screen" style={{ background: "var(--sg-paper)", color: "var(--sg-text)" }}>
      <section className="sg-hero-bg sg-grain text-white">
        <SiteHeader tone="dark" />
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-10">
          <Link to="/tours" className="sg-reveal inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All tours
          </Link>
          <p className="sg-reveal sg-eyebrow mt-8" style={{ color: "#E2C27A", ["--d" as string]: "40ms" }}>
            Guided tour · {tour.stops.length} stops
          </p>
          <h1 className="sg-reveal mt-3 font-display font-bold leading-tight tracking-tight" style={{ fontSize: "clamp(2.3rem, 6vw, 3.8rem)", ["--d" as string]: "80ms" }}>
            {tour.title}
          </h1>
          {tour.description && (
            <p className="sg-reveal mt-4 max-w-xl whitespace-pre-wrap leading-relaxed text-stone-300" style={{ ["--d" as string]: "120ms" }}>
              {tour.description}
            </p>
          )}
          {first && (
            <Link
              to={`/a/${first.artefact.uniquePublicId}?tour=${tour.slug}`}
              className="sg-reveal sg-btn-gold mt-8"
              style={{ ["--d" as string]: "160ms" }}
            >
              <Play className="h-4 w-4" fill="currentColor" /> Start the tour
            </Link>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-6 pt-12">
        <ol className="relative">
          <span className="absolute bottom-6 left-[19px] top-6 w-px" style={{ background: "linear-gradient(var(--sg-gold), var(--sg-line))" }} aria-hidden />
          {tour.stops.map((s, i) => (
            <li key={s.id} className="sg-reveal relative pb-5 pl-14" style={{ ["--d" as string]: `${i * 60}ms` }}>
              <span
                className="absolute left-0 top-5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold tabular-nums"
                style={{ background: "linear-gradient(135deg, #F0D58F, #C9A04A)", color: "#1A1408", boxShadow: "0 0 0 5px var(--sg-paper)" }}
              >
                {i + 1}
              </span>
              <Link
                to={`/a/${s.artefact.uniquePublicId}?tour=${tour.slug}`}
                className="sg-lift group flex items-center gap-4 overflow-hidden rounded-2xl border bg-white p-3 pr-5"
                style={{ borderColor: "var(--sg-line)" }}
              >
                <div className="sg-zoom relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-900">
                  <ArtefactCover title={s.artefact.title} imageUrl={s.artefact.images[0]?.imageUrl} sizes="80px" thumb />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold">{s.artefact.title}</p>
                  {s.artefact.location && <p className="text-xs text-stone-500">{s.artefact.location.name}</p>}
                  {s.note && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{s.note}</p>}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-stone-900" />
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
