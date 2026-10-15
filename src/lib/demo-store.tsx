import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SEED_ACTIVITY, SEED_FILES, type ActivityItem, type DemoFile } from "./mock-data";
import { api, clearToken, getToken } from "./api";

export interface Settings {
  accent: "violet" | "cyan" | "aurora";
  motion: "full" | "reduced";
  density: "comfortable" | "compact";
  notifications: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  storage_used?: number;
  total_files?: number;
  storage_quota?: number;
}

const DEFAULT_SETTINGS: Settings = { accent: "aurora", motion: "full", density: "comfortable", notifications: true };
const KEY = "scs-demo-v1";

interface Store {
  files: DemoFile[];
  activity: ActivityItem[];
  settings: Settings;
  liveMode: boolean;
  user: UserProfile | null;
  loading: boolean;
  addFiles: (f: DemoFile[]) => void;
  removeFiles: (ids: string[]) => Promise<void>;
  renameFile: (id: string, name: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  log: (type: ActivityItem["type"], text: string) => void;
  setSettings: (s: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
  reload: () => Promise<void>;
  downloadFile: (id: string, name: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => void;
}

const g = globalThis as unknown as { __scsDemoCtx?: React.Context<Store | null> };
const Ctx = (g.__scsDemoCtx ??= createContext<Store | null>(null));

export function DemoProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<DemoFile[]>(SEED_FILES);
  const [activity, setActivity] = useState<ActivityItem[]>(SEED_ACTIVITY);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [liveMode, setLiveMode] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Fetch live backend data
  const loadBackendData = useCallback(async () => {
    try {
      const health = await api.health.check();
      if (health && health.database && health.database.connected) {
        setLiveMode(true);

        // Try getting current user
        try {
          const u = await api.auth.me();
          if (u) setUser(u);
        } catch {
          // not logged in yet or using demo token
        }

        // Fetch live files from MongoDB
        const dbFiles = await api.files.list();
        if (dbFiles && dbFiles.length >= 0) {
          setFiles(dbFiles);
        }

        // Fetch live activity
        const dbActivities = await api.activity.list({ limit: 50 });
        if (dbActivities && dbActivities.length >= 0) {
          setActivity(dbActivities);
        }

        // Fetch live settings
        try {
          const dbSettings = await api.settings.get();
          if (dbSettings) {
            setSettingsState((prev) => ({ ...prev, ...dbSettings }));
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // Backend not running, use local storage fallback
      setLiveMode(false);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // Read local cache first for instant hydration
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.files) setFiles(p.files);
        if (p.activity) setActivity(p.activity);
        if (p.settings) setSettingsState({ ...DEFAULT_SETTINGS, ...p.settings });
      }
    } catch {
      // ignore
    }

    loadBackendData();
  }, [loadBackendData]);

  // Persist locally for offline fallback
  useEffect(() => {
    if (!loaded) return;
    const safeFiles = files.map(({ previewUrl, textPreview, ...rest }) => rest);
    localStorage.setItem(KEY, JSON.stringify({ files: safeFiles, activity: activity.slice(0, 50), settings }));
  }, [files, activity, settings, loaded]);

  useEffect(() => {
    document.documentElement.dataset["motion"] = settings.motion;
    document.documentElement.dataset["accent"] = settings.accent;
  }, [settings]);

  const log = useCallback((type: ActivityItem["type"], text: string) => {
    setActivity((a) => [{ id: crypto.randomUUID(), type, text, date: new Date().toISOString() }, ...a]);
  }, []);

  const addFiles = useCallback((newFiles: DemoFile[]) => {
    setFiles((x) => [...newFiles, ...x]);
  }, []);

  const removeFiles = useCallback(async (ids: string[]) => {
    // Revoke object URLs
    setFiles((x) => {
      x.filter((f) => ids.includes(f.id) && f.previewUrl).forEach((f) => URL.revokeObjectURL(f.previewUrl!));
      return x.filter((f) => !ids.includes(f.id));
    });

    if (liveMode) {
      try {
        await Promise.all(ids.map((id) => api.files.delete(id)));
        const refreshed = await api.files.list();
        setFiles(refreshed);
      } catch (err) {
        console.error("Failed to delete files on backend:", err);
      }
    }
  }, [liveMode]);

  const renameFile = useCallback(async (id: string, newName: string) => {
    setFiles((x) => x.map((f) => (f.id === id ? { ...f, name: newName } : f)));

    if (liveMode) {
      try {
        await api.files.update(id, { name: newName });
      } catch (err) {
        console.error("Failed to rename file on backend:", err);
      }
    }
  }, [liveMode]);

  const toggleFavorite = useCallback(async (id: string) => {
    let nextFav = false;
    setFiles((x) =>
      x.map((f) => {
        if (f.id === id) {
          nextFav = !f.favorite;
          return { ...f, favorite: nextFav };
        }
        return f;
      })
    );

    if (liveMode) {
      try {
        await api.files.update(id, { favorite: nextFav });
      } catch (err) {
        console.error("Failed to toggle favorite on backend:", err);
      }
    }
  }, [liveMode]);

  const setSettings = useCallback(async (s: Partial<Settings>) => {
    setSettingsState((p) => ({ ...p, ...s }));

    if (liveMode) {
      try {
        await api.settings.update(s);
      } catch (err) {
        console.error("Failed to save settings to backend:", err);
      }
    }
  }, [liveMode]);

  const reset = useCallback(async () => {
    files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFiles(SEED_FILES);
    setActivity(SEED_ACTIVITY);
    setSettingsState(DEFAULT_SETTINGS);

    if (liveMode) {
      try {
        await api.settings.update(DEFAULT_SETTINGS);
        await loadBackendData();
      } catch {
        // ignore
      }
    }
  }, [files, liveMode, loadBackendData]);

  const downloadFile = useCallback(async (id: string, name: string) => {
    if (liveMode) {
      await api.files.download(id, name);
    } else {
      const f = files.find((item) => item.id === id);
      if (f && f.previewUrl) {
        const a = document.createElement("a");
        a.href = f.previewUrl;
        a.download = `${name}.${f.ext}`;
        a.click();
      }
    }
  }, [files, liveMode]);

  const login = useCallback(async (email: string, pass: string) => {
    const res = await api.auth.login(email, pass);
    if (res && res.user) {
      setUser(res.user);
      await loadBackendData();
    }
  }, [loadBackendData]);

  const register = useCallback(async (email: string, pass: string, name?: string) => {
    const res = await api.auth.register(email, pass, name);
    if (res && res.user) {
      setUser(res.user);
      await loadBackendData();
    }
  }, [loadBackendData]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    loadBackendData();
  }, [loadBackendData]);

  const value = useMemo<Store>(() => ({
    files,
    activity,
    settings,
    liveMode,
    user,
    loading,
    log,
    addFiles,
    removeFiles,
    renameFile,
    toggleFavorite,
    setSettings,
    reset,
    reload: loadBackendData,
    downloadFile,
    login,
    register,
    logout,
  }), [
    files,
    activity,
    settings,
    liveMode,
    user,
    loading,
    log,
    addFiles,
    removeFiles,
    renameFile,
    toggleFavorite,
    setSettings,
    reset,
    loadBackendData,
    downloadFile,
    login,
    register,
    logout,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo must be used inside DemoProvider");
  return c;
}
