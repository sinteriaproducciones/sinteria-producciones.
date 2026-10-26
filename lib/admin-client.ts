export async function adminRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(path, { ...options, credentials: "same-origin", cache: "no-store" });
  const value = await response.json() as any;
  if (!response.ok) throw Object.assign(new Error(value.error || "No se pudo completar la acción."), { status: response.status });
  return value;
}
