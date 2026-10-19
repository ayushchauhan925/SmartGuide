import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { ArrowLeft, Check } from "lucide-react";

interface Tr { language: string; title: string; description: string | null }

export default function TranslationsPage() {
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const [base, setBase] = useState<{ title: string; description: string | null } | null>(null);
  const [saved, setSaved] = useState<Tr[]>([]);
  const [lang, setLang] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [a, t] = await Promise.all([
      fetch(`/api/v1/artefacts/${id}`).then((r) => r.json()),
      fetch(`/api/v1/artefacts/${id}/translations`).then((r) => r.json()),
    ]);
    setBase(a.artefact);
    setSaved(t.translations ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const pick = (code: string) => {
    setLang(code);
    const existing = saved.find((s) => s.language === code);
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
  };

  const save = async () => {
    setBusy(true);
    const res = await fetch(`/api/v1/artefacts/${id}/translations`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang, title, description }),
    });
    setBusy(false);
    if (res.ok) { toast("Translation saved", "success"); load(); } else toast("Could not save translation", "error");
  };

  const remove = async () => {
    const res = await fetch(`/api/v1/artefacts/${id}/translations?language=${lang}`, { method: "DELETE" });
    if (res.ok) { toast("Translation removed", "success"); setTitle(""); setDescription(""); load(); }
  };

  const translatable = LANGUAGES.filter((l) => l.code !== DEFAULT_LANGUAGE);
  const hasSaved = saved.some((s) => s.language === lang);

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-6">
        <Link to={`/admin/artefacts/${id}`} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" /> Back to artefact
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">Translations</h1>
          <p className="mt-0.5 text-sm text-stone-500">{base?.title}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {translatable.map((l) => {
            const done = saved.some((s) => s.language === l.code);
            return (
              <button
                key={l.code}
                onClick={() => pick(l.code)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${lang === l.code ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700"}`}
              >
                {done && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                {l.label}
              </button>
            );
          })}
        </div>

        {lang && (
          <div className="grid gap-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Original (English)</p>
              <p className="font-semibold text-stone-900">{base?.title}</p>
              <p className="whitespace-pre-wrap text-sm text-stone-600">{base?.description}</p>
            </div>
            <div className="space-y-4">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} dir="auto" />
              <Textarea label="Description" rows={8} value={description} onChange={(e) => setDescription(e.target.value)} dir="auto" />
              <div className="flex gap-2">
                <Button onClick={save} loading={busy} disabled={!title.trim()}>Save</Button>
                {hasSaved && <Button variant="ghost" onClick={remove}>Remove</Button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
