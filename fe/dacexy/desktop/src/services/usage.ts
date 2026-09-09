const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export type TaskAuthorization = {
  allowed: boolean;
  plan: string;
  task_id: string;
  budget_rupees: number;
  spent_rupees: number;
  remaining_rupees: number;
  reserved_rupees: number;
  task_timeout_seconds: number;
  max_concurrent_tasks: number;
  reason?: string | null;
};

function token() {
  try {
    const raw = localStorage.getItem("dacexy.session");
    return raw ? JSON.parse(raw)?.token || "" : "";
  } catch { return ""; }
}

async function call(path: string, body?: unknown) {
  const auth = token();
  if (!auth) throw new Error("Please sign in to continue.");
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data?.detail === "string" ? data.detail : `Usage service unavailable (HTTP ${res.status}).`);
  return data;
}

export async function authorizeTask(): Promise<TaskAuthorization> {
  return call("/api/v1/usage/authorize-task");
}

export async function getUsageStats() {
  const auth = token();
  if (!auth) throw new Error("Please sign in to continue.");
  const res = await fetch(`${API_URL}/api/v1/usage/stats`, { headers: { Authorization: `Bearer ${auth}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data?.detail === "string" ? data.detail : `Usage service unavailable (HTTP ${res.status}).`);
  return data;
}

export async function reportTask(taskId: string, costUsd: number | null | undefined, usage: any, status = "completed") {
  return call("/api/v1/usage/report-task", {
    task_id: taskId,
    cost_usd: Number.isFinite(Number(costUsd)) ? Number(costUsd) : 0,
    input_tokens: Number.isFinite(Number(usage?.input)) ? Number(usage.input) : null,
    output_tokens: Number.isFinite(Number(usage?.output)) ? Number(usage.output) : null,
    status,
  });
}
