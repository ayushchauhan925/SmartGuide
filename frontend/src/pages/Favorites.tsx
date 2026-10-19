import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { ArtefactCard, type CardArtefact } from "@/components/visitor/ArtefactCard";
import { SiteHeader } from "@/components/visitor/SiteHeader";

export default function FavoritesPage() {
  const { ids, ready } = useFavorites();
  const [items, setItems] = useState<CardArtefact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetch(`/api/v1/public/artefacts?ids=${ids.join(",")}&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        const byId = new Map<string, CardArtefact>(d.artefacts.map((a: CardArtefact) => [a.uniquePublicId, a]));
        setItems(ids.map((id) => byId.get(id)).filter((x): x is CardArtefact => !!x));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [ids, ready]);

  return (
    <div className="sg-visitor min-h-screen" style={{ background: "var(--sg-paper)", color: "var(--sg-text)" }}>
      <section className="sg-hero-bg sg-grain text-white">
        <SiteHeader tone="dark" />
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-12">
          <p className="sg-reveal sg-eyebrow" style={{ color: "#E2C27A" }}>Your collection</p>
          <h1 className="sg-reveal mt-3 font-display font-bold tracking-tight" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", ["--d" as string]: "60ms" }}>
            Saved <em className="sg-gold-text italic">favourites</em>
          </h1>
          <p className="sg-reveal mt-3 text-sm text-stone-400" style={{ ["--d" as string]: "120ms" }}>
            Kept privately on this device. No account needed.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        {loading ? (
          <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200/70" />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="mx-auto mt-6 flex max-w-sm flex-col items-center text-center">
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(201,160,74,0.12)" }}>
              <Heart className="h-8 w-8" style={{ color: "#C9A04A" }} strokeWidth={1.5} />
            </span>
            <p className="mt-5 font-display text-2xl font-bold">Nothing saved yet</p>
            <p className="mt-1 text-sm text-stone-500">Tap the heart on any artefact to keep it here for later.</p>
            <Link to="/explore" className="sg-btn-gold mt-6">Start exploring <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {items.map((a, i) => (
              <li key={a.uniquePublicId}><ArtefactCard a={a} index={i} /></li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
