import { Link } from "react-router-dom";
import { ArrowRight, Compass, Headphones, QrCode, Route, Languages, Sparkles } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { LANGUAGES } from "@/lib/languages";
import { SiteHeader } from "@/components/visitor/SiteHeader";
import { SiteFooter } from "@/components/visitor/SiteFooter";
import { ArtefactCard } from "@/components/visitor/ArtefactCard";
import { ArtefactCover } from "@/components/visitor/ArtefactCover";


const STEPS = [
  { icon: QrCode, title: "Scan", text: "Point your phone at the QR code beside any object. No app to install." },
  { icon: Headphones, title: "Listen", text: "Hear its story read aloud in your language, at your own pace." },
  { icon: Compass, title: "Explore", text: "Follow a curated tour, save favourites, and discover related pieces." },
];

type CardData = {
  uniquePublicId: string;
  title: string;
  category: { name: string } | null;
  location: { name: string } | null;
  images: { imageUrl: string; altText: string | null }[];
};

interface HomeData {
  featured: CardData[];
  total: number;
  tours: { id: number; slug: string; title: string; _count: { stops: number } }[];
}

export default function HomePage() {
  useDocumentTitle("SmartGuide: every object has a story", "Scan, listen and explore. Your personal guide to the collection.");
  const { data } = useFetch<HomeData>("/api/v1/public/home");
  const featured = data?.featured ?? [];
  const total = data?.total ?? 0;
  const tours = data?.tours ?? [];

  const stack = featured.slice(0, 3);

  return (
    <div className="sg-visitor min-h-screen" style={{ background: "var(--sg-paper)", color: "var(--sg-text)" }}>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="sg-hero-bg sg-grain relative overflow-hidden text-white">
        <SiteHeader tone="dark" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pb-32">
          <div>
            <p className="sg-reveal sg-eyebrow flex items-center gap-2" style={{ color: "#E2C27A" }}>
              <Sparkles className="h-3.5 w-3.5" /> Your pocket curator
            </p>
            <h1
              className="sg-reveal mt-5 font-display font-bold leading-[1.02] tracking-tight"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.4rem)", ["--d" as string]: "80ms" }}
            >
              Every object
              <br />
              has a <em className="sg-gold-text font-display italic">story.</em>
            </h1>
            <p className="sg-reveal mt-6 max-w-md text-base leading-relaxed text-stone-300 sm:text-lg" style={{ ["--d" as string]: "160ms" }}>
              Scan a code beside any exhibit to hear it come alive, in your language and at your own pace.
            </p>
            <div className="sg-reveal mt-9 flex flex-wrap gap-3" style={{ ["--d" as string]: "240ms" }}>
              <Link to="/explore" className="sg-btn-gold">
                Explore the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/tours" className="sg-btn-ghost">
                <Route className="h-4 w-4" /> Guided tours
              </Link>
            </div>
            <dl className="sg-reveal mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6" style={{ ["--d" as string]: "320ms" }}>
              {[
                { k: "Artefacts", v: total },
                { k: "Languages", v: LANGUAGES.length },
                { k: "Tours", v: tours.length },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="text-xs text-stone-400">{s.k}</dt>
                  <dd className="mt-1 font-display text-3xl font-bold text-white">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Floating card stack */}
          {stack.length > 0 && (
            <div className="relative mx-auto hidden h-[480px] w-full max-w-[420px] lg:block" aria-hidden>
              {stack.map((a, i) => {
                const pos = [
                  { left: "0%", top: "8%", rotate: "-8deg", z: 1, delay: "0s" },
                  { left: "34%", top: "0%", rotate: "5deg", z: 3, delay: "-3s" },
                  { left: "18%", top: "38%", rotate: "-2deg", z: 2, delay: "-6s" },
                ][i];
                return (
                  <div
                    key={a.uniquePublicId}
                    className="sg-fade absolute w-[58%]"
                    style={{ left: pos.left, top: pos.top, zIndex: pos.z, ["--d" as string]: `${200 + i * 150}ms` }}
                  >
                    <div className="sg-float" style={{ animationDelay: pos.delay }}>
                      <div
                        className="relative aspect-[3/4] overflow-hidden rounded-2xl"
                        style={{
                          transform: `rotate(${pos.rotate})`,
                          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)",
                        }}
                      >
                        <ArtefactCover title={a.title} imageUrl={a.images[0]?.imageUrl} sizes="260px" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <p className="absolute inset-x-4 bottom-4 font-display text-lg font-semibold leading-tight text-white">{a.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div
                className="absolute -inset-10 -z-10 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(201,160,74,0.25), transparent 65%)" }}
              />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--sg-paper)] opacity-[0.06]" />
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <div className="max-w-xl">
          <p className="sg-eyebrow" style={{ color: "var(--sg-gold-deep)" }}>How it works</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Three steps to a richer visit</h2>
        </div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              className="sg-reveal group relative overflow-hidden rounded-3xl border bg-white p-7 transition-shadow hover:shadow-xl"
              style={{ borderColor: "var(--sg-line)", ["--d" as string]: `${i * 90}ms` }}
            >
              <span className="absolute -right-2 -top-6 font-display text-[7rem] font-bold leading-none text-stone-100 transition-colors group-hover:text-amber-50">
                {i + 1}
              </span>
              <span
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(140deg, #2A2520, #0D0C0B)", boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.3)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "#E2C27A" }} />
              </span>
              <h3 className="relative mt-6 font-display text-2xl font-bold">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-stone-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Featured ───────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="sg-eyebrow" style={{ color: "var(--sg-gold-deep)" }}>From the collection</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Recently added</h2>
            </div>
            <Link to="/explore" className="group flex items-center gap-1.5 text-sm font-semibold text-stone-800">
              View all {total}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
            {featured.map((a, i) => (
              <li key={a.uniquePublicId}><ArtefactCard a={a} index={i} /></li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Tours band ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <div className="sg-hero-bg sg-grain relative overflow-hidden rounded-[2rem] px-7 py-12 text-white sm:px-12 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="sg-eyebrow" style={{ color: "#E2C27A" }}>Guided tours</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Let us show you around</h2>
              <p className="mt-4 max-w-md text-stone-300">
                Curated routes through the galleries, with every stop narrated. Step to the next object with a tap.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/tours" className="sg-btn-gold">Browse tours <ArrowRight className="h-4 w-4" /></Link>
                <span className="flex items-center gap-2 text-sm text-stone-400">
                  <Languages className="h-4 w-4" /> Available in {LANGUAGES.length} languages
                </span>
              </div>
            </div>
            <ul className="space-y-3">
              {tours.length === 0 ? (
                <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-stone-400">
                  New tours are being prepared by our curators. Check back soon.
                </li>
              ) : (
                tours.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/tours/${t.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.07]"
                    >
                      <Route className="h-5 w-5 shrink-0" style={{ color: "#E2C27A" }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-semibold">{t.title}</p>
                        <p className="text-xs text-stone-400">{t._count.stops} stops</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-stone-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
