import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";

function formatTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [1, 1.5, 2] as const;

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
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => { setDuration(audio.duration); setLoading(false); };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrent(0); };
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

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { await audio.play(); setPlaying(true); }
  }, [playing]);

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

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    audio.playbackRate = next;
    setSpeed(next);
  };

  if (error) return null;

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className="overflow-hidden"
style={{ background: "radial-gradient(120% 140% at 0% 0%, #2A231B 0%, #141210 45%, #0D0C0B 100%)", borderRadius: 20, border: "1px solid rgba(226,194,122,0.14)", boxShadow: "0 24px 50px -28px rgba(0,0,0,0.7)" }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Label row */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: playing ? "#C0952C" : "#3C3A38" }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "#78716C" }}
          >
            Audio Guide
          </span>
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: "#57534E" }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Progress bar — clickable */}
      <div className="relative px-4 pt-3 pb-1">
        <div
          className="relative h-0.5 w-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)", borderRadius: "1px" }}
        >
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-75"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #A9802E, #E2C27A)" }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={current}
          onChange={seek}
          aria-label="Seek audio"
          className="absolute inset-x-4 top-2.5 h-4 opacity-0 cursor-pointer"
          style={{ margin: 0 }}
        />
      </div>

      {/* Time */}
      <div className="flex justify-between px-4 pt-0.5 pb-3">
        <span className="text-[10px] tabular-nums" style={{ color: "#44403C" }}>{formatTime(current)}</span>
        <span className="text-[10px] tabular-nums" style={{ color: "#44403C" }}>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div
        className="flex items-center justify-between px-4 pb-4"
      >
        {/* Speed */}
        <button
          onClick={cycleSpeed}
          aria-label={`Playback speed: ${speed}x`}
          className="flex items-center justify-center transition-colors"
          style={{
            width: "36px",
            height: "24px",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: speed !== 1 ? "#C0952C" : "#44403C",
            background: "transparent",
            border: "none",
          }}
        >
          {speed}×
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          disabled={loading}
          aria-label={playing ? "Pause" : "Play audio guide"}
          className="flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #F0D58F 0%, #C9A04A 60%, #A9802E 100%)", color: "#1A1408", border: "none", boxShadow: "0 0 0 6px rgba(201,160,74,0.12), 0 10px 24px -8px rgba(201,160,74,0.8)" }}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4" style={{ transform: "translateX(1.5px)" }} fill="currentColor" />
          )}
        </button>

        {/* Mute */}
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="flex items-center justify-center transition-colors"
          style={{
            width: "36px",
            height: "24px",
            color: muted ? "#C0952C" : "#44403C",
            background: "transparent",
            border: "none",
          }}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
