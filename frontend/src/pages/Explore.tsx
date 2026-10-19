import { Link } from "react-router-dom";
import { Search, SearchX, MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ArtefactCard } from "@/components/visitor/ArtefactCard";
import { SiteHeader } from "@/components/visitor/SiteHeader";
import { SiteFooter } from "@/components/visitor/SiteFooter";


type CardData = {
  uniquePublicId: string;
  title: string;
  category: { name: string } | null;
  location: { name: string } | null;
  images: { imageUrl: string; altText: string | null }[];
};

interface ExploreData {
  artefacts: CardData[];
  total: number;
  pages: number;
  categories: { id: number; name: string }[];
  locations: { id: number; name: string }[];
}

export default function ExplorePage() {
  useDocumentTitle("Explore — SmartGuide", "Browse and search the collection");
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    new FormData(e.currentTarget).forEach((v, k) => {
      if (typeof v === "string" && v.trim()) params.set(k, v.trim());
    });
    navigate(`/explore${params.size ? `?${params}` : ""}`);
  };
  const q = sp.get("q")?.trim() ?? "";
  const categoryId = parseInt(sp.get("category") ?? "");
  const locationId = parseInt(sp.get("location") ?? "");
  const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1);

  const { data, loading } = useFetch<ExploreData>(`/api/v1/public/explore?${sp.toString()}`);
  const artefacts = data?.artefacts ?? [];
  const total = data?.total ?? 0;
  const categories = data?.categories ?? [];
  const locations = data?.locations ?? [];

  const pages = data?.pages ?? 0;
  const link = (overrides: { category?: number | null; page?: number }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const cat = overrides.category !== undefined ? overrides.category : Number.isFinite(categoryId) ? categoryId : null;
    if (cat !== null) params.set("category", String(cat));
    if (Number.isFinite(locationId)) params.set("location", String(locationId));
    if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));
    const s = params.toString();
    return `/explore${s ? `?${s}` : ""}`;
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
      active
        ? "bg-white text-stone-900 shadow-[0_8px_24px_-10px_rgba(226,194,122,0.8)]"
        : "border border-white/10 bg-white/[0.04] text-stone-300 hover:bg-white/[0.09] hover:text-white"
    }`;

  return (
    <div className="sg-visitor min-h-screen" style={{ background: "var(--sg-paper)", color: "var(--sg-text)" }}>
      <section className="sg-hero-bg sg-grain text-white">
        <SiteHeader tone="dark" />
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-12 sm:pt-16">
          <p className="sg-reveal sg-eyebrow" style={{ color: "#E2C27A" }}>The collection</p>
          <h1
            className="sg-reveal mt-3 font-display font-bold tracking-tight"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", ["--d" as string]: "60ms" }}
          >
            Explore the <em className="sg-gold-text italic">galleries</em>
          </h1>

          <form key={sp.toString()} method="get" action="/explore" role="search" onSubmit={onSearch} className="sg-reveal mt-8" style={{ ["--d" as string]: "140ms" }}>
            {Number.isFinite(categoryId) && <input type="hidden" name="category" value={categoryId} />}
            <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name, era, material…"
                  aria-label="Search artefacts"
                  className="w-full rounded-full bg-transparent py-3 pl-11 pr-4 text-[15px] text-white placeholder:text-stone-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <select
                    name="location"
                    defaultValue={Number.isFinite(locationId) ? locationId : ""}
                    aria-label="Location"
                    className="w-full appearance-none rounded-full border border-white/10 bg-black/20 py-3 pl-10 pr-5 text-sm text-stone-200 focus:outline-none sm:w-52"
                  >
                    <option value="">All locations</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="sg-btn-gold !px-6 !py-3">Search</button>
              </div>
            </div>
          </form>

          {categories.length > 0 && (
            <nav className="sg-reveal sg-no-scrollbar -mx-6 mt-6 flex gap-2 overflow-x-auto px-6" aria-label="Categories" style={{ ["--d" as string]: "220ms" }}>
              <Link to={link({ category: null })} className={chip(!Number.isFinite(categoryId))}>All</Link>
              {categories.map((c) => (
                <Link key={c.id} to={link({ category: c.id })} className={chip(categoryId === c.id)}>
                  {c.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-stone-500">
            <span className="font-semibold text-stone-900">{total}</span> {total === 1 ? "object" : "objects"}
            {q && <> matching <span className="font-semibold text-stone-900">&ldquo;{q}&rdquo;</span></>}
          </p>
          {(q || Number.isFinite(categoryId) || Number.isFinite(locationId)) && (
            <Link to="/explore" className="text-sm font-medium text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline">
              Clear filters
            </Link>
          )}
        </div>

        {loading && !data ? (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200/70" />
            ))}
          </ul>
        ) : artefacts.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-200/60">
              <SearchX className="h-7 w-7 text-stone-400" strokeWidth={1.5} />
            </span>
            <p className="mt-5 font-display text-2xl font-bold">Nothing found</p>
            <p className="mt-1 text-sm text-stone-500">Try a different word or clear the filters.</p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {artefacts.map((a, i) => (
              <li key={a.uniquePublicId}><ArtefactCard a={a} index={i} /></li>
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
            {page > 1 && (
              <Link to={link({ page: page - 1 })} className="rounded-full border border-stone-300 px-5 py-2 font-medium hover:bg-white">
                ← Previous
              </Link>
            )}
            <span className="px-3 text-stone-500">Page {page} of {pages}</span>
            {page < pages && (
              <Link to={link({ page: page + 1 })} className="rounded-full border border-stone-300 px-5 py-2 font-medium hover:bg-white">
                Next →
              </Link>
            )}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
