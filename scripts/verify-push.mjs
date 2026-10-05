import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const dryRun = process.argv.includes("--dry-run");
const stages = [
  { label: "راه‌اندازی PostgreSQL", args: ["run", "infra:up"] },
  { label: "بررسی TypeScript وب", args: ["run", "typecheck", "--workspace", "@radikar/web"] },
  { label: "بررسی TypeScript API", args: ["run", "typecheck", "--workspace", "@radikar/api"] },
  { label: "Lint وب", args: ["run", "lint", "--workspace", "@radikar/web"] },
  {
    label: "تست‌های واحد وب",
    args: ["run", "test:unit", "--workspace", "@radikar/web", "--", "--reporter=verbose"],
  },
  { label: "تست‌های ساختاری وب", args: ["run", "test:rendered", "--workspace", "@radikar/web"] },
  { label: "تست‌های API", args: ["test", "--workspace", "@radikar/api"] },
  {
    label: "تست‌های E2E",
    args: ["run", "test:e2e", "--workspace", "@radikar/web", "--", "--reporter=line"],
  },
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
      else reject(new Error(signal ? `با سیگنال ${signal}` : `با کد ${code ?? "نامشخص"}`));
    });
  });
}

async function main() {
  const verificationStartedAt = Date.now();
  console.log(`\n🔎 بررسی پیش از push: ${stages.length} مرحله\n`);

  for (const [index, stage] of stages.entries()) {
    const stageStartedAt = Date.now();
    const remaining = stages.length - index - 1;
    console.log(`\n▶ [${index + 1}/${stages.length}] ${stage.label} — ${remaining} مرحله باقی‌مانده`);
    console.log(`  $ npm ${stage.args.join(" ")}\n`);

    if (dryRun) continue;

    try {
      await run(npm, stage.args);
      console.log(`✓ [${index + 1}/${stages.length}] ${stage.label} در ${elapsed(stageStartedAt)} تمام شد.`);
    } catch (error) {
      console.error(`\n✗ [${index + 1}/${stages.length}] ${stage.label} پس از ${elapsed(stageStartedAt)} ناموفق بود.`);
      throw error;
    }
  }

  console.log(`\n✓ همهٔ بررسی‌های pre-push در ${elapsed(verificationStartedAt)} موفق بودند.\n`);
}

main().catch((error) => {
  console.error(`\nاعتبارسنجی pre-push متوقف شد: ${error.message}`);
  process.exitCode = 1;
});
