import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("DACEXY renderer error", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", padding: 32, background: "#fbfbfd", color: "#172033" }}>
          <h1>DACEXY AI could not render</h1>
          <p>The desktop renderer hit an error instead of showing a blank screen.</p>
          <pre style={{ whiteSpace: "pre-wrap", padding: 16, borderRadius: 12, background: "#f0f1f5" }}>{this.state.error.message}\n\n{this.state.error.stack ?? ""}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
