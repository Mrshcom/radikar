import { spawn, spawnSync } from "node:child_process";
import { createConnection } from "node:net";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const statusOnly = process.argv.includes("--status");
const services = [
  { label: "وب", port: 3161, script: "dev:web" },
  { label: "API", port: 3162, script: "dev:api" },
];

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (isOpen) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(isOpen);
    };

    socket.setTimeout(400);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function startPostgres() {
  const result = spawnSync("docker", ["compose", "up", "-d", "postgres"], { cwd: process.cwd(), stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("PostgreSQL محلی اجرا نشد. Docker Desktop را اجرا کنید و دوباره تلاش کنید.");
  }
}

function prepareDatabase() {
  const result = spawnSync(npmCommand, ["run", "db:migrate"], { cwd: process.cwd(), stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("اجرای migrationهای دیتابیس ناموفق بود.");
  }

  const seedResult = spawnSync(npmCommand, ["run", "db:seed"], { cwd: process.cwd(), stdio: "inherit" });
  if (seedResult.status !== 0) {
    throw new Error("ایجاد داده‌های اولیهٔ دیتابیس ناموفق بود.");
  }
}

function runDev(command) {
  const child = spawn(npmCommand, ["run", command], { cwd: process.cwd(), stdio: "inherit" });
  const stop = (signal) => {
    if (!child.killed) child.kill(signal);
  };

  process.once("SIGINT", () => stop("SIGINT"));
  process.once("SIGTERM", () => stop("SIGTERM"));

  child.once("exit", (code) => process.exit(code ?? 0));
}

async function main() {
  const state = await Promise.all(services.map(async (service) => ({ ...service, running: await isPortOpen(service.port) })));

  if (statusOnly) {
    for (const service of state) console.log(`${service.label}: ${service.running ? "در حال اجرا" : "متوقف"} (:${service.port})`);
    return;
  }

  startPostgres();
  prepareDatabase();

  const missing = state.filter((service) => !service.running);
  if (!missing.length) {
    console.log("وب و API از قبل در حال اجرا هستند؛ PostgreSQL هم آماده است.");
    return;
  }

  if (missing.length === services.length) {
    console.log("در حال اجرای وب و API...");
    runDev("dev:stack");
    return;
  }

  const [service] = missing;
  console.log(`${service.label} متوقف است؛ فقط همان سرویس اجرا می‌شود...`);
  runDev(service.script);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
