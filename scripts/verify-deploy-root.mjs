import { existsSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";

const logPath = join(process.cwd(), "debug-8ac4d6.log");
const root = process.cwd();
const pkgPath = join(root, "package.json");
const pkgExists = existsSync(pkgPath);
const gitignorePath = join(root, ".gitignore");
const gitignoreIgnoresPkg =
  existsSync(gitignorePath) &&
  /^\s*package\.json\s*$/m.test(readFileSync(gitignorePath, "utf8"));

const entry = {
  sessionId: "8ac4d6",
  runId: process.env.VERCEL ? "vercel-build" : "local",
  hypothesisId: "H1-H3",
  location: "scripts/verify-deploy-root.mjs",
  message: "deploy root package.json check",
  data: {
    cwd: root,
    packageJsonExists: pkgExists,
    gitignoreIgnoresPackageJson: gitignoreIgnoresPkg,
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  },
  timestamp: Date.now(),
};

// #region agent log
try {
  appendFileSync(logPath, `${JSON.stringify(entry)}\n`);
} catch {
  /* ignore if log path unavailable on Vercel */
}
fetch("http://127.0.0.1:7527/ingest/e2cd7ede-65b4-4d4d-b6de-01a216248656", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "8ac4d6",
  },
  body: JSON.stringify(entry),
}).catch(() => {});
// #endregion

console.log(`[verify-deploy-root] ${JSON.stringify(entry.data)}`);

if (!pkgExists) {
  console.error(
    `[verify-deploy-root] ENOENT: package.json missing at ${pkgPath}`,
  );
  process.exit(1);
}

console.log(`[verify-deploy-root] OK: package.json found at ${pkgPath}`);
