import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const dryRun = process.argv.includes("--dry-run");
const fullVerification = process.argv.includes("--full");
const green = (value) => `\x1b[32m${value}\x1b[0m`;
const fastStages = [
  { label: "Start PostgreSQL", args: ["run", "infra:up"] },
  { label: "Web TypeScript", args: ["run", "typecheck", "--workspace", "@radikar/web"] },
  { label: "API TypeScript", args: ["run", "typecheck", "--workspace", "@radikar/api"] },
  { label: "Web Lint", args: ["run", "lint", "--workspace", "@radikar/web"] },
  {
    label: "Web Unit Tests",
    args: ["run", "test:unit", "--workspace", "@radikar/web", "--", "--reporter=verbose"],
  },
  { label: "Web Rendered Tests", args: ["run", "test:rendered", "--workspace", "@radikar/web"] },
  { label: "API Tests", args: ["test", "--workspace", "@radikar/api"] },
];
const e2eStage = {
  label: "E2E Tests",
  args: ["run", "test:e2e", "--workspace", "@radikar/web", "--", "--reporter=line"],
};
const stages = [
  ...fastStages,
  ...(fullVerification ? [e2eStage] : []),
];

function elapsed(startedAt) {
  return `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(signal ? `exited with signal ${signal}` : `exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const verificationStartedAt = Date.now();
  console.log(`\n${green(`${fullVerification ? "FULL VERIFICATION" : "PRE-PUSH VERIFICATION"}: ${stages.length} STAGES`)}\n`);

  for (const [index, stage] of stages.entries()) {
    const stageStartedAt = Date.now();
    const remaining = stages.length - index - 1;
    console.log(`\n▶ ${green(`[${index + 1}/${stages.length}] ${stage.label}`)} — ${remaining} stages remaining`);
    console.log(`  $ npm ${stage.args.join(" ")}\n`);

    if (dryRun) continue;

    try {
      await run(npm, stage.args);
      console.log(`✓ ${green(`[${index + 1}/${stages.length}] ${stage.label}`)} completed in ${elapsed(stageStartedAt)}.`);
    } catch (error) {
      console.error(`\n✗ ${green(`[${index + 1}/${stages.length}] ${stage.label}`)} failed after ${elapsed(stageStartedAt)}.`);
      throw error;
    }
  }

  console.log(`\n✓ ${green("PRE-PUSH VERIFICATION PASSED")} in ${elapsed(verificationStartedAt)}.\n`);
}

main().catch((error) => {
  console.error(`\n${green("PRE-PUSH VERIFICATION STOPPED")}: ${error.message}`);
  process.exitCode = 1;
});
