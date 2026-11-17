import { borrowerMockMode } from "./mock-mode";

/** Every browser demo request waits for MSW to control the page. */
export async function waitForMockWorker() {
  if (!borrowerMockMode || typeof window === "undefined") return;
  const { startMockWorker } = await import("@/mocks/browser");
  await startMockWorker();
}
