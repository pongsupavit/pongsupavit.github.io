import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const gitbookRoot = path.join(projectRoot, "src", "content", "gitbook");
const assetsSrc = path.join(gitbookRoot, ".gitbook", "assets");
const assetsDest = path.join(projectRoot, "public", "gitbook", "assets");

const exists = async (target) => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const copyDir = async (fromDir, toDir) => {
  await fs.mkdir(toDir, { recursive: true });
  const entries = await fs.readdir(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(fromDir, entry.name);
    const destPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
};

const rewriteMarkdown = async (filePath) => {
  const original = await fs.readFile(filePath, "utf-8");
  const replaced = original.replace(
    /(?:\.\.\/)+\.gitbook\/assets\/|\.\/\.gitbook\/assets\/|\.gitbook\/assets\//g,
    "/gitbook/assets/"
  );

  if (replaced !== original) {
    await fs.writeFile(filePath, replaced, "utf-8");
  }
};

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      await rewriteMarkdown(fullPath);
    }
  }
};

const main = async () => {
  if (!(await exists(gitbookRoot))) {
    console.log("GitBook content directory not found. Skipping prepare.");
    return;
  }

  if (await exists(assetsSrc)) {
    await copyDir(assetsSrc, assetsDest);
  }

  await walk(gitbookRoot);
};

main().catch((error) => {
  console.error("prepare-gitbook failed:", error);
  process.exit(1);
});
