const CONFIGURED_API_URL = import.meta.env["VITE_API_URL"] as string | undefined;
// Keep local development on localhost, but never let a production build silently
// point at a user's local machine. The Render service is the production backend
// defined by backend/render.yaml; VITE_API_URL can still override it per deployment.
const DEFAULT_PRODUCTION_API_URL = "https://dacexy-ai.onrender.com";
const EFFECTIVE_API_URL = (
  CONFIGURED_API_URL || (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_URL : "http://localhost:8000")
).replace(/\/+$/, "");

export type ApiUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  plan: string;
};
async function request<T>(path: string, body: unknown): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${EFFECTIVE_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Unable to connect to the DACEXY AI server. Please check your internet connection or try again."
    );
  }

  let data: any = null;

  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}.`);
    }
  }

  if (!res.ok) {
    const detail = data?.detail;

    let message = "Something went wrong.";

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((item: any) => {
          if (typeof item === "string") return item;

          if (item?.msg) {
            const location = Array.isArray(item.loc)
              ? ` (${item.loc.join(".")})`
              : "";

            return `${item.msg}${location}`;
          }

          return JSON.stringify(item);
        })
        .join("; ");
    } else if (detail && typeof detail === "object") {
      message =
        detail.message ||
        detail.msg ||
        JSON.stringify(detail);
    } else if (typeof data?.message === "string") {
      message = data.message;
    } else if (typeof data === "string") {
      message = data;
    }

    throw new Error(message);
  }

  return data as T;
}


export function signup(body: {
  first: string;
  last: string;
  email: string;
  company?: string;
  password: string;
}) {
  return request<{ access_token: string; refresh_token: string; user: ApiUser }>("/api/v1/auth/signup", body);
}

export function login(body: { email: string; password: string }) {
  return request<{ access_token: string; refresh_token: string; user: ApiUser }>("/api/v1/auth/login", body);
}

export function saveSession(token: string, user: ApiUser, refreshToken?: string) {
  localStorage.setItem("dacexy_token", token);
  if (refreshToken) localStorage.setItem("dacexy_refresh_token", refreshToken);
  localStorage.setItem("dacexy_user", JSON.stringify(user));
}


export type BillingSubscription = {
  subscription_id: string;
  plan: string;
  key_id: string;
};

export async function createSubscription(plan: "business" | "enterprise") {
  const token = localStorage.getItem("dacexy_token");
  if (!token) throw new Error("Please sign in before subscribing.");
  const res = await fetch(`${EFFECTIVE_API_URL}/api/v1/billing/create-subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Unable to start subscription");
  return data as BillingSubscription;
}

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Checkout is only available in a browser."));
  if ((window as typeof window & { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-dacexy-razorpay]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay Checkout failed to load.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.dacexyRazorpay = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout failed to load."));
    document.head.appendChild(script);
  });
}

export async function startRazorpaySubscription(plan: "business" | "enterprise") {
  await loadRazorpayCheckout();
  const subscription = await createSubscription(plan);
  const RazorpayCtor = (window as typeof window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
  if (!RazorpayCtor) throw new Error("Razorpay Checkout is unavailable.");
  const user = JSON.parse(localStorage.getItem("dacexy_user") || "null") as ApiUser | null;
  const checkout = new RazorpayCtor({
    key: subscription.key_id,
    subscription_id: subscription.subscription_id,
    name: "DACEXY AI",
    description: `DACEXY ${plan === "business" ? "Business" : "Enterprise"} subscription`,
    prefill: user ? { name: `${user.first_name} ${user.last_name}`, email: user.email } : undefined,
    theme: { color: "#7c3aed" },
  });
  checkout.open();
}


export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatQuota = {
  plan: string;
  calls_used: number;
  calls_limit: number;
  calls_remaining: number;
};

export type ChatResponse = ChatQuota & {
  reply: string;
};

export async function sendBusinessAdvisorMessage(
  message: string,
  history: ChatHistoryMessage[],
): Promise<ChatResponse> {
  const token = localStorage.getItem("dacexy_token");
  if (!token) throw new Error("Please sign in to use the business advisor.");

  const res = await fetch(`${EFFECTIVE_API_URL}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // handled below
  }

  if (!res.ok) {
    const detail = data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    if (detail?.message) throw new Error(detail.message);
    throw new Error(`Business advisor request failed (HTTP ${res.status}).`);
  }

  return data as ChatResponse;
}

export async function getBusinessAdvisorQuota(): Promise<ChatQuota> {
  const token = localStorage.getItem("dacexy_token");
  if (!token) throw new Error("Please sign in to use the business advisor.");

  const res = await fetch(`${EFFECTIVE_API_URL}/api/v1/chat/quota`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data?.detail === "string" ? data.detail : "Unable to load chat quota.");
  }
  return data as ChatQuota;
}
