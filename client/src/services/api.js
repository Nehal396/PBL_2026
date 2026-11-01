const API_URL = import.meta.env.VITE_API_URL || "/api/v1";
let csrfToken = "";

export function setCsrfToken(token) {
  csrfToken = token || "";
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers
    }
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function imageFor(product) {
  return product?.images?.[0] || "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80";
}

export function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}
