import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";

const knowledgeBasePath = "PROJECT_KNOWLEDGE.md";

const ignoredPaths = [
  ".githooks/",
  ".next/",
  ".turbo/",
  "graphify-out/",
  "node_modules/",
  "scripts/check-knowledge-base.mjs",
];

const watchedRootFiles = new Set([
  "AGENTS.md",
  "README.md",
  "compose.production.yml",
  "docker-compose.yml",
  "package.json",
  "package-lock.json",
  "turbo.json",
]);

const watchedPrefixes = ["apps/", "packages/", "deploy/"];

const stagedFiles = execFileSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  { encoding: "utf8" },
)
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

const hasKnowledgeBaseUpdate = stagedFiles.includes(knowledgeBasePath);
const requiresKnowledgeBaseUpdate = stagedFiles.some(
  (file) =>
    !ignoredPaths.some((ignoredPath) => file.startsWith(ignoredPath)) &&
    (watchedRootFiles.has(file) || watchedPrefixes.some((prefix) => file.startsWith(prefix))),
);

const commitMessagePath = process.argv[2];
const commitMessage = commitMessagePath
  ? readFileSync(commitMessagePath, "utf8")
  : "";
const hasNotApplicableReview = /^Knowledge-Base:\s*n\/a\s*[-–—:]\s*\S+/im.test(
  commitMessage,
);

if (requiresKnowledgeBaseUpdate && !hasKnowledgeBaseUpdate && !hasNotApplicableReview) {
  appendFileSync(
    knowledgeBasePath,
    `\n> Automated review: ${new Date().toISOString().slice(0, 10)} — project changes were committed; review the affected sections if behavior or architecture changed.\n`,
  );
  execFileSync("git", ["add", knowledgeBasePath]);
  console.info(`Knowledge-base updated and staged automatically: ${knowledgeBasePath}`);
}
