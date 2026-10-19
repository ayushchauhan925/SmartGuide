import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Headphones } from "lucide-react";
import { speechLang } from "@/lib/languages";

const RATES = [0.8, 1, 1.25, 1.5] as const;

function splitIntoChunks(text: string, max = 180): string[] {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?।。！？]+[.!?।。！？]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (s.length > max) {
      if (buf.trim()) chunks.push(buf.trim());
      buf = "";
      const parts = s.match(new RegExp(`.{1,${max}}(\\s|$)`, "g")) ?? [s];
      chunks.push(...parts.map((p) => p.trim()).filter(Boolean));
      continue;
    }
    if ((buf + s).length > max && buf) {
      chunks.push(buf.trim());
      buf = "";
    }
    buf += s;
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

interface Props {
  text: string;
  lang: string;
  title?: string;
}

/** Reads artefact text aloud using the browser's Web Speech API (no server cost). */
export function TextToSpeech({ text, lang, title }: Props) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRate] = useState<number>(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [progress, setProgress] = useState(0);

  const runId = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  const bcp47 = speechLang(lang);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const synth = window.speechSynthesis;
    const load = () => {
      const prefix = bcp47.split("-")[0];
      const matching = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith(prefix));
      setVoices(matching);
      setVoiceURI((cur) => (matching.some((v) => v.voiceURI === cur) ? cur : matching[0]?.voiceURI ?? ""));
    };
    load();
    synth.addEventListener("voiceschanged", load);
    const stopAll = () => synth.cancel();
    window.addEventListener("pagehide", stopAll);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      window.removeEventListener("pagehide", stopAll);
    };
  }, [bcp47]);

  // Stop speaking when the text/language changes or the component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        runId.current++;
        window.speechSynthesis.cancel();
      }
    };
  }, [text, lang]);

  const speakFrom = useCallback(
    (index: number, speechRate: number, uri: string) => {
      const synth = window.speechSynthesis;
      const myRun = ++runId.current;
      synth.cancel();
      const chunks = chunksRef.current;
      indexRef.current = index;

      const next = () => {
        if (runId.current !== myRun) return;
        const i = indexRef.current;
        if (i >= chunks.length) {
          setStatus("idle");
          setProgress(0);
          indexRef.current = 0;
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = bcp47;
        u.rate = speechRate;
        const voice = synth.getVoices().find((v) => v.voiceURI === uri);
        if (voice) u.voice = voice;
        u.onend = () => {
          if (runId.current !== myRun) return;
          indexRef.current = i + 1;
          setProgress(((i + 1) / chunks.length) * 100);
          next();
        };
        u.onerror = (e) => {
          if (runId.current !== myRun) return;
          if (e.error === "canceled" || e.error === "interrupted") return;
          setStatus("idle");
        };
        synth.speak(u);
      };
      setStatus("playing");
      next();
    },
    [bcp47]
  );

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (status === "playing") {
      synth.pause();
      setStatus("paused");
    } else if (status === "paused") {
      synth.resume();
      setStatus("playing");
    } else {
      chunksRef.current = splitIntoChunks(text);
      setProgress(0);
      speakFrom(0, rate, voiceURI);
    }
  };

  const stop = () => {
    runId.current++;
    window.speechSynthesis.cancel();
    setStatus("idle");
    setProgress(0);
    indexRef.current = 0;
  };

  // Resume from the current sentence when rate/voice changes mid-playback
  const restartWith = (r: number, uri: string) => {
    if (status === "idle") return;
    speakFrom(indexRef.current, r, uri);
  };

  const cycleRate = () => {
    const nextRate = RATES[(RATES.indexOf(rate as (typeof RATES)[number]) + 1) % RATES.length];
    setRate(nextRate);
    restartWith(nextRate, voiceURI);
  };

  if (!supported || !text.trim()) return null;

  return (
    <div
      role="group"
      aria-label={title ? `Read aloud: ${title}` : "Read aloud"}
      className="overflow-hidden"
      style={{ background: "radial-gradient(120% 140% at 0% 0%, #2A231B 0%, #141210 45%, #0D0C0B 100%)", borderRadius: 20, border: "1px solid rgba(226,194,122,0.14)", boxShadow: "0 24px 50px -28px rgba(0,0,0,0.7)" }}
    >
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2">
          <Headphones className="h-3.5 w-3.5" style={{ color: status === "playing" ? "#C0952C" : "#57534E" }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#78716C" }}>
            Read Aloud
          </span>
        </div>
        <span className="text-[11px]" style={{ color: "#57534E" }}>
          {status === "playing" ? "Playing" : status === "paused" ? "Paused" : "Text to speech"}
        </span>
      </div>

      <div className="px-4 pt-3">
        <div className="h-0.5 w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full transition-[width] duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #A9802E, #E2C27A)" }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <button
          onClick={cycleRate}
          aria-label={`Speech speed ${rate}x`}
          className="h-6 min-w-9 text-[11px] font-semibold"
          style={{ color: rate !== 1 ? "#C0952C" : "#78716C", background: "transparent", border: "none" }}
        >
          {rate}×
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            aria-label={status === "playing" ? "Pause reading" : status === "paused" ? "Resume reading" : "Read description aloud"}
            className="flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
            style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #F0D58F 0%, #C9A04A 60%, #A9802E 100%)", color: "#1A1408", border: "none", boxShadow: "0 0 0 6px rgba(201,160,74,0.12), 0 10px 24px -8px rgba(201,160,74,0.8)" }}
          >
            {status === "playing" ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4" style={{ transform: "translateX(1.5px)" }} fill="currentColor" />
            )}
          </button>
          <button
            onClick={stop}
            disabled={status === "idle"}
            aria-label="Stop reading"
            className="flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-30"
            style={{ color: "#A8A29E", background: "rgba(255,255,255,0.06)", border: "none" }}
          >
            <Square className="h-3 w-3" fill="currentColor" />
          </button>
        </div>

        {voices.length > 1 ? (
          <select
            aria-label="Voice"
            value={voiceURI}
            onChange={(e) => {
              setVoiceURI(e.target.value);
              restartWith(rate, e.target.value);
            }}
            className="max-w-[110px] truncate rounded text-[11px]"
            style={{ background: "#1F1C1A", color: "#A8A29E", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 4px" }}
          >
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name.replace(/Microsoft |Google /, "")}
              </option>
            ))}
          </select>
        ) : (
          <span className="w-9" />
        )}
      </div>
      {voices.length === 0 && (
        <p className="px-4 pb-3 text-[11px]" style={{ color: "#57534E" }}>
          No dedicated voice installed for this language. The device default will be used.
        </p>
      )}
    </div>
  );
}
