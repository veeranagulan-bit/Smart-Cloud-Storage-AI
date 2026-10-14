import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Radar, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Btn, DemoBadge, Empty, FileIcon, Glass, PageHeader, Progress } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { formatBytes, formatDate, type DemoFile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";

export const Route = createFileRoute("/duplicates")({
  head: () => meta("Duplicate Detection", "Cryptographic SHA-256 fingerprinting to identify and clean redundant files."),
  component: DupPage,
});

const norm = (n: string) => n.toLowerCase().replace(/\(copy\)|copy|\(\d+\)|[-_ ]?v\d+|final|[^a-z0-9]/g, "");

function DupPage() {
  const { files, removeFiles, log, liveMode, reload } = useDemo();
  const [phase, setPhase] = useState<"idle" | "scan" | "done">("idle");
  const [p, setP] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [liveGroups, setLiveGroups] = useState<{ type: "identical" | "name"; files: DemoFile[] }[]>([]);
  const [liveRecoverable, setLiveRecoverable] = useState(0);

  const fallbackGroups = useMemo(() => {
    const byHash = new Map<string, DemoFile[]>();
    files.forEach((f) => f.hash && byHash.set(f.hash, [...(byHash.get(f.hash) ?? []), f]));
    const exact = [...byHash.values()].filter((g) => g.length > 1);
    const inExact = new Set(exact.flat().map((f) => f.id));
    const byName = new Map<string, DemoFile[]>();
    files.filter((f) => !inExact.has(f.id)).forEach((f) => { const k = norm(f.name); byName.set(k, [...(byName.get(k) ?? []), f]); });
    const similar = [...byName.values()].filter((g) => g.length > 1);
    return [...exact.map((g) => ({ type: "identical" as const, files: g })), ...similar.map((g) => ({ type: "name" as const, files: g }))];
  }, [files]);

  const fallbackRecoverable = fallbackGroups.filter((g) => g.type === "identical").reduce((s, g) => s + g.files.slice(1).reduce((a, f) => a + f.size, 0), 0);

  const groups = liveMode && liveGroups.length > 0 ? liveGroups : fallbackGroups;
  const recoverable = liveMode && liveGroups.length > 0 ? liveRecoverable : fallbackRecoverable;

  const scan = async () => {
    setPhase("scan"); setP(0); setPicked([]);

    if (liveMode) {
      let v = 0;
      const t = window.setInterval(() => {
        v += 10;
        setP(Math.min(v, 90));
      }, 80);

      try {
        const res = await api.duplicates.get();
        clearInterval(t);
        setP(100);
        setLiveGroups(res.groups);
        setLiveRecoverable(res.recoverable_bytes);
        setPhase("done");
        log("duplicate", `Duplicate check found ${res.count} group(s)`);
        return;
      } catch (err) {
        clearInterval(t);
        console.error("Duplicate scan error:", err);
      }
    }

    let v = 0;
    const t = window.setInterval(() => { v += 5; setP(v); if (v >= 100) { clearInterval(t); setPhase("done"); log("duplicate", `Duplicate check found ${groups.length} group(s)`); } }, 90);
  };

  const toggle = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  const handleDeleteConfirmed = async () => {
    if (liveMode) {
      try {
        await api.duplicates.delete(picked);
        await reload();
      } catch (err) {
        console.error("Duplicate deletion error:", err);
      }
    } else {
      removeFiles(picked);
    }
    log("remove", `Removed ${picked.length} duplicate file(s)`);
    setPicked([]);
    setConfirm(false);
    // Refresh group view
    setLiveGroups((prev) => prev.map((g) => ({ ...g, files: g.files.filter((f) => !picked.includes(f.id)) })).filter((g) => g.files.length > 1));
  };

  return (
    <div>
      <PageHeader eyebrow="Clean up" title="Duplicate Detection" desc="Checks your files for identical content matched by SHA-256 cryptographic fingerprints and flags similarly named files." actions={<DemoBadge label={liveMode ? "SHA-256 Fingerprint Scan" : "Local demo scan"} />} />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Glass className="flex flex-col items-center text-center">
          <div className="relative my-4 h-56 w-56">
            {[0, 1, 2].map((i) => <div key={i} className="absolute rounded-full border border-cyan/25" style={{ inset: `${i * 28}px` }} />)}
            <div className={cn("absolute inset-0 rounded-full", phase === "scan" && "animate-spin-slow")} style={{ background: "conic-gradient(from 0deg, transparent 70%, color-mix(in oklab, var(--cyan) 50%, transparent))" }} />
            <div className="absolute inset-0 grid place-items-center"><Radar className="h-10 w-10 text-cyan" /></div>
            {phase === "done" && groups.flatMap((g) => g.files).slice(0, 8).map((f, i) => (
              <motion.span key={f.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }} className={cn("absolute h-2.5 w-2.5 rounded-full", i % 2 ? "bg-violet" : "bg-warning")} style={{ left: `${50 + Math.cos(i * 1.3) * 38}%`, top: `${50 + Math.sin(i * 1.3) * 38}%` }} />
            ))}
          </div>
          {phase === "scan" ? <Progress value={p} className="w-full" /> : <Btn onClick={scan} size="lg"><Radar className="h-5 w-5" /> {phase === "done" ? "Scan again" : "Scan Files"}</Btn>}
          {phase === "done" && (
            <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Groups found</p><p className="font-display text-2xl font-semibold">{groups.length}</p></div>
              <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">Potentially recoverable</p><p className="font-display text-2xl font-semibold text-gradient">{formatBytes(recoverable)}</p></div>
            </div>
          )}
        </Glass>

        <div>
          {phase !== "done" ? (
            <Empty icon={Copy} title={phase === "scan" ? "Scanning demo library…" : "Ready to scan"} desc="Run a scan to find duplicate groups among your demo files." />
          ) : !groups.length ? (
            <Empty icon={ShieldCheck} title="No duplicates" desc="Your demo library looks clean." />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{picked.length} selected</p>
                <Btn variant="danger" size="sm" disabled={!picked.length} onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Remove selected from demo</Btn>
              </div>
              {groups.map((g, gi) => (
                <motion.div key={gi} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }} className={cn("glass p-4", g.type === "identical" ? "border-warning/40" : "border-violet/30")}>
                  <span className={cn("mb-3 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", g.type === "identical" ? "bg-warning/15 text-warning" : "bg-violet/15 text-violet")}>
                    {g.type === "identical" ? "Identical content" : "Similar name only — content differs"}
                  </span>
                  <ul className="space-y-2">
                    {g.files.map((f, i) => (
                      <li key={f.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                        <input type="checkbox" checked={picked.includes(f.id)} onChange={() => toggle(f.id)} aria-label={`Select ${f.name}`} className="h-4 w-4 accent-[var(--violet)]" />
                        <FileIcon kind={f.kind} className="h-8 w-8" />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm">{f.name}.{f.ext}</p><p className="text-xs text-muted-foreground">{formatBytes(f.size)} · {formatDate(f.date)}</p></div>
                        {i === 0 ? <span className="text-xs text-success">Original</span> : <span className="text-xs text-warning">{g.type === "identical" ? "Duplicate" : "Review"}</span>}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirm && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="alertdialog" aria-modal="true" aria-labelledby="dup-title" initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }} className="glass w-full max-w-md bg-popover p-6">
              <h2 id="dup-title" className="text-lg font-semibold">Delete {picked.length} duplicate file(s)?</h2>
              <p className="mt-2 text-sm text-muted-foreground">{liveMode ? "This will delete the selected duplicate copies from your cloud vault and database." : "This removes records from the current demo view."}</p>
              <div className="mt-5 flex justify-end gap-2">
                <Btn variant="subtle" onClick={() => setConfirm(false)} autoFocus>Cancel</Btn>
                <Btn variant="danger" onClick={handleDeleteConfirmed}>Delete</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
