import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const repositoryRoot = process.cwd();
const gitDirectory = join(repositoryRoot, ".git");
const huskyBinary = join(repositoryRoot, "node_modules", ".bin", "husky");

// Production images do not include Git metadata or dev dependencies. Git hooks are
// only useful in a local checkout, so their setup must never block `npm ci --omit=dev`.
if (process.env.HUSKY === "0" || !existsSync(gitDirectory) || !existsSync(huskyBinary)) {
  process.exit(0);
}

const result = spawnSync(huskyBinary, { stdio: "inherit" });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
