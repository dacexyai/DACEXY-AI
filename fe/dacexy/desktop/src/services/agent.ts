import { GatewayClient, type GatewayAuth } from "../lib/gateway";
import { authorizeTask, reportTask } from "./usage";

export type Role = "user" | "assistant";
export interface Message { id: string; role: Role; content: string; createdAt: number; }
export interface Conversation { id: string; title: string; messages: Message[]; updatedAt: number; }
export interface AgentSettings { model: string; temperature: number; desktopControl: boolean; telemetry: boolean; gatewayUrl: string; }
export interface AgentStatus { connected: boolean; label: string; }
export const APP_VERSION = "1.1.3";
export const AGENT_MODELS = ["dacexy-core", "dacexy-fast", "dacexy-reasoning"];
export const DEFAULT_SETTINGS: AgentSettings = { model: "dacexy-core", temperature: 0.4, desktopControl: true, telemetry: false, gatewayUrl: "ws://127.0.0.1:18789" };
const uid = () => Math.random().toString(36).slice(2, 10);
let gatewayClient: GatewayClient | null = null;
let lastGatewayUrl = "";
let gwConnected = false;
let gatewayAuth: GatewayAuth = { mode: "none" };

async function loadGatewayAuth(): Promise<GatewayAuth> {
  try {
    const api = (window as any).dacexy;
    if (api?.getGatewayCredentials) {
      const auth = await api.getGatewayCredentials();
      if (auth && typeof auth === "object") return auth as GatewayAuth;
    }
  } catch {
    // Browser/dev mode: fall back to no auth. The desktop build uses the Electron preload path.
  }
  return { mode: "none" };
}

function clientFor(settings: AgentSettings): GatewayClient {
  if (!gatewayClient || lastGatewayUrl !== settings.gatewayUrl) {
    gatewayClient?.disconnect();
    gatewayClient = new GatewayClient(settings.gatewayUrl, gatewayAuth);
    gatewayClient.onStatus = (connected) => { gwConnected = connected; };
    lastGatewayUrl = settings.gatewayUrl;
  } else {
    gatewayClient.setAuth(gatewayAuth);
  }
  return gatewayClient;
}

export function createMessage(role: Role, content: string): Message { return { id: uid(), role, content, createdAt: Date.now() }; }
export function createConversation(title = "New conversation"): Conversation { return { id: uid(), title, messages: [], updatedAt: Date.now() }; }

export async function connectAgent(settings: AgentSettings): Promise<void> {
  gatewayAuth = await loadGatewayAuth();
  const client = clientFor(settings);
  await client.connect();
  gwConnected = true;
}

export function disconnectAgent(): void {
  gatewayClient?.disconnect();
  gwConnected = false;
}

export function getStatus(_settings: AgentSettings): AgentStatus {
  return { connected: gwConnected, label: gwConnected ? "🟢 Agent online · ready" : "⚫ Agent offline" };
}

export interface SendOptions { conversation: Conversation; input: string; settings: AgentSettings; signal?: AbortSignal; }
export async function sendMessage({ conversation, input, settings }: SendOptions): Promise<Message> {
  // The Gateway connection is used for health/status, while actual task execution
  // goes through the official agent CLI bridge. This avoids the old extra
  // round-trip/custom WebSocket path and gives each DACEXY chat its own execution session.
  if (!gwConnected) await connectAgent(settings);
  const api = (window as any).dacexy?.openclaw;
  if (!api?.send) throw new Error("DACEXY agent bridge is unavailable.");
  const sessionKey = `agent:main:dacexy-${String(conversation.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}`;
  // Server-authoritative budget gate. No task starts without an active plan budget.
  const authorization = await authorizeTask();
  let run: any = null;
  let runStatus = "completed";
  try {
    run = await api.send(input, sessionKey, {
      taskId: authorization.task_id,
      taskTimeoutSeconds: authorization.task_timeout_seconds,
      maxConcurrentTasks: authorization.max_concurrent_tasks,
    });
    const text = typeof run === "string" ? run : (run?.text || run?.final || "");
    if (!text) throw new Error("The agent returned no terminal result; DACEXY will not report a false success.");
    return createMessage("assistant", text);
  } catch (error) {
    runStatus = "failed";
    throw error;
  } finally {
    try {
      await reportTask(authorization.task_id, run?.costUsd, run?.usage, runStatus);
    } catch (meterError) {
      // Do not hide a completed task, but surface accounting failure so the
      // next run cannot silently continue with an unknown spend ledger.
      console.error("DACEXY usage accounting failed", meterError);
    }
  }
}
export const SUGGESTIONS = ["Summarise my downloads", "Draft an email", "Research competitors", "Organize my files"];
