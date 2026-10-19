import { Link } from "react-router-dom";
import { Logo } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="sg-hero-bg sg-grain mt-24 text-stone-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-400">
            A pocket curator for every visitor. Scan a QR code beside any object to hear its story.
          </p>
        </div>
        <div>
          <p className="sg-eyebrow mb-4 text-stone-500">Visit</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/explore" className="hover:text-white">Explore the collection</Link></li>
            <li><Link to="/tours" className="hover:text-white">Guided tours</Link></li>
            <li><Link to="/favorites" className="hover:text-white">Your saved items</Link></li>
          </ul>
        </div>
        <div>
          <p className="sg-eyebrow mb-4 text-stone-500">Staff</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/admin" className="hover:text-white">Collection admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-stone-500">
          © {new Date().getFullYear()} SmartGuide · Museum &amp; Library Information System
        </p>
      </div>
    </footer>
  );
}
