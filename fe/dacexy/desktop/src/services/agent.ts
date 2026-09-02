import { GatewayClient, type GatewayAuth } from "../lib/gateway";

export type Role = "user" | "assistant";
export interface Message { id: string; role: Role; content: string; createdAt: number; }
export interface Conversation { id: string; title: string; messages: Message[]; updatedAt: number; }
export interface AgentSettings { model: string; temperature: number; desktopControl: boolean; telemetry: boolean; gatewayUrl: string; }
export interface AgentStatus { connected: boolean; label: string; }
export const APP_VERSION = "1.0.2";
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
export async function sendMessage({ input, settings }: SendOptions): Promise<Message> {
  gatewayAuth = await loadGatewayAuth();
  const client = clientFor(settings);
  await client.connect();
  const reply = await client.sendMessage(input);
  return createMessage("assistant", reply || "No response from OpenClaw.");
}
export const SUGGESTIONS = ["Summarise my downloads", "Draft an email", "Research competitors", "Organize my files"];
