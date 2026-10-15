import type { ActivityItem, Category, DemoFile, FileKind } from "./mock-data";
import type { Settings } from "./demo-store";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");

const TOKEN_KEY = "scs_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errMessage = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return response.json();
}

export const api = {
  health: {
    check: () => apiRequest<{ status: string; database: { connected: boolean }; storage: { backend: string }; ai: { embeddings_ready: boolean } }>("/api/health"),
  },

  auth: {
    login: async (email: string, password: string) => {
      const data = await apiRequest<{ access_token: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.access_token) setToken(data.access_token);
      return data;
    },
    register: async (email: string, password: string, name?: string) => {
      const data = await apiRequest<{ access_token: string; user: any }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      });
      if (data.access_token) setToken(data.access_token);
      return data;
    },
    me: () => apiRequest<any>("/api/auth/me"),
    logout: () => clearToken(),
  },

  dashboard: {
    get: () => apiRequest<{
      total_files: number;
      storage_used: number;
      storage_quota: number;
      available_storage: number;
      duplicate_count: number;
      recent_files: DemoFile[];
      storage_distribution: { name: Category; value: number; size: number }[];
      recent_activity: ActivityItem[];
    }>("/api/dashboard"),
  },

  files: {
    list: (params: { q?: string; category?: string; sort?: string; favorite?: boolean } = {}) => {
      const qp = new URLSearchParams();
      if (params.q) qp.set("q", params.q);
      if (params.category && params.category !== "All") qp.set("category", params.category);
      if (params.sort) qp.set("sort", params.sort);
      if (params.favorite !== undefined) qp.set("favorite", String(params.favorite));
      return apiRequest<DemoFile[]>(`/api/files?${qp.toString()}`);
    },
    get: (id: string) => apiRequest<DemoFile>(`/api/files/${id}`),
    upload: (fileList: File[]) => {
      const formData = new FormData();
      fileList.forEach((file) => formData.append("files", file));
      return apiRequest<{ uploaded: DemoFile[]; count: number }>("/api/files/upload", {
        method: "POST",
        body: formData,
      });
    },
    downloadUrl: (id: string) => `${API_BASE_URL}/api/files/${id}/download`,
    download: async (id: string, filename: string) => {
      const token = getToken();
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch(`${API_BASE_URL}/api/files/${id}/download`, { headers });
      if (!res.ok) throw new Error("Failed to download file");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    },
    update: (id: string, updates: { name?: string; category?: string; favorite?: boolean }) =>
      apiRequest<DemoFile>(`/api/files/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      apiRequest<{ success: boolean; deleted_id: string }>(`/api/files/${id}`, {
        method: "DELETE",
      }),
    classify: (id: string) =>
      apiRequest<{ file_id: string; category: Category; confidence: number }>(`/api/files/${id}/classify`, {
        method: "POST",
      }),
  },

  search: {
    query: (params: { q: string; kind?: string; category?: string; days?: string }) => {
      const qp = new URLSearchParams({ q: params.q });
      if (params.kind && params.kind !== "all") qp.set("kind", params.kind);
      if (params.category && params.category !== "all") qp.set("category", params.category);
      if (params.days && params.days !== "all") qp.set("days", params.days);
      return apiRequest<{
        query: string;
        results: { file: DemoFile; score: number; match_mode: string }[];
        count: number;
        embedding_model_ready: boolean;
      }>(`/api/search?${qp.toString()}`);
    },
  },

  similar: {
    get: (fileId: string) =>
      apiRequest<{
        target_file_id: string;
        similar: { file: DemoFile; f: DemoFile; score: number; reason: string }[];
      }>(`/api/similar/${fileId}`),
  },

  duplicates: {
    get: () =>
      apiRequest<{
        groups: { type: "identical" | "name"; files: DemoFile[] }[];
        count: number;
        recoverable_bytes: number;
        total_files_scanned: number;
      }>("/api/duplicates"),
    delete: (fileIds: string[]) =>
      apiRequest<{ success: boolean; deleted_count: number }>("/api/duplicates/delete", {
        method: "POST",
        body: JSON.stringify({ file_ids: fileIds }),
      }),
  },

  analytics: {
    get: () =>
      apiRequest<{
        total_files: number;
        storage_used: number;
        storage_quota: number;
        remaining_storage: number;
        duplicate_count: number;
        category_distribution: { name: Category; value: number }[];
        file_types: { name: string; count: number }[];
        upload_history: { month: string; uploads: number; gb: number }[];
        recent_activity: ActivityItem[];
      }>("/api/analytics"),
  },

  activity: {
    list: (params: { type?: string; limit?: number } = {}) => {
      const qp = new URLSearchParams();
      if (params.type && params.type !== "all") qp.set("type", params.type);
      if (params.limit) qp.set("limit", String(params.limit));
      return apiRequest<ActivityItem[]>(`/api/activity?${qp.toString()}`);
    },
  },

  settings: {
    get: () => apiRequest<Settings>("/api/settings"),
    update: (updates: Partial<Settings>) =>
      apiRequest<Settings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
  },
};
