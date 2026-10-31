import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import process from "node:process";

const port = await getAvailablePort();
const child = spawn(
  "pnpm",
  ["--dir", "cloudflare", "exec", "wrangler", "dev", "--local", "--ip", "127.0.0.1", "--port", String(port), "--config", "wrangler.jsonc"],
  { cwd: process.cwd(), env: { ...process.env, CI: "1" }, stdio: ["ignore", "pipe", "pipe"] },
);

let output = "";
child.stdout.on("data", (chunk) => { output = appendOutput(output, chunk); });
child.stderr.on("data", (chunk) => { output = appendOutput(output, chunk); });

try {
  const response = await waitForWorker(`http://127.0.0.1:${port}/sw.js`, child);
  const body = await response.text();
  if (response.status !== 200 || !body.includes("registration.unregister")) {
    throw new Error(`Unexpected smoke response: ${response.status}`);
  }
  if (response.headers.get("x-content-type-options") !== "nosniff") {
    throw new Error("Security headers are missing from the smoke response");
  }
  console.log("Worker startup smoke test passed.");
} catch (error) {
  console.error(output.trim());
  throw error;
} finally {
  await terminate(child);
}

// pnpm -> wrangler -> workerd is a process tree. Killing only the direct child
// leaves workerd running with our stdio pipes open, which keeps the event loop
// alive and makes this script hang after the smoke test has already passed.
async function terminate(processHandle) {
  if (processHandle.exitCode !== null) return;

  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(processHandle.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      processHandle.kill();
    }
  } else {
    processHandle.kill("SIGTERM");
  }

  await Promise.race([
    new Promise((resolve) => processHandle.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  if (processHandle.exitCode === null) processHandle.kill("SIGKILL");

  processHandle.stdout?.destroy();
  processHandle.stderr?.destroy();
}

async function getAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (!port) throw new Error("Unable to allocate a smoke-test port");
  return port;
}

async function waitForWorker(url, processHandle) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) throw new Error(`Wrangler exited with code ${processHandle.exitCode}`);
    try {
      return await fetch(url);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error("Timed out waiting for Wrangler dev");
}

function appendOutput(previous, chunk) {
  return `${previous}${String(chunk)}`.slice(-12000);
}
