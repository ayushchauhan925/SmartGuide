import { Link } from "react-router-dom";
import { ArrowRight, Route, MapPinned } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SiteHeader } from "@/components/visitor/SiteHeader";
import { SiteFooter } from "@/components/visitor/SiteFooter";
import { ArtefactCover } from "@/components/visitor/ArtefactCover";


interface TourRow {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  _count: { stops: number };
  stops: { artefact: { title: string; images: { imageUrl: string }[] } }[];
}

export default function ToursPage() {
  useDocumentTitle("Guided tours — SmartGuide");
  const { data, loading } = useFetch<{ tours: TourRow[] }>("/api/v1/public/tours");
  const tours = data?.tours ?? [];

  return (
    <div className="sg-visitor min-h-screen" style={{ background: "var(--sg-paper)", color: "var(--sg-text)" }}>
      <section className="sg-hero-bg sg-grain text-white">
        <SiteHeader tone="dark" />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-16">
          <p className="sg-reveal sg-eyebrow" style={{ color: "#E2C27A" }}>Guided tours</p>
          <h1 className="sg-reveal mt-3 max-w-2xl font-display font-bold tracking-tight" style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", ["--d" as string]: "60ms" }}>
            Follow a <em className="sg-gold-text italic">curated</em> path
          </h1>
          <p className="sg-reveal mt-4 max-w-lg text-stone-300" style={{ ["--d" as string]: "120ms" }}>
            Hand-picked routes through the galleries. Each stop is narrated, and the next one is a tap away.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pt-12">
        {loading && !data ? (
          <ul className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => <li key={i} className="h-80 animate-pulse rounded-3xl bg-stone-200/70" />)}
          </ul>
        ) : tours.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200/60">
              <MapPinned className="h-7 w-7 text-stone-400" strokeWidth={1.5} />
            </span>
            <p className="mt-5 font-display text-2xl font-bold">Tours are on their way</p>
            <p className="mt-1 text-sm text-stone-500">Our curators are preparing guided routes. Meanwhile, explore at your own pace.</p>
            <Link to="/explore" className="sg-btn-gold mt-6">Explore the collection <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {tours.map((t, i) => (
              <li key={t.id}>
                <Link
                  to={`/tours/${t.slug}`}
                  className="sg-reveal sg-lift group flex h-full flex-col overflow-hidden rounded-3xl border bg-white"
                  style={{ borderColor: "var(--sg-line)", ["--d" as string]: `${i * 80}ms` }}
                >
                  <div className="relative flex h-44 gap-1 overflow-hidden bg-stone-900">
                    {(t.stops.length ? t.stops : [null]).map((s, k) => (
                      <div key={k} className="sg-zoom relative flex-1 overflow-hidden">
                        <ArtefactCover title={s?.artefact.title ?? t.title} imageUrl={s?.artefact.images[0]?.imageUrl} sizes="200px" />
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute bottom-4 left-5 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                      <Route className="h-3.5 w-3.5" style={{ color: "#E2C27A" }} /> {t._count.stops} {t._count.stops === 1 ? "stop" : "stops"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-2xl font-bold">{t.title}</h2>
                    {t.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{t.description}</p>}
                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold" style={{ color: "var(--sg-gold-deep)" }}>
                      Start tour <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
