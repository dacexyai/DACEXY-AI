const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("dacexy", {
  version: process.env["npm_package_version"] || "1.1.1",
  platform: process.platform,
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
  getGatewayCredentials: () => ipcRenderer.invoke("dacexy:openclaw-credentials"),
  devPowerShell: (command) => ipcRenderer.invoke("dacexy:dev-powershell", command),
  permissions: { get: () => ipcRenderer.invoke("dacexy:permissions-get"), grant: (scope) => ipcRenderer.invoke("dacexy:permissions-grant", scope), revoke: (scope) => ipcRenderer.invoke("dacexy:permissions-revoke", scope) },
  automations: { list: () => ipcRenderer.invoke("dacexy:automations-list"), create: (spec) => ipcRenderer.invoke("dacexy:automations-create", spec), remove: (id) => ipcRenderer.invoke("dacexy:automations-delete", id), results: () => ipcRenderer.invoke("dacexy:automations-results"), onResult: (cb) => { const l = (_e, result) => cb(result); ipcRenderer.on("dacexy:automation-result", l); return () => ipcRenderer.removeListener("dacexy:automation-result", l); }, run: (id) => ipcRenderer.invoke("dacexy:automations-run", id), native: (action, args) => ipcRenderer.invoke("dacexy:automation-native", action, args), enable: (id) => ipcRenderer.invoke("dacexy:automations-enable", id), disable: (id) => ipcRenderer.invoke("dacexy:automations-disable", id) },
  openclaw: {
    connect: (url) => ipcRenderer.invoke("dacexy:openclaw-connect", url),
    disconnect: () => ipcRenderer.invoke("dacexy:openclaw-disconnect"),
    status: () => ipcRenderer.invoke("dacexy:openclaw-status"),
    send: (text, sessionKey, executionPolicy) => ipcRenderer.invoke("dacexy:openclaw-send", text, sessionKey, executionPolicy),
    onStatus: (cb) => { const l = (_e, state) => cb(state); ipcRenderer.on("dacexy:openclaw-status", l); return () => ipcRenderer.removeListener("dacexy:openclaw-status", l); },
  },
});
