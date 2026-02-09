import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const gitbookDir = path.join(projectRoot, "src", "content", "gitbook");
const repoUrl =
  process.env.GITBOOK_REPO || "https://github.com/pongsupavit/gitbook.git";

const run = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const read = (cmd, args, cwd) => {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return (result.stdout || "").trim();
};

if (fs.existsSync(gitbookDir)) {
  const gitDir = path.join(gitbookDir, ".git");
  if (!fs.existsSync(gitDir)) {
    console.error("gitbook directory exists but is not a git repo.");
    process.exit(1);
  }

  const status = read("git", ["-C", gitbookDir, "status", "--porcelain"], projectRoot);
  if (status) {
    run(
      "git",
      ["-C", gitbookDir, "stash", "push", "-u", "-m", "auto-stash before update"],
      projectRoot
    );
  }

  run("git", ["-C", gitbookDir, "pull", "--ff-only"], projectRoot);
} else {
  run("git", ["clone", repoUrl, gitbookDir], projectRoot);
}
