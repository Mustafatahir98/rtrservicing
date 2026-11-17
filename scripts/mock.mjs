import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const [command, ...args] = process.argv.slice(2);
if (!["dev", "build", "start"].includes(command)) throw new Error("Use mock.mjs dev, build or start.");
// Explicit preview mode, with DB credentials unavailable to the preview process.
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), command, ...args], {
  stdio: "inherit", windowsHide: true,
  env: { ...process.env, NEXT_PUBLIC_API_MOCKING: "enabled" },
});
child.on("error", () => { console.error("Could not start the borrower mock preview."); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
