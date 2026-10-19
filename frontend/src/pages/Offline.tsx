import { Link } from "react-router-dom";
import { WifiOff } from "lucide-react";


export default function OfflinePage() {
  return (
    <div className="sg-hero-bg sg-grain flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
      <span className="sg-reveal flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06]" style={{ boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.3)" }}>
        <WifiOff className="h-8 w-8" style={{ color: "#E2C27A" }} strokeWidth={1.5} />
      </span>
      <h1 className="sg-reveal mt-6 font-display text-4xl font-bold" style={{ ["--d" as string]: "80ms" }}>You&apos;re offline</h1>
      <p className="sg-reveal mt-3 max-w-xs text-sm leading-relaxed text-stone-400" style={{ ["--d" as string]: "140ms" }}>
        This page isn&apos;t saved on your device yet. Artefacts you&apos;ve already opened are still available.
      </p>
      <Link to="/favorites" className="sg-reveal sg-btn-gold mt-8" style={{ ["--d" as string]: "200ms" }}>
        Saved artefacts
      </Link>
    </div>
  );
}
