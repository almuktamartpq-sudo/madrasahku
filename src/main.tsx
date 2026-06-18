import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for PWA with auto-update
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      // Check for updates periodically (every 30 min)
      setInterval(() => reg.update(), 30 * 60 * 1000);

      // When new SW is waiting, tell it to skip waiting and reload
      reg.addEventListener("updatefound", () => {
        const newSw = reg.installing;
        if (!newSw) return;
        newSw.addEventListener("statechange", () => {
          if (newSw.state === "installed" && navigator.serviceWorker.controller) {
            // New version available — reload page
            newSw.postMessage("SKIP_WAITING");
            window.location.reload();
          }
        });
      });

      // Reload when new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch {
      // SW registration failed — app still works without offline support
    }
  });
}
