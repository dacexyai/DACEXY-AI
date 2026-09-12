export type GatewayAuth = { mode: "none" | "token" | "password"; token?: string; password?: string };
type OpenClawApi = { connect:(url:string)=>Promise<any>; disconnect:()=>Promise<any>; status:()=>Promise<{connected:boolean,error?:string}>; send:(text:string)=>Promise<string>; onStatus:(cb:(s:{connected:boolean,error?:string})=>void)=>()=>void };
type DWin = Window & { dacexy?: { openclaw?: OpenClawApi } };
export class GatewayClient {
  private connected=false; private off:(()=>void)|null=null;
  public onReply:((text:string)=>void)|null=null; public onStatus:((connected:boolean)=>void)|null=null;
  constructor(private url:string, private _auth:GatewayAuth={mode:"none"}){}
  setAuth(auth:GatewayAuth){ this._auth=auth; }
  private api(){ const api=(window as DWin).dacexy?.openclaw; if(!api) throw new Error("DACEXY OpenClaw bridge is unavailable"); return api; }
  async connect(){ const api=this.api(); if(!this.off) this.off=api.onStatus(s=>{this.connected=!!s.connected;this.onStatus?.(this.connected);}); const r=await api.connect(this.url); this.connected=!!r?.connected; this.onStatus?.(this.connected); return r; }
  async sendMessage(text:string){ await this.connect(); const r=await this.api().send(text); if(r)this.onReply?.(r); return r||"No response from OpenClaw."; }
  disconnect(){ this.api().disconnect().catch(()=>{}); this.off?.(); this.off=null; this.connected=false; this.onStatus?.(false); }
}
