import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
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

if (fs.existsSync(gitbookDir)) {
  const gitDir = path.join(gitbookDir, ".git");
  if (!fs.existsSync(gitDir)) {
    console.error("gitbook directory exists but is not a git repo.");
    process.exit(1);
  }

  run("git", ["-C", gitbookDir, "pull", "--ff-only"], projectRoot);
} else {
  run("git", ["clone", repoUrl, gitbookDir], projectRoot);
}
