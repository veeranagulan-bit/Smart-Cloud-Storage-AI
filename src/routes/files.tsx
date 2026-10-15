import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { FolderOpen, Grid3x3, List, Pencil, Star, Trash2, X, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { btn, Btn, CatTag, Empty, FileIcon, PageHeader } from "@/components/app/kit";
import { useDemo } from "@/lib/demo-store";
import { meta } from "@/lib/meta";
import { CATEGORIES, formatBytes, formatDate, type DemoFile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/files")({
  head: () => meta("My Files", "Browse, preview, sort and organize your demo file library."),
  component: FilesPage,
});

type Sort = "date" | "name" | "size" | "category";

function FilesPage() {
  const { files, removeFiles, renameFile, toggleFavorite, log, settings, downloadFile } = useDemo();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("date");
  const [favOnly, setFavOnly] = useState(false);
  const [sel, setSel] = useState<DemoFile | null>(null);
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState(false);

  const list = useMemo(() => {
    let r = files.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()) && (cat === "All" || f.category === cat) && (!favOnly || f.favorite));
    r = [...r].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "size" ? b.size - a.size : sort === "category" ? a.category.localeCompare(b.category) : b.date.localeCompare(a.date),
    );
    return r;
  }, [files, q, cat, sort, favOnly]);

  const open = (f: DemoFile) => { setSel(f); setName(f.name); setConfirm(false); };
  const current = sel ? files.find((f) => f.id === sel.id) ?? null : null;

  return (
    <div>
      <PageHeader eyebrow="Library" title="My Files" desc="Your cloud library. Files you add in Smart Upload appear here."
        actions={<Link to="/upload" className={cn(btn(), "text-xs sm:text-sm")}>Add files</Link>} />

      <div className="glass mb-5 flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name…" aria-label="Filter files" className="h-9 sm:h-10 min-w-36 flex-1 rounded-full border border-border bg-input/40 px-3.5 sm:px-4 text-xs sm:text-sm outline-none focus:border-violet" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="h-9 sm:h-10 rounded-full border border-border bg-popover px-2.5 sm:px-3 text-xs sm:text-sm">
          <option>All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by" className="h-9 sm:h-10 rounded-full border border-border bg-popover px-2.5 sm:px-3 text-xs sm:text-sm">
          <option value="date">Newest</option><option value="name">Name</option><option value="size">Size</option><option value="category">Category</option>
        </select>
        <Btn variant={favOnly ? "primary" : "ghost"} size="sm" onClick={() => setFavOnly((v) => !v)} aria-pressed={favOnly} className="h-9 text-xs"><Star className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Favorites</span></Btn>
        <div className="flex rounded-full border border-border p-0.5 sm:p-1 shrink-0">
          <button onClick={() => setView("grid")} aria-label="Grid view" className={cn("rounded-full p-1.5", view === "grid" && "bg-violet/20 text-cyan")}><Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
          <button onClick={() => setView("list")} aria-label="List view" className={cn("rounded-full p-1.5", view === "list" && "bg-violet/20 text-cyan")}><List className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
        </div>
      </div>

      {!list.length ? (
        <Empty icon={FolderOpen} title="No files found" desc="Try a different filter, or add files from Smart Upload." action={<Link to="/upload" className={btn()}>Upload files</Link>} />
      ) : view === "grid" ? (
        <motion.div layout className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", settings.density === "compact" && "gap-2 xl:grid-cols-5")}>
          {list.map((f, i) => (
            <motion.button layout key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }} onClick={() => open(f)} className="glass glass-hover p-4 text-left">
              <div className="mb-3 grid h-28 place-items-center overflow-hidden rounded-xl bg-accent/40">
                {f.previewUrl && f.kind === "image" ? <img src={f.previewUrl} alt="" className="h-full w-full object-cover" /> : <FileIcon kind={f.kind} className="h-14 w-14" />}
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium">{f.name}.{f.ext}</p>
                {f.favorite && <Star className="h-4 w-4 shrink-0 fill-warning text-warning" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatBytes(f.size)} · {formatDate(f.date)}</p>
              <div className="mt-2"><CatTag c={f.category} /></div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <div className="glass overflow-x-auto p-2">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Size</th><th className="p-3">Date</th></tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} onClick={() => open(f)} className="cursor-pointer border-t border-border hover:bg-accent/40">
                  <td className="flex items-center gap-3 p-3"><FileIcon kind={f.kind} className="h-8 w-8" /><span className="truncate">{f.name}.{f.ext}</span></td>
                  <td className="p-3"><CatTag c={f.category} /></td>
                  <td className="p-3 text-muted-foreground">{formatBytes(f.size)}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(f.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {current && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-3 sm:p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSel(null)}>
            <motion.div role="dialog" aria-modal="true" aria-label="File details" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass w-full max-w-lg bg-popover p-4 sm:p-6 max-h-[88vh] overflow-y-auto">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3"><FileIcon kind={current.kind} className="h-9 w-9 sm:h-10 sm:w-10" /><div className="min-w-0"><p className="font-semibold text-sm sm:text-base truncate">{current.name}.{current.ext}</p><p className="text-xs text-muted-foreground">{formatBytes(current.size)} · {formatDate(current.date)}</p></div></div>
                <button onClick={() => setSel(null)} aria-label="Close" className={btn({ variant: "subtle", size: "icon" })}><X className="h-4 w-4" /></button>
              </div>
              <div className="mb-4 grid min-h-40 place-items-center overflow-hidden rounded-xl border border-border bg-accent/30">
                {current.previewUrl && current.kind === "image" ? <img src={current.previewUrl} alt={current.name} className="max-h-72 w-full object-contain" />
                  : current.textPreview ? <pre className="max-h-60 w-full overflow-auto p-3 text-xs whitespace-pre-wrap">{current.textPreview}</pre>
                  : <p className="p-6 text-center text-sm text-muted-foreground">Preview unavailable — this is a sample record with no file content in the demo.</p>}
              </div>
              <div className="mb-4 flex flex-wrap gap-1.5"><CatTag c={current.category} />{current.tags.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{t}</span>)}</div>
              <label className="text-xs text-muted-foreground" htmlFor="rename">Rename</label>
              <div className="mt-1 flex gap-2">
                <input id="rename" value={name} onChange={(e) => setName(e.target.value)} className="h-10 flex-1 rounded-full border border-border bg-input/40 px-4 text-sm outline-none focus:border-violet" />
                <Btn variant="ghost" disabled={!name.trim() || name === current.name} onClick={() => { renameFile(current.id, name.trim()); log("rename", `Renamed ${current.name} → ${name.trim()}`); }}><Pencil className="h-4 w-4" /> Save</Btn>
              </div>
              <div className="mt-5 flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  <Btn variant="ghost" onClick={() => toggleFavorite(current.id)}><Star className={cn("h-4 w-4", current.favorite && "fill-warning text-warning")} /> {current.favorite ? "Unfavorite" : "Favorite"}</Btn>
                  <Btn variant="ghost" onClick={() => downloadFile(current.id, `${current.name}.${current.ext}`)}><Download className="h-4 w-4" /> Download</Btn>
                </div>
                {confirm ? (
                  <div className="flex gap-2">
                    <Btn variant="subtle" onClick={() => setConfirm(false)}>Cancel</Btn>
                    <Btn variant="danger" onClick={() => { removeFiles([current.id]); log("remove", `Removed ${current.name} from library`); setSel(null); }}>Confirm remove</Btn>
                  </div>
                ) : <Btn variant="danger" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Delete</Btn>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
