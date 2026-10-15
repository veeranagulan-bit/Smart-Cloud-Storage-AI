export type FileKind = "document" | "image" | "video" | "audio" | "archive" | "code" | "spreadsheet" | "other";
export type Category = "Documents" | "Images" | "Educational" | "Business" | "Reports" | "Others";

export interface DemoFile {
  id: string;
  name: string;
  ext: string;
  kind: FileKind;
  size: number; // bytes
  date: string; // ISO
  category: Category;
  tags: string[];
  favorite?: boolean;
  /** Object URL for local previews (session only, never persisted) */
  previewUrl?: string | undefined;
  textPreview?: string | undefined;
  local?: boolean;
  hash?: string | undefined;
}

export interface ActivityItem {
  id: string;
  type: "upload" | "classify" | "search" | "duplicate" | "rename" | "remove" | "index" | "download" | string;
  text: string;
  date: string;
}

export const STORAGE_QUOTA = 100 * 1024 ** 3; // 100 GB demo quota

export const CATEGORIES: Category[] = ["Documents", "Images", "Educational", "Business", "Reports", "Others"];

const d = (daysAgo: number, h = 10) => {
  const t = new Date("2026-10-14T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - daysAgo);
  t.setUTCHours(h);
  return t.toISOString();
};
const MB = 1024 ** 2;

export const SEED_FILES: DemoFile[] = [
  { id: "f1", name: "College Project Report - Final", ext: "pdf", kind: "document", size: 4.2 * MB, date: d(0, 9), category: "Educational", tags: ["college", "project", "report"], favorite: true, hash: "a1" },
  { id: "f2", name: "Machine Learning Notes", ext: "docx", kind: "document", size: 1.8 * MB, date: d(1), category: "Educational", tags: ["machine learning", "ai", "notes"], hash: "a2" },
  { id: "f3", name: "Q3 Revenue Analysis", ext: "xlsx", kind: "spreadsheet", size: 2.4 * MB, date: d(1, 14), category: "Business", tags: ["finance", "revenue", "quarterly"], hash: "a3" },
  { id: "f4", name: "Beach Sunset", ext: "jpg", kind: "image", size: 6.1 * MB, date: d(2), category: "Images", tags: ["photo", "travel"], favorite: true, hash: "a4" },
  { id: "f5", name: "Beach Sunset (copy)", ext: "jpg", kind: "image", size: 6.1 * MB, date: d(2, 15), category: "Images", tags: ["photo", "travel"], hash: "a4" },
  { id: "f6", name: "Neural Networks Lecture", ext: "mp4", kind: "video", size: 412 * MB, date: d(3), category: "Educational", tags: ["deep learning", "lecture", "ai"], hash: "a6" },
  { id: "f7", name: "Annual Report 2025", ext: "pdf", kind: "document", size: 8.7 * MB, date: d(4), category: "Reports", tags: ["annual", "report", "company"], hash: "a7" },
  { id: "f8", name: "Annual Report 2025", ext: "pdf", kind: "document", size: 8.7 * MB, date: d(9), category: "Reports", tags: ["annual", "report", "company"], hash: "a7" },
  { id: "f9", name: "Annual Report 2024", ext: "pdf", kind: "document", size: 7.9 * MB, date: d(40), category: "Reports", tags: ["annual", "report", "company"], hash: "a9" },
  { id: "f10", name: "Client Proposal - Nimbus", ext: "pptx", kind: "document", size: 12.3 * MB, date: d(5), category: "Business", tags: ["proposal", "client", "pitch"], hash: "a10" },
  { id: "f11", name: "Data Structures Assignment", ext: "pdf", kind: "document", size: 0.9 * MB, date: d(6), category: "Educational", tags: ["college", "assignment", "algorithms"], hash: "a11" },
  { id: "f12", name: "product_mockup_v2", ext: "png", kind: "image", size: 3.3 * MB, date: d(7), category: "Images", tags: ["design", "mockup"], hash: "a12" },
  { id: "f13", name: "product_mockup_v3", ext: "png", kind: "image", size: 3.5 * MB, date: d(7, 16), category: "Images", tags: ["design", "mockup"], hash: "a13" },
  { id: "f14", name: "Podcast Episode 12", ext: "mp3", kind: "audio", size: 48 * MB, date: d(8), category: "Others", tags: ["podcast", "audio"], hash: "a14" },
  { id: "f15", name: "Thesis Draft - Computer Vision", ext: "docx", kind: "document", size: 2.9 * MB, date: d(10), category: "Educational", tags: ["thesis", "computer vision", "ai", "college"], hash: "a15" },
  { id: "f16", name: "Invoice #4021", ext: "pdf", kind: "document", size: 0.2 * MB, date: d(11), category: "Business", tags: ["invoice", "finance"], hash: "a16" },
  { id: "f17", name: "Invoice #4021", ext: "pdf", kind: "document", size: 0.2 * MB, date: d(12), category: "Business", tags: ["invoice", "finance"], hash: "a16" },
  { id: "f18", name: "Marketing Performance Q3", ext: "pdf", kind: "document", size: 3.1 * MB, date: d(13), category: "Reports", tags: ["marketing", "report", "quarterly"], hash: "a18" },
  { id: "f19", name: "source-code-backup", ext: "zip", kind: "archive", size: 220 * MB, date: d(15), category: "Others", tags: ["backup", "code"], hash: "a19" },
  { id: "f20", name: "Team Offsite Photos", ext: "zip", kind: "archive", size: 640 * MB, date: d(18), category: "Images", tags: ["photo", "team"], hash: "a20" },
  { id: "f21", name: "Reinforcement Learning Paper", ext: "pdf", kind: "document", size: 1.4 * MB, date: d(20), category: "Educational", tags: ["machine learning", "research", "ai"], hash: "a21" },
  { id: "f22", name: "train_model", ext: "py", kind: "code", size: 0.03 * MB, date: d(21), category: "Others", tags: ["python", "machine learning", "code"], hash: "a22" },
  { id: "f23", name: "Resume - 2026", ext: "pdf", kind: "document", size: 0.3 * MB, date: d(25), category: "Documents", tags: ["resume", "career"], favorite: true, hash: "a23" },
  { id: "f24", name: "Lease Agreement", ext: "pdf", kind: "document", size: 1.1 * MB, date: d(30), category: "Documents", tags: ["legal", "home"], hash: "a24" },
];

export const SEED_ACTIVITY: ActivityItem[] = [
  { id: "a1", type: "upload", text: "Uploaded College Project Report - Final.pdf", date: d(0, 9) },
  { id: "a2", type: "classify", text: "Sample classification: Machine Learning Notes → Educational", date: d(1, 11) },
  { id: "a3", type: "index", text: "Demo semantic index refreshed for 24 sample files", date: d(1, 12) },
  { id: "a4", type: "duplicate", text: "Demo duplicate check flagged Beach Sunset (copy).jpg", date: d(2, 16) },
  { id: "a5", type: "search", text: "Searched “annual company reports”", date: d(3, 10) },
  { id: "a6", type: "upload", text: "Uploaded Neural Networks Lecture.mp4", date: d(3, 9) },
  { id: "a7", type: "rename", text: "Renamed product_mockup_v2.png", date: d(7, 17) },
];

export const UPLOAD_HISTORY = [
  { month: "May", uploads: 34, gb: 2.1 },
  { month: "Jun", uploads: 52, gb: 3.8 },
  { month: "Jul", uploads: 41, gb: 2.9 },
  { month: "Aug", uploads: 67, gb: 5.2 },
  { month: "Sep", uploads: 78, gb: 6.4 },
  { month: "Oct", uploads: 59, gb: 4.7 },
];

export const ACCEPTED_EXT = ["pdf","doc","docx","txt","md","csv","xlsx","pptx","png","jpg","jpeg","gif","webp","svg","mp4","mov","mp3","wav","zip","json","py","ts","js"];
export const MAX_FILE_SIZE = 500 * MB;

export function kindFromExt(ext: string): FileKind {
  const e = ext.toLowerCase();
  if (["png","jpg","jpeg","gif","webp","svg"].includes(e)) return "image";
  if (["mp4","mov","webm"].includes(e)) return "video";
  if (["mp3","wav","m4a"].includes(e)) return "audio";
  if (["zip","rar","7z"].includes(e)) return "archive";
  if (["py","ts","js","json"].includes(e)) return "code";
  if (["xlsx","csv"].includes(e)) return "spreadsheet";
  if (["pdf","doc","docx","txt","md","pptx"].includes(e)) return "document";
  return "other";
}

/** Rule-based demo guess — not a real AI model. */
export function guessCategory(name: string, kind: FileKind): Category {
  const n = name.toLowerCase();
  if (/(lecture|notes|assignment|thesis|course|study|learning|college)/.test(n)) return "Educational";
  if (/(report|analysis|summary|q[1-4])/.test(n)) return "Reports";
  if (/(invoice|proposal|contract|client|budget|sales)/.test(n)) return "Business";
  if (kind === "image") return "Images";
  if (kind === "document" || kind === "spreadsheet") return "Documents";
  return "Others";
}

export function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  const u = ["KB", "MB", "GB", "TB"];
  let i = -1;
  do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
  return `${b.toFixed(b < 10 ? 1 : 0)} ${u[i]}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Simple deterministic pseudo-score in [lo, hi] — used for illustrative demo values. */
export function demoScore(seed: string, lo = 70, hi = 98) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return lo + (h % (hi - lo + 1));
}

/** Keyword-overlap demo ranking for semantic search. Replace with a real search API later. */
export function demoSearch(files: DemoFile[], query: string) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !["find","show","my","the","about","documents","files","all","with"].includes(w));
  if (!words.length) return [];
  return files
    .map((f) => {
      const hay = `${f.name} ${f.tags.join(" ")} ${f.category}`.toLowerCase();
      const hits = words.filter((w) => hay.includes(w.replace(/s$/, ""))).length;
      return { file: f, score: hits ? Math.min(99, Math.round((hits / words.length) * 70 + demoScore(f.id, 0, 25))) : 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function similarFiles(files: DemoFile[], target: DemoFile) {
  return files
    .filter((f) => f.id !== target.id)
    .map((f) => {
      const shared = f.tags.filter((t) => target.tags.includes(t));
      const sameCat = f.category === target.category;
      const raw = shared.length * 22 + (sameCat ? 30 : 0) + (f.kind === target.kind ? 10 : 0);
      const reason = shared.length ? `Related topic: ${shared.slice(0, 2).join(", ")}` : sameCat ? "Same category" : "Same file type";
      return { file: f, score: Math.min(97, raw + demoScore(f.id + target.id, 0, 8)), reason };
    })
    .filter((r) => r.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];
