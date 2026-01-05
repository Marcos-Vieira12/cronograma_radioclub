// src/apiFetch.ts
type ApiFetchOptions = RequestInit & {
  // se true, não manda Authorization
  public?: boolean;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE) {
  throw new Error("VITE_API_BASE_URL não definida");
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

// fetch centralizado: injeta Authorization e trata 401
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
  onUnauthorized?: () => void
) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");

  if (!options.public) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const resp = await fetch(url, { ...options, headers });

  // tenta ler body pra detectar mensagem também
  let data: any = null;
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await resp.json();
    } catch {
      data = null;
    }
  } else {
    // se não for json, tenta texto
    try {
      data = await resp.text();
    } catch {
      data = null;
    }
  }

  // se não autorizado, limpa token e manda pro login
  const notAuthMsg =
    (typeof data?.detail === "string" && data.detail.toLowerCase().includes("not authenticated")) ||
    (typeof data === "string" && data.toLowerCase().includes("not authenticated"));

  if (resp.status === 401 || notAuthMsg) {
    clearToken();
    onUnauthorized?.();
    const err = new Error("Not authenticated");
    (err as any).status = 401;
    throw err;
  }

  if (!resp.ok) {
    const msg =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.message === "string" && data.message) ||
      "Erro na API";
    const err = new Error(msg);
    (err as any).status = resp.status;
    throw err;
  }

  return data;
}
