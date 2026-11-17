import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

const worker = setupWorker(...handlers);
let started: ReturnType<typeof worker.start> | undefined;
export function startMockWorker() {
  started ??= worker.start({ quiet: true, onUnhandledRequest: "bypass", serviceWorker: { url: "/mockServiceWorker.js" } }).then(async registration => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller?.scriptURL.endsWith("/mockServiceWorker.js")) return registration;
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Mock service worker did not take control of this page.")); }, 10_000);
      const checkController = () => {
        if (!navigator.serviceWorker.controller?.scriptURL.endsWith("/mockServiceWorker.js")) return;
        cleanup();
        resolve();
      };
      const cleanup = () => {
        window.clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener("controllerchange", checkController);
      };
      navigator.serviceWorker.addEventListener("controllerchange", checkController);
      checkController();
    });
    return registration;
  }).catch(error => {
    started = undefined;
    throw error;
  });
  return started;
}
