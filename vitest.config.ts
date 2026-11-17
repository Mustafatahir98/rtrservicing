import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/vitest-setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    mockReset: true,
  },
});
