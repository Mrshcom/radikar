import { execFileSync } from "node:child_process";

const run = (command, args) => execFileSync(command, args, { cwd: process.cwd(), stdio: "inherit" });

try {
  run("docker", ["compose", "up", "-d", "postgres"]);
} catch {
  console.error("PostgreSQL test service could not be started. Start Docker Desktop and retry.");
  process.exit(1);
}
