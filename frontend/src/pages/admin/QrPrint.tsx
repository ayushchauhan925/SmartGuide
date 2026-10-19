import { Suspense, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";

interface Item { id: number; title: string; location: string | null; url: string; svg: string }

const SIZES = { small: 3, medium: 2, large: 1 } as const;

function downloadSvg(item: Item) {
  const blob = new Blob([item.svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `qr-${item.title.replace(/[^\w-]+/g, "_").slice(0, 40)}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function PrintSheet() {
  const ids = useSearchParams()[0].get("ids");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<keyof typeof SIZES>("medium");

  useEffect(() => {
    fetch(`/api/v1/qr-codes/sheet${ids ? `?ids=${ids}` : ""}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [ids]);

  return (
    <div className="min-h-screen bg-white">
      <style>{`@media print { .no-print { display: none !important } .qr-card { break-inside: avoid } @page { margin: 12mm } }`}</style>
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-6 py-3">
        <Link to="/admin/qr-codes" className="flex items-center gap-1.5 text-sm text-stone-600"><ArrowLeft className="h-4 w-4" /> QR Codes</Link>
        <span className="text-sm text-stone-400">{items.length} codes</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-stone-600">
            Size{" "}
            <select value={size} onChange={(e) => setSize(e.target.value as keyof typeof SIZES)} className="rounded border border-stone-300 px-2 py-1 text-sm">
              <option value="small">Small (3 per row)</option>
              <option value="medium">Medium (2 per row)</option>
              <option value="large">Large (1 per row)</option>
            </select>
          </label>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-10 text-center text-sm text-stone-400">Generating…</p>
      ) : (
        <div className="grid gap-6 p-6" style={{ gridTemplateColumns: `repeat(${SIZES[size]}, minmax(0, 1fr))` }}>
          {items.map((it) => (
            <div key={it.id} className="qr-card flex flex-col items-center rounded-lg border border-stone-300 p-4 text-center">
              <div className="w-full max-w-[320px]" dangerouslySetInnerHTML={{ __html: it.svg }} />
              <p className="mt-2 font-semibold text-stone-900">{it.title}</p>
              {it.location && <p className="text-xs text-stone-500">{it.location}</p>}
              <p className="mt-1 text-[10px] text-stone-400">Scan for the audio &amp; text guide</p>
              <button onClick={() => downloadSvg(it)} className="no-print mt-2 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900">
                <Download className="h-3 w-3" /> SVG
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QrPrintPage() {
  return (
    <Suspense fallback={null}>
      <PrintSheet />
    </Suspense>
  );
}
