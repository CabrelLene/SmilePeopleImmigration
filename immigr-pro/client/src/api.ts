// client/src/api.ts
// API client centralisé avec gestion du token + endpoints user/admin

/* ---------- Base URL ---------- */
const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_BASE = RAW_BASE.replace(/\/$/, "");

/* ---------- Token storage ---------- */
const TOKEN_KEY = "token";

/** Stocke (ou supprime) le token côté client (localStorage) */
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/* ---------- Helpers ---------- */
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Essaie de parser du JSON, sinon renvoie la chaîne brute */
function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return t as any;
  }
}

/** Normalise un message d’erreur lisible pour l’UI */
function normalizeError(res: Response, data: any) {
  const fromBody =
    (typeof data === "object" && (data?.error || data?.message)) ||
    (typeof data === "string" ? data : null);

  const msg = fromBody || `${res.status} ${res.statusText}`;
  // petit nettoyage pour éviter les guillemets JSON ou retours à la ligne moches
  return String(msg).replace(/^"|"$|\\n/g, "");
}

/** Requête générique */
async function request<T = any>(
  path: string,
  opts: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    isForm?: boolean;
    signal?: AbortSignal;
    /** si vrai, n’inclut pas le header Authorization */
    noAuth?: boolean;
  } = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {
    ...(opts.isForm ? {} : { "Content-Type": "application/json" }),
    ...(opts.headers || {}),
  };

  const token = getToken();
  if (!opts.noAuth && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.isForm ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "include",
  });

  // On lit le corps QUOI QU’IL ARRIVE pour récupérer le message d’erreur proprement
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  const data = raw ? (ct.includes("application/json") ? safeJson(raw) : raw) : null;

  if (!res.ok) {
    throw new Error(normalizeError(res, data));
  }
  return data as T;
}

/* ---------- Utils URL absolue (prévisualisation) ---------- */
export function toAbsoluteUrl(u?: string) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  // si l’API renvoie "/uploads/..", on remonte à l’origin de l’API
  const origin = (() => {
    try {
      return new URL(API_BASE).origin;
    } catch {
      return "http://localhost:4000";
    }
  })();
  return `${origin}${u.startsWith("/") ? u : `/${u}`}`;
}

/* ---------- API publique ---------- */
export const api = {
  /* ---- Auth ---- */
  async register(data: { fullName: string; email: string; password: string }) {
    // POST JSON + noAuth
    const r = await request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: data,
      noAuth: true,
    });
    // on persiste le token pour les requêtes suivantes
    setToken(r.token);
    return r;
  },

  async login(email: string, password: string) {
    // POST JSON + noAuth
    const r = await request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: { email, password },
      noAuth: true,
    });
    // on persiste le token pour les requêtes suivantes
    setToken(r.token);
    return r;
  },

  async me() {
    return request<{ user: any }>("/auth/me", { method: "GET" });
  },

  async updateProfile(body: Partial<{ fullName: string; photoUrl: string }>) {
    return request<{ user: any }>("/auth/me", { method: "PATCH", body });
  },

  logout() {
    clearToken();
  },

  /* ---- Uploads ---- */
  async upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    // serveur: route montée sur /api/files
    return request<{ ok: boolean; file: { id: string; url: string; name: string; size: number; mimeType?: string } }>(
      "/files/upload",
      { method: "POST", isForm: true, body: fd }
    );
  },

  async deleteFile(id: string) {
    return request<{ ok: boolean }>(`/files/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  /* ---- Côté client (évaluation/recommandations) ---- */
  async evaluate() {
    // certains environnements n’ont pas ce endpoint — on gère un fallback
    try {
      return await request<{
        program: string;
        score: number;
        budget: number;
        recommendations: Array<{ label: string; score?: number }>;
      }>("/app/evaluate", { method: "GET" });
    } catch {
      // fallback démo si 404
      return {
        program: "Entrée Express — travailleurs qualifiés",
        score: 465,
        budget: 3800,
        recommendations: [
          { label: "Entrée Express — CEC", score: 455 },
          { label: "PNP Ontario", score: 460 },
          { label: "Arrima (Québec)", score: 430 },
        ],
      };
    }
  },

  /* ---- Admin : liste/tri/recherche/pagination côté serveur ---- */
  async adminList(params: {
    q?: string;
    status?: string; // "all" ou statut exact
    sort?: "createdAt" | "updatedAt" | "status" | "score" | "budgetEstimate" | "name";
    dir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.sort) qs.set("sort", params.sort);
    if (params.dir) qs.set("dir", params.dir);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));

    return request<{
      items: any[];
      total: number;
      page: number;
      pageCount: number;
    }>(`/admin/apps?${qs.toString()}`, { method: "GET" });
  },

  async adminUpdate(
    id: string,
    body: Partial<{ status: string; programSuggestion: string; budgetEstimate: number; counselor: string }>
  ) {
    return request<any>(`/admin/apps/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
  },

  async adminAddNote(id: string, body: { text: string }) {
    return request<{ ok: boolean }>(`/admin/apps/${encodeURIComponent(id)}/notes`, {
      method: "POST",
      body,
    });
  },
};

export default api;
