import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import { languageLabel } from "@/lib/languages";

export function LanguageSwitcher({ current, available }: { current: string; available: string[] }) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [search] = useSearchParams();
  if (available.length < 2) return null;

  return (
    <label
      className="relative flex h-9 items-center gap-1.5 rounded-full border pl-3 pr-2 text-xs text-stone-200"
      style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)" }}
    >
      <Globe className="h-3.5 w-3.5" style={{ color: "#E2C27A" }} aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={current}
        onChange={(e) => {
          const p = new URLSearchParams(search.toString());
          p.set("lang", e.target.value);
          try { localStorage.setItem("sg-lang", e.target.value); } catch {}
          navigate(`${pathname}?${p}`, { replace: true, preventScrollReset: true });
        }}
        className="cursor-pointer appearance-none bg-transparent pr-1 text-xs font-medium text-stone-100 focus:outline-none"
      >
        {available.map((code) => (
          <option key={code} value={code} className="text-stone-900">{languageLabel(code)}</option>
        ))}
      </select>
    </label>
  );
}
