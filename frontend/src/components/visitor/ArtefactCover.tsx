import Image from "@/components/ui/Img";

/** Museum-inspired palettes: terracotta, verdigris, lapis, oxblood, ochre, slate. */
const PALETTES = [
  { from: "#3B1F14", to: "#8A4A2B", accent: "#E8B48A" },
  { from: "#0F2A27", to: "#2F6B60", accent: "#9FD3C2" },
  { from: "#121A33", to: "#2E4A8C", accent: "#A9BDF0" },
  { from: "#2A0E12", to: "#7A2430", accent: "#F0A7AE" },
  { from: "#2B2010", to: "#8C6A26", accent: "#F1D58E" },
  { from: "#17191C", to: "#4A525C", accent: "#C9D1DA" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

interface Props {
  title: string;
  imageUrl?: string | null;
  alt?: string | null;
  sizes?: string;
  priority?: boolean;
  /** Larger monogram for hero usage */
  hero?: boolean;
  /** Small square thumbnails: centred, smaller monogram */
  thumb?: boolean;
  className?: string;
}

/** The artefact's photo, or a generated "museum plate" cover when there is none. */
export function ArtefactCover({ title, imageUrl, alt, sizes = "(max-width: 640px) 100vw, 400px", priority, hero, thumb, className = "" }: Props) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt ?? title}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover ${className}`}
      />
    );
  }

  const h = hash(title);
  const p = PALETTES[h % PALETTES.length];
  const letter = title.trim().charAt(0).toUpperCase() || "•";
  const rot = (h % 40) - 20;

  return (
    <div
      aria-hidden
      className={`sg-zoom-target absolute inset-0 overflow-hidden ${className}`}
      style={{ background: `radial-gradient(120% 90% at 30% 20%, ${p.to} 0%, ${p.from} 70%)` }}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke={p.accent} strokeWidth="0.8" transform={`rotate(${rot} 200 150)`}>
          {Array.from({ length: 9 }).map((_, i) => (
            <circle key={i} cx="290" cy="80" r={30 + i * 26} />
          ))}
        </g>
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(80% 60% at 50% 110%, rgba(0,0,0,0.55), transparent 70%)" }}
      />
      {thumb ? (
        <span
          className="absolute inset-0 flex items-center justify-center font-display text-[1.35rem] font-bold leading-none select-none"
          style={{ color: p.accent, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
        >
          {letter}
        </span>
      ) : (
        <span
          className="absolute font-display font-bold leading-none select-none"
          style={{
            color: p.accent,
            opacity: 0.9,
            fontSize: hero ? "clamp(9rem, 28vw, 18rem)" : "clamp(4rem, 12vw, 7rem)",
            right: hero ? "6%" : "7%",
            top: hero ? "14%" : "4%",
            textShadow: "0 10px 40px rgba(0,0,0,0.35)",
          }}
        >
          {letter}
        </span>
      )}
    </div>
  );
}
