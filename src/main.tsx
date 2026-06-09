import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import "./styles/app.css";

function prewarmFontFallbacks() {
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.style.cssText = "position:absolute;left:-9999px;top:0;opacity:0;pointer-events:none";
  span.textContent = "\u{1F600}\u{1F389}✨\u{1F4E6}\u{1F680} 中文 日本語 한국어 ∑∫√ ✓✗";
  document.body.appendChild(span);
  void span.getBoundingClientRect();
  requestAnimationFrame(() => requestAnimationFrame(() => span.remove()));
}

prewarmFontFallbacks();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
