import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

export function FavoriteButton({ publicId }: { publicId: string }) {
  const { has, toggle, ready } = useFavorites();
  const on = ready && has(publicId);
  return (
    <button
      onClick={() => toggle(publicId)}
      aria-pressed={on}
      aria-label={on ? "Remove from favourites" : "Save to favourites"}
      className="flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-90"
      style={{
        borderColor: on ? "rgba(226,194,122,0.6)" : "rgba(255,255,255,0.14)",
        background: on ? "rgba(201,160,74,0.2)" : "rgba(255,255,255,0.06)",
      }}
    >
      <Heart
        className={`h-4 w-4 transition-transform ${on ? "scale-110" : ""}`}
        style={{ color: on ? "#E2C27A" : "#D6D3D1" }}
        fill={on ? "#E2C27A" : "none"}
      />
    </button>
  );
}
