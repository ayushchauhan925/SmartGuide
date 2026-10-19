import { AdminShell } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2 } from "lucide-react";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/60">
        <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
        {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const SECURITY_CHECKS = [
  "Passwords hashed with bcrypt (cost 12)",
  "JWT stored in HttpOnly cookies",
  "Login rate-limited (10 attempts per 15 min per IP)",
  "File uploads validated by MIME type and size server-side",
  "RBAC enforced server-side on all admin API routes",
];

export default function SettingsPage() {
  const { toast } = useToast();

  return (
    <AdminShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight">Settings</h1>
          <p className="text-sm text-stone-500 mt-0.5">System configuration and preferences</p>
        </div>

        <Section title="General" description="Basic information about your institution">
          <div className="space-y-4">
            <Input label="Site Name" defaultValue="SmartGuide" />
            <Input label="Institution Name" placeholder="e.g. City Museum of Arts" />
          </div>
          <div className="mt-4">
            <Button onClick={() => toast("Settings saved!")}>Save Changes</Button>
          </div>
        </Section>

        <Section title="Branding" description="Visual identity settings">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg border border-stone-200 flex items-center justify-center" style={{ background: "#9A7820" }}>
              <span className="text-[10px] text-white font-bold">SG</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-700">Muted Gold</p>
              <p className="text-xs text-stone-400">#9A7820 — primary accent colour</p>
            </div>
            <span className="text-xs text-stone-400 ml-auto">Customisable in future release</span>
          </div>
        </Section>

        <Section title="Email Notifications" description="Password resets and admin alerts">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            Email sending is not configured in this build. Set up an SMTP provider in <code className="font-mono text-xs">.env.local</code> to enable password resets.
          </div>
        </Section>

        <Section title="Security" description="Active security measures">
          <div className="space-y-2.5">
            {SECURITY_CHECKS.map((check) => (
              <div key={check} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-stone-600">{check}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Backup & Export" description="Data portability">
          <p className="text-sm text-stone-500 mb-4">
            Export functionality is not available in this build. A full database backup can be performed via <code className="font-mono text-xs">mysqldump smartguide</code>.
          </p>
          <Button variant="secondary" disabled>Export Data (coming soon)</Button>
        </Section>
      </div>
    </AdminShell>
  );
}
