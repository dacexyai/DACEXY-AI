const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("dacexy", {
  version: process.env["npm_package_version"] || "1.0.2",
  platform: process.platform,
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
  devPowerShell: (command) => ipcRenderer.invoke("dacexy:dev-powershell", command),
  openclaw: {
    connect: (url) => ipcRenderer.invoke("dacexy:openclaw-connect", url),
    disconnect: () => ipcRenderer.invoke("dacexy:openclaw-disconnect"),
    status: () => ipcRenderer.invoke("dacexy:openclaw-status"),
    send: (text) => ipcRenderer.invoke("dacexy:openclaw-send", text),
    onStatus: (cb) => { const l = (_e, state) => cb(state); ipcRenderer.on("dacexy:openclaw-status", l); return () => ipcRenderer.removeListener("dacexy:openclaw-status", l); },
  },
});
