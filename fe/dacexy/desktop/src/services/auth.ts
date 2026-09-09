const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const KEY = "dacexy.session";
const LICENSE_KEY = "dacexy.license";
const MACHINE_ID_KEY = "dacexy.machine";

export interface Account { name: string; email: string; plan: string; token: string; }

function getMachineId(): string {
  let id = localStorage.getItem(MACHINE_ID_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(MACHINE_ID_KEY, id); }
  return id;
}

function errorMessage(data: any, fallback: string) {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((x) => x?.msg || String(x)).join("; ");
  if (detail && typeof detail === "object") return detail.message || detail.msg || JSON.stringify(detail);
  return data?.message || fallback;
}

export function restore(): Account | null { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Account : null; } catch { return null; } }
export function signOut() { localStorage.removeItem(KEY); }

export async function signIn(email: string, password: string, licenseKey?: string): Promise<Account> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password }) });
  } catch { throw new Error("Unable to connect to the DACEXY AI server."); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorMessage(data, `Sign in failed (HTTP ${res.status})`));
  const { access_token, user } = data;

  const licRes = await fetch(`${API_URL}/api/v1/license/verify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` }, body: JSON.stringify({ key: licenseKey || "", machine_id: getMachineId() }) });
  const licData = await licRes.json().catch(() => null);
  if (!licRes.ok) throw new Error(errorMessage(licData, `License verification failed (HTTP ${licRes.status})`));
  if (!licData.valid) throw new Error("License invalid or expired");

  if (licenseKey) localStorage.setItem(LICENSE_KEY, licenseKey);
  const account: Account = { name: `${user.first_name} ${user.last_name}`, email: user.email, plan: user.plan, token: access_token };
  localStorage.setItem(KEY, JSON.stringify(account));
  return account;
}

export function getStoredLicenseKey() { return localStorage.getItem(LICENSE_KEY); }
export function initials(account: Account) { return account.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(); }
