import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import type { Artefact } from "@/lib/types";
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw, Volume2, MapPin, Tag } from "lucide-react";

export default function VisitorPage() {
  const { uniquePublicId } = useParams<{ uniquePublicId: string }>();
  const [artefact, setArtefact] = useState<Artefact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeThumb, setActiveThumb] = useState(0);

  useEffect(() => {
    fetch(`/api/v1/public/a/${uniquePublicId}`, { credentials: "include" })
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => { if (d) setArtefact(d.artefact); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [uniquePublicId]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight" && artefact) setLightboxIndex(i => i !== null ? (i + 1) % artefact.images.length : null);
      if (e.key === "ArrowLeft" && artefact) setLightboxIndex(i => i !== null ? (i - 1 + artefact.images.length) % artefact.images.length : null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, artefact]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #E8E5DF", borderTopColor: "#B8861E", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 14, color: "#9C9488" }}>Loading…</p>
      </div>
    </div>
  );

  if (notFound || !artefact) return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F2F0EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <X size={22} color="#9C9488" />
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: "#18120E", marginBottom: 8, textAlign: "center" }}>Artefact not found</h1>
      <p style={{ fontSize: 14, color: "#9C9488", textAlign: "center", maxWidth: 320 }}>This QR code may be inactive or the artefact has been removed from the collection.</p>
    </div>
  );

  const meta = artefact.metadata as Record<string, string> | null;
  const displayImage = artefact.images[activeThumb] ?? artefact.images[0];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero image */}
      {displayImage && (
        <div style={{ background: "#EDEBE5", position: "relative", overflow: "hidden", cursor: "zoom-in" }} onClick={() => setLightboxIndex(activeThumb)}>
          <img
            src={displayImage.imageUrl}
            alt={displayImage.altText ?? artefact.title}
            style={{ width: "100%", maxHeight: "65vh", objectFit: "contain", display: "block", transition: "opacity 0.2s" }}
          />
          {artefact.images.length > 1 && (
            <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(24,18,14,0.55)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 20, fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              {activeThumb + 1} / {artefact.images.length}
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 72px" }}>

        {/* Thumbnail strip */}
        {artefact.images.length > 1 && (
          <div style={{ display: "flex", gap: 8, padding: "14px 0", overflowX: "auto", scrollbarWidth: "none" }}>
            {artefact.images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveThumb(idx)}
                style={{
                  flexShrink: 0, width: 64, height: 64, padding: 0, cursor: "pointer",
                  border: `2px solid ${activeThumb === idx ? "#B8861E" : "#E8E5DF"}`,
                  borderRadius: 8, overflow: "hidden", background: "none",
                  transition: "border-color 0.15s", opacity: activeThumb === idx ? 1 : 0.65,
                }}
              >
                <img src={img.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
        )}

        {/* Title block */}
        <div style={{ paddingTop: artefact.images.length > 1 ? 8 : 28, paddingBottom: 4 }}>
          {(artefact.category || artefact.location) && (
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              {artefact.category && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "#9C9488", fontWeight: 600 }}>
                  <Tag size={11} />
                  {artefact.category.name}
                </span>
              )}
              {artefact.location && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "#9C9488", fontWeight: 600 }}>
                  <MapPin size={11} />
                  {artefact.location.name}
                </span>
              )}
            </div>
          )}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 400, lineHeight: 1.2, color: "#18120E", marginBottom: 0 }}>
            {artefact.title}
          </h1>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#E8E5DF", margin: "22px 0" }} />

        {/* Description */}
        {artefact.description && (
          <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "#3C3028", marginBottom: 28 }}>
            {artefact.description}
          </p>
        )}

        {/* Metadata table */}
        {meta && Object.keys(meta).length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9C9488", marginBottom: 14 }}>Details</h2>
            <dl>
              {Object.entries(meta).map(([k, v]) => (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid #EDEAE4" }}>
                  <dt style={{ fontSize: 12.5, textTransform: "capitalize", color: "#9C9488", fontWeight: 500, paddingTop: 1 }}>{k}</dt>
                  <dd style={{ fontSize: 14, color: "#18120E" }}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Location card */}
        {artefact.location && (
          <div style={{ marginBottom: 28, padding: "16px 18px", background: "#EFEDE8", borderRadius: 10, border: "1px solid #E0DDD6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <MapPin size={13} color="#9C9488" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9C9488" }}>
                {artefact.location.type ?? "Location"}
              </span>
            </div>
            <p style={{ fontSize: 14.5, color: "#18120E", fontWeight: 500 }}>{artefact.location.name}</p>
            {artefact.location.description && (
              <p style={{ fontSize: 13, color: "#5C5549", marginTop: 4, lineHeight: 1.55 }}>{artefact.location.description}</p>
            )}
          </div>
        )}

        {/* Audio guide */}
        {artefact.audio && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9C9488", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Volume2 size={12} /> Audio Guide
            </h2>
            <AudioPlayer src={artefact.audio.audioUrl} />
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && artefact.images[lightboxIndex] && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(14,11,9,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLightboxIndex(null)}
        >
          <button onClick={() => setLightboxIndex(null)} style={{ position: "absolute", top: 18, right: 18, width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>

          {artefact.images.length > 1 && <>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i - 1 + artefact.images.length) % artefact.images.length : null); }}
              style={{ ...lbNavBtn, left: 16 }}
            ><ChevronLeft size={22} /></button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i + 1) % artefact.images.length : null); }}
              style={{ ...lbNavBtn, right: 16 }}
            ><ChevronRight size={22} /></button>
          </>}

          <img
            src={artefact.images[lightboxIndex].imageUrl}
            alt={artefact.images[lightboxIndex].altText ?? ""}
            style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />

          {(artefact.images[lightboxIndex].altText || artefact.images.length > 1) && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              {artefact.images[lightboxIndex].altText && <p style={{ color: "#9C9488", fontSize: 13, marginBottom: 6, maxWidth: 500, lineHeight: 1.5 }}>{artefact.images[lightboxIndex].altText}</p>}
              {artefact.images.length > 1 && <p style={{ color: "#4A4440", fontSize: 12 }}>{lightboxIndex + 1} of {artefact.images.length}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const lbNavBtn: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
};

function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const pct = duration ? (progress / duration) * 100 : 0;

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    playing ? a.pause() : a.play();
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = ref.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const cycleSpeed = () => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div style={{ background: "#18120E", borderRadius: 14, padding: "20px 22px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <audio ref={ref} src={src}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <button onClick={toggle} style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: playing ? "#B8861E" : "rgba(184,134,30,0.15)",
          border: "1px solid rgba(184,134,30,0.3)",
          cursor: "pointer", color: playing ? "#fff" : "#D4A840",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}>
          {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
        </button>

        <div style={{ flex: 1 }}>
          {/* Progress bar */}
          <div onClick={seek} style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, cursor: "pointer", position: "relative", marginBottom: 7 }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#B8861E", borderRadius: 2, transition: "width 0.1s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4A4440", fontVariantNumeric: "tabular-nums" }}>
            <span>{fmt(progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => { if (ref.current) { ref.current.currentTime = 0; setProgress(0); } }} style={{ background: "none", border: "none", cursor: "pointer", color: "#4A4440", padding: 4, display: "flex" }}>
            <RotateCcw size={13} />
          </button>
          <button onClick={cycleSpeed} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer", color: "#9C8E82", padding: "3px 8px", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>
            {speed}×
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: playing ? "#B8861E" : "#2E2A28", transition: "background 0.3s" }} />
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4A4440", fontWeight: 600 }}>
          {playing ? "Now playing" : "Audio guide"}
        </span>
      </div>
    </div>
  );
}
