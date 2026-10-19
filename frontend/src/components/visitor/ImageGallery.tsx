import { useState } from "react";
import Image from "@/components/ui/Img";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
  id: number;
  imageUrl: string;
  altText: string | null;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) return null;

  const current = lightbox !== null ? images[lightbox] : null;

  return (
    <>
      {/* Thumbnail strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightbox(i)}
            aria-label={`View image ${i + 1}: ${img.altText ?? title}`}
            className={`sg-zoom group relative overflow-hidden rounded-xl bg-stone-200 ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            style={{ aspectRatio: "1 / 1" }}
          >
            <Image
              src={img.imageUrl}
              alt={img.altText ?? title}
              fill
              className="object-cover"
              sizes={i === 0 ? "(max-width: 640px) 66vw, 400px" : "200px"}
              loading="lazy"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {current && lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(20,18,16,0.96)" }}
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Close"
            className="absolute top-4 right-4 flex items-center justify-center transition-colors"
            style={{ color: "#78716C" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E7E5E0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#78716C")}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 text-xs tabular-nums"
            style={{ color: "#78716C", fontVariantNumeric: "tabular-nums" }}
          >
            {lightbox + 1} / {images.length}
          </div>

          {/* Prev */}
          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l! - 1); }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
              style={{ color: "#57534E" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E7E5E0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#57534E")}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Next */}
          {lightbox < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((l) => l! + 1); }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
              style={{ color: "#57534E" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E7E5E0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#57534E")}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative flex items-center justify-center px-16"
            style={{ maxWidth: "100vw", maxHeight: "85vh", width: "100%", height: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.imageUrl}
              alt={current.altText ?? title}
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "3px",
              }}
            />
          </div>

          {/* Alt text caption */}
          {current.altText && (
            <p
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-center px-4"
              style={{ color: "#57534E", maxWidth: "40ch" }}
            >
              {current.altText}
            </p>
          )}
        </div>
      )}
    </>
  );
}
