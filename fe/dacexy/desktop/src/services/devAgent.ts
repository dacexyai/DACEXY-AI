export type ShellResult = { ok: boolean; code: number; stdout: string; stderr: string };

declare global { interface Window { dacexy?: { devPowerShell?: (command: string) => Promise<ShellResult> } } }

export async function runRealPowerShell(command: string): Promise<ShellResult> {
  if (!window.dacexy?.devPowerShell) throw new Error("Developer PowerShell bridge unavailable");
  return window.dacexy.devPowerShell(command);
}

export async function verifyDacexyRuntime() {
  const ps = await runRealPowerShell(`$x=Test-NetConnection 127.0.0.1 -Port 18789 -WarningAction SilentlyContinue; [pscustomobject]@{port=18789;up=$x.TcpTestSucceeded} | ConvertTo-Json -Compress`);
  return { ...ps, ports: ps.stdout.trim() };
}
