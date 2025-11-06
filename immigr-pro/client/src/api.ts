const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
let token: string | null = localStorage.getItem("token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("token", t); else localStorage.removeItem("token");
}

async function http(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  register: (body:any) => http("/api/auth/register",{ method:"POST", body: JSON.stringify(body)}),
  login:    (body:any) => http("/api/auth/login",{ method:"POST", body: JSON.stringify(body)}),
  saveStep: (key:string, data:any) => http("/api/applications/answers",{ method:"POST", body: JSON.stringify({key,data}) }),
  evaluate: () => http("/api/applications/evaluate",{ method:"GET" }),
  // uploads (form-data)
  upload: async (file:File, applicationId?:string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (applicationId) fd.append("applicationId", applicationId);
    const res = await fetch(`${BASE}/api/uploads`, {
      method:"POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // admin
  listApps: () => http("/api/applications",{ method:"GET" }),
  setStatus: (id:string, status:string) => http(`/api/applications/${id}/status`,{ method:"PATCH", body: JSON.stringify({status}) })
};
