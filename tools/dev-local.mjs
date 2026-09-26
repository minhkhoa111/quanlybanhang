import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const faceDirectory = path.join(root, "python-ai");
const faceExecutable = path.join(faceDirectory, ".venv", "bin", "uvicorn");
const webExecutable = path.join(root, "node_modules", ".bin", "vinext");
const children = new Set();
let stopping = false;

if (!existsSync(webExecutable)) {
  console.error("Chưa có thư viện web. Hãy chạy npm install trước.");
  process.exit(1);
}

const faceAlreadyRunning = await isFaceServerOnline();
if (faceAlreadyRunning) {
  console.log("[face] Đã có máy chủ tại http://127.0.0.1:8001");
} else if (existsSync(faceExecutable)) {
  launch("face", faceExecutable, ["face_server:app", "--host", "127.0.0.1", "--port", "8001"], faceDirectory, {}, false);
  console.log("[face] Đang khởi tạo TensorFlow/DeepFace…");
  await waitForFaceServer(60_000);
} else {
  console.warn("[face] Chưa có môi trường DeepFace; website vẫn khởi động. Chức năng nhận diện khuôn mặt sẽ tạm thời không khả dụng.");
}
launch("web", webExecutable, ["dev", "--port", "3001", "--strictPort"], root, { WRANGLER_LOG_PATH: ".wrangler/wrangler.log" });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

function launch(label, command, args, cwd, extraEnvironment = {}, stopWebOnExit = true) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...extraEnvironment }, stdio: "inherit" });
  children.add(child);
  child.once("exit", (code, signal) => {
    children.delete(child);
    if (stopping) return;
    if (code && code !== 0) console.error(`[${label}] Đã dừng với mã lỗi ${code}.`);
    else if (signal) console.error(`[${label}] Đã dừng bởi ${signal}.`);

    if (label === "web") {
      console.warn(`[web] Đang tự động khởi động lại dịch vụ web sau 1.5s để giữ kết nối Cloudflare...`);
      setTimeout(() => {
        if (!stopping) {
          launch("web", command, args, cwd, extraEnvironment, stopWebOnExit);
        }
      }, 1500);
      return;
    }

    if (stopWebOnExit) shutdown("SIGTERM", code || 0);
    else console.warn(`[${label}] Không khả dụng; website vẫn tiếp tục chạy.`);
  });
  child.once("error", (error) => {
    console.error(`[${label}] Không thể khởi động: ${error.message}`);
    if (label === "web") {
      setTimeout(() => {
        if (!stopping) {
          launch("web", command, args, cwd, extraEnvironment, stopWebOnExit);
        }
      }, 2000);
      return;
    }
    if (stopWebOnExit) shutdown("SIGTERM", 1);
    else console.warn(`[${label}] Không khả dụng; website vẫn tiếp tục chạy.`);
  });
}

function shutdown(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
  const timer = setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
    process.exit(exitCode);
  }, 3000);
  timer.unref();
  if (!children.size) process.exit(exitCode);
}

async function isFaceServerOnline() {
  try {
    const response = await fetch("http://127.0.0.1:8001/health", { signal: AbortSignal.timeout(1500) });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.ok === true;
  } catch {
    return false;
  }
}

async function waitForFaceServer(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isFaceServerOnline()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}
