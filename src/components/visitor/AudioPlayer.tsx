"use client";
import { useRef, useState, useEffect } from "react";
import { Headphones, Loader2, Play, Pause, Volume2, VolumeX } from "lucide-react";

function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WAVEFORM = [28,52,38,72,48,64,36,60,32,68,44,78,40,55,65,36,82,50,60,42,70,46,74,56,38,64,50,78,42,60,46,30];

interface AudioPlayerProps {
  src: string;
  duration?: number | null;
}

export function AudioPlayer({ src, duration: initialDuration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(initialDuration ?? 0);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => { setDuration(audio.duration); setLoading(false); };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnded = () => setPlaying(false);
    const onError = () => { setError(true); setLoading(false); };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { await audio.play(); setPlaying(true); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = parseFloat(e.target.value);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  };

  if (error) return null;

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: "linear-gradient(145deg, #1a1613, #111110)" }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-8 w-8 rounded-lg bg-stone-800 border border-white/10 flex items-center justify-center">
          <Headphones className="h-4 w-4 text-[#D4A840]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-300">
            Audio Guide
          </p>
          <p className="text-[10px] text-stone-600 mt-0.5">
            {formatTime(duration)} · Professional narration
          </p>
        </div>
      </div>

      {/* Waveform + seek */}
      <div className="relative mb-4">
        {/* Visual waveform */}
        <div className="flex items-center gap-[2px] h-10 mb-2" aria-hidden>
          {WAVEFORM.map((h, i) => {
            const active = (i / WAVEFORM.length) * 100 <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors duration-75"
                style={{
                  height: `${h * 0.38}px`,
                  background: active ? "#C0952C" : "rgba(255,255,255,0.08)",
                }}
              />
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-[10px] text-stone-600 tabular-nums">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Hidden range input for accessibility */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={current}
          onChange={seek}
          aria-label="Seek audio"
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={loading}
          aria-label={playing ? "Pause audio guide" : "Play audio guide"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C0952C] text-white shadow-md hover:bg-[#A97E25] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 translate-x-0.5" fill="currentColor" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="h-1 w-full rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C0952C] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
          className="text-stone-600 hover:text-stone-400 transition-colors"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
