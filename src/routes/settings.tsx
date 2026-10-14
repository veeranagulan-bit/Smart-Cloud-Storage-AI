import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Btn, Glass, PageHeader } from "@/components/app/kit";
import { useDemo, type Settings } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => meta("Settings", "Theme, animation, layout and notification preferences for the demo."),
  component: SettingsPage,
});

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-border p-1">
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={cn("rounded-full px-4 py-1.5 text-sm transition-colors", value === o.v ? "bg-aurora text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{o.l}</button>
      ))}
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5 last:border-0">
      <div><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { settings, setSettings, reset } = useDemo();
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSettings({ [k]: v } as Partial<Settings>);
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Preferences" title="Settings" desc="Saved in this browser only." />
      <Glass>
        <Row title="Accent theme" desc="Choose the glow color used across the interface."><Seg label="Accent" value={settings.accent} onChange={set("accent")} options={[{ v: "aurora", l: "Aurora" }, { v: "violet", l: "Violet" }, { v: "cyan", l: "Cyan" }]} /></Row>
        <Row title="Animations" desc="Reduce motion for comfort or performance."><Seg label="Animations" value={settings.motion} onChange={set("motion")} options={[{ v: "full", l: "Full" }, { v: "reduced", l: "Reduced" }]} /></Row>
        <Row title="File layout" desc="Spacing in file lists and grids."><Seg label="Density" value={settings.density} onChange={set("density")} options={[{ v: "comfortable", l: "Comfortable" }, { v: "compact", l: "Compact" }]} /></Row>
        <Row title="Notifications" desc="Show activity in the bell menu.">
          <button role="switch" aria-checked={settings.notifications} aria-label="Notifications" onClick={() => setSettings({ notifications: !settings.notifications })} className={cn("relative h-7 w-12 rounded-full transition-colors", settings.notifications ? "bg-aurora" : "bg-muted")}>
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-foreground transition-all", settings.notifications ? "left-6" : "left-1")} />
          </button>
        </Row>
        <Row title="Reset demo data" desc="Restore sample files, activity and default settings.">
          {confirm ? (
            <div className="flex gap-2"><Btn variant="subtle" size="sm" onClick={() => setConfirm(false)}>Cancel</Btn><Btn variant="danger" size="sm" onClick={() => { reset(); setConfirm(false); }}>Reset now</Btn></div>
          ) : <Btn variant="ghost" size="sm" onClick={() => setConfirm(true)}><RotateCcw className="h-4 w-4" /> Reset</Btn>}
        </Row>
      </Glass>
      <Glass className="mt-4" delay={0.1}>
        <h2 className="font-semibold">About</h2>
        <p className="mt-2 text-sm text-muted-foreground">Smart Cloud Storage AI · Frontend demo v1.0. Runs entirely in your browser: no backend, no real AI model, and no files leave your device. Search, classification, similarity and duplicate features are simulations built to be connected to real services later.</p>
      </Glass>
    </div>
  );
}
