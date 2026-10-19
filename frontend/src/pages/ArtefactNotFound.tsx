import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

export default function ArtefactNotFound() {
  return (
    <div className="sg-hero-bg sg-grain flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
      <span className="sg-reveal flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06]" style={{ boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.3)" }}>
        <SearchX className="h-8 w-8" style={{ color: "#E2C27A" }} strokeWidth={1.5} />
      </span>
      <h1 className="sg-reveal mt-6 font-display text-4xl font-bold" style={{ ["--d" as string]: "80ms" }}>Artefact not found</h1>
      <p className="sg-reveal mt-3 max-w-xs text-sm leading-relaxed text-stone-400" style={{ ["--d" as string]: "140ms" }}>
        This object doesn&apos;t exist or is no longer on display. Please check the QR code and try again.
      </p>
      <Link to="/explore" className="sg-reveal sg-btn-gold mt-8" style={{ ["--d" as string]: "200ms" }}>
        Explore the collection
      </Link>
    </div>
  );
}
