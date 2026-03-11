"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const API_UPLOAD_URL = process.env.NEXT_PUBLIC_API_UPLOAD_URL || "https://mombasaunited.com/upload/upload";


export async function apiJson<T>(
  path: string,
  opts?: {
    token?: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
  }
) {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers || {}),
  };

  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(url, {
    method: opts?.method || "GET",
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const t = await res.text();
      msg = t || msg;
    } catch {}
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export async function apiUpload<T>(
  path: string,
  opts: { token?: string | null; form: FormData; method?: string }
): Promise<T> {
  const res = await fetch(`${API_UPLOAD_URL}${path}`, {
    method: opts.method || "POST",
    headers: {
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.form,
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }
  return (await res.json()) as T;
}
