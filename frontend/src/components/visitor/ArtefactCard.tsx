import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { ArtefactCover } from "./ArtefactCover";

export interface CardArtefact {
  uniquePublicId: string;
  title: string;
  category?: { name: string } | null;
  location?: { name: string } | null;
  images: { imageUrl: string; altText?: string | null }[];
}

export function ArtefactCard({ a, index = 0, href }: { a: CardArtefact; index?: number; href?: string }) {
  const img = a.images[0];
  return (
    <Link
      to={href ?? `/a/${a.uniquePublicId}`}
      className="sg-reveal sg-lift sg-zoom group relative block overflow-hidden rounded-2xl bg-stone-900"
      style={{ ["--d" as string]: `${Math.min(index, 8) * 70}ms`, boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset" }}
    >
      <div className="relative aspect-[4/5]">
        <ArtefactCover title={a.title} imageUrl={img?.imageUrl} alt={img?.altText} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <span className="absolute right-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          {a.category && (
            <p className="sg-eyebrow mb-1.5 text-[10px]" style={{ color: "#E2C27A" }}>{a.category.name}</p>
          )}
          <p className="font-display text-lg font-semibold leading-snug text-white sm:text-xl line-clamp-2">{a.title}</p>
          {a.location && <p className="mt-1 truncate text-xs text-stone-300/80">{a.location.name}</p>}
        </div>
      </div>
    </Link>
  );
}
