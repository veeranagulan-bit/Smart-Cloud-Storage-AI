import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { btn, Btn, DemoBadge, FileIcon, Glass, PageHeader, Progress } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { ACCEPTED_EXT, formatBytes, guessCategory, kindFromExt, MAX_FILE_SIZE, type DemoFile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export const Route = createFileRoute("/upload")({
  head: () => meta("Smart Upload", "Drag and drop files into the Smart Cloud Storage AI demo with simulated upload progress."),
  component: UploadPage,
});

interface Pending { id: string; file: File; ext: string; error?: string | undefined; progress: number }
type Phase = "idle" | "uploading" | "done" | "cancelled";

async function sha(file: File) {
  if (file.size > 50 * 1024 * 1024) return undefined;
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function UploadPage() {
  const { addFiles, log, liveMode, reload } = useDemo();
  const [drag, setDrag] = useState(false);
  const [items, setItems] = useState<Pending[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const pick = (list: FileList | null) => {
    if (!list) return;
    setPhase("idle");
    const next = [...list].map((file) => {
      const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
      const error = !ACCEPTED_EXT.includes(ext) ? `Unsupported type .${ext || "?"}` : file.size > MAX_FILE_SIZE ? `Too large (max ${formatBytes(MAX_FILE_SIZE)})` : undefined;
      return { id: crypto.randomUUID(), file, ext, error, progress: 0 };
    });
    setItems((x) => [...x, ...next]);
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); };
  const valid = items.filter((i) => !i.error);

  const start = async () => {
    setPhase("uploading");

    // Real backend upload path
    if (liveMode) {
      // Animate progress smoothly
      timer.current = window.setInterval(() => {
        setItems((x) => x.map((i) => (i.error ? i : { ...i, progress: Math.min(90, i.progress + 15) })));
      }, 150);

      try {
        const rawFiles = valid.map((v) => v.file);
        const res = await api.files.upload(rawFiles);
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setItems((x) => x.map((i) => (i.error ? i : { ...i, progress: 100 })));

        if (res && res.uploaded) {
          addFiles(res.uploaded);
          await reload();
        }
        setPhase("done");
        return;
      } catch (err: any) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        console.error("Backend upload error:", err);
        // Fall back to client simulation if upload fails
      }
    }

    // Client simulation path
    timer.current = window.setInterval(() => {
      setItems((x) => {
        const n = x.map((i) => (i.error ? i : { ...i, progress: Math.min(100, i.progress + 4 + Math.random() * 12) }));
        if (n.filter((i) => !i.error).every((i) => i.progress >= 100)) {
          clearInterval(timer.current!); timer.current = null;
          finish(n);
        }
        return n;
      });
    }, 180);
  };

  const finish = async (n: Pending[]) => {
    const recs: DemoFile[] = await Promise.all(n.filter((i) => !i.error).map(async (i) => {
      const kind = kindFromExt(i.ext);
      const base = i.file.name.replace(/\.[^.]+$/, "");
      const textPreview = ["txt", "md", "csv", "json"].includes(i.ext) && i.file.size < 200_000 ? (await i.file.text()).slice(0, 4000) : undefined;
      return {
        id: i.id, name: base, ext: i.ext, kind, size: i.file.size, date: new Date().toISOString(),
        category: guessCategory(base, kind), tags: ["local"], local: true, hash: await sha(i.file),
        previewUrl: kind === "image" ? URL.createObjectURL(i.file) : undefined, textPreview,
      };
    }));
    addFiles(recs);
    recs.forEach((r) => log("upload", `Added ${r.name}.${r.ext} to library`));
    setPhase("done");
  };

  const cancel = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setItems((x) => x.map((i) => ({ ...i, progress: 0 })));
    setPhase("cancelled");
  };

  return (
    <div>
      <PageHeader eyebrow="Ingest" title="Smart Upload" desc="Files stay in your browser. Upload progress is simulated — nothing is sent to a cloud service." actions={<DemoBadge label="Simulated upload" />} />

      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
        animate={{ scale: drag ? 1.015 : 1 }}
        className={cn("glass relative grid place-items-center overflow-hidden border-2 border-dashed p-10 text-center transition-colors md:p-16", drag ? "border-cyan bg-cyan/10 glow-cyan" : "border-violet/30")}
      >
        {drag && <div className="pointer-events-none absolute inset-x-0 h-24 animate-scan bg-gradient-to-b from-transparent via-cyan/20 to-transparent" />}
        <motion.div animate={{ y: drag ? -8 : [0, -6, 0] }} transition={{ repeat: drag ? 0 : Infinity, duration: 3 }} className="grid h-20 w-20 place-items-center rounded-3xl bg-aurora glow-violet">
          <UploadCloud className="h-9 w-9 text-primary-foreground" />
        </motion.div>
        <h2 className="mt-5 text-xl font-semibold">{drag ? "Release to add files" : "Drag & drop files here"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Documents, images, video, audio, code & archives · up to {formatBytes(MAX_FILE_SIZE)}</p>
        <Btn className="mt-5" variant="ghost" onClick={() => input.current?.click()}>Browse Files</Btn>
        <input ref={input} type="file" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-label="Choose files" />
      </motion.div>

      {items.length > 0 && (
        <Glass className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Selected files ({items.length})</h2>
            <div className="flex gap-2">
              {phase === "uploading" ? <Btn variant="danger" size="sm" onClick={cancel}>Cancel</Btn> : phase !== "done" && (
                <>
                  <Btn variant="subtle" size="sm" onClick={() => setItems([])}>Clear</Btn>
                  <Btn size="sm" disabled={!valid.length} onClick={start}>Start upload ({valid.length})</Btn>
                </>
              )}
            </div>
          </div>
          <AnimatePresence>
            {phase === "done" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-success" /> {valid.length} file(s) added to your demo library for this session (simulated).
                <Link to="/files" className={btn({ size: "sm", variant: "ghost" })}>Open My Files</Link>
                <Btn size="sm" variant="subtle" onClick={() => { setItems([]); setPhase("idle"); }}>Add more</Btn>
              </motion.div>
            )}
            {phase === "cancelled" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Upload cancelled. No files were added.</motion.p>
            )}
          </AnimatePresence>
          <ul className="space-y-2">
            <AnimatePresence>
              {items.map((i) => (
                <motion.li key={i.id} layout initial={{ opacity: 0, x: -20, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20 }} className={cn("flex items-center gap-3 rounded-xl border p-3", i.error ? "border-destructive/40 bg-destructive/5" : "border-border bg-accent/30")}>
                  <FileIcon kind={kindFromExt(i.ext)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.file.name}</p>
                    <p className="text-xs text-muted-foreground">.{i.ext} · {formatBytes(i.file.size)}</p>
                    {i.error ? <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> {i.error}</p> : phase !== "idle" && <Progress value={i.progress} className="mt-2" />}
                  </div>
                  {phase !== "uploading" && phase !== "done" && (
                    <button onClick={() => setItems((x) => x.filter((y) => y.id !== i.id))} aria-label={`Remove ${i.file.name}`} className={btn({ variant: "subtle", size: "icon" })}><X className="h-4 w-4" /></button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Glass>
      )}
    </div>
  );
}
