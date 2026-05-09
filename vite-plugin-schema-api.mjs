import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/** 同步落盘并 fsync，避免进程崩溃时缓冲区未刷盘 */
function writeFileWithFsync(absPath, data) {
  fs.writeFileSync(absPath, data, "utf8");
  let fd;
  try {
    fd = fs.openSync(absPath, "r+");
    fs.fsyncSync(fd);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function execSyncCaptured(cmd, opts) {
  try {
    const out = execSync(cmd, {
      cwd: opts.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      ...opts,
    });
    return { ok: true, stdout: out ?? "", stderr: "" };
  } catch (e) {
    const stderr = e.stderr != null ? String(e.stderr) : "";
    const stdout = e.stdout != null ? String(e.stdout) : "";
    return { ok: false, stdout, stderr: stderr || stdout || e.message || String(e) };
  }
}

/**
 * Portal API 写入白名单 — 只有这些目录下的文件允许被 API 写入。
 * 防止 Portal 或恶意请求写到仓库任意位置。
 */
const WRITE_WHITELIST_PREFIXES = [
  "src/harness/schema/",
  "src/design-tokens/",
];

function isWriteAllowed(repoRoot, absPath) {
  const rel = path.relative(repoRoot, absPath).split(path.sep).join("/");
  return WRITE_WHITELIST_PREFIXES.some(prefix => rel.startsWith(prefix));
}

/**
 * 开发服务器中间件：读写 src/harness/schema/components/*.spec.json，保存后执行 sync:harness。
 * 供独立 Portal 与 Storybook 共用。
 */
export function schemaApiPlugin(repoRoot) {
  const specDir = path.join(repoRoot, "src/harness/schema/components");
  const tokensPath = path.join(repoRoot, "src/design-tokens/tokens.json");

  return {
    name: "harness-schema-api",
    /** 尽量先于静态资源处理，避免 /api/* 被错误吞掉 */
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";

        if (req.method === "GET" && url === "/api/kit-status") {
          const statusPath = path.join(repoRoot, ".storybook/kit-status.json");
          try {
            const body = fs.existsSync(statusPath) ? fs.readFileSync(statusPath, "utf8") : '{"components":{}}';
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(body);
          } catch {
            res.setHeader("Content-Type", "application/json");
            res.end('{"components":{}}');
          }
          return;
        }

        if (req.method === "GET" && url === "/api/design-tokens") {
          try {
            const body = fs.readFileSync(tokensPath, "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.end("not found");
          }
          return;
        }

        if (req.method === "POST" && url === "/api/save-design-tokens") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              if (!isWriteAllowed(repoRoot, tokensPath)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: false, error: "write path not in whitelist" }));
                return;
              }
              const payload = JSON.parse(raw);
              const jsonText = payload.jsonText ?? "";
              JSON.parse(jsonText);
              const pretty = `${JSON.stringify(JSON.parse(jsonText), null, 2)}\n`;
              writeFileWithFsync(tokensPath, pretty);
              const sync = execSyncCaptured("npm run sync:tokens", { cwd: repoRoot });
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  ok: true,
                  fileWritten: true,
                  syncOk: sync.ok,
                  syncError: sync.ok ? null : sync.stderr || sync.stdout,
                }),
              );
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "GET" && url === "/api/schemas") {
          try {
            const files = fs.readdirSync(specDir).filter((f) => f.endsWith(".spec.json"));
            const list = files.map((f) => {
              const spec = JSON.parse(fs.readFileSync(path.join(specDir, f), "utf8"));
              return { filename: f, id: spec.id, componentName: spec.componentName };
            });
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(list));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        if (req.method === "GET" && url.startsWith("/api/schema/")) {
          const name = decodeURIComponent(url.replace("/api/schema/", ""));
          if (!/^[\w.-]+\.spec\.json$/.test(name)) {
            res.statusCode = 400;
            res.end("bad filename");
            return;
          }
          const file = path.join(specDir, name);
          if (!file.startsWith(specDir + path.sep)) {
            res.statusCode = 403;
            res.end("forbidden");
            return;
          }
          try {
            const body = fs.readFileSync(file, "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.end("not found");
          }
          return;
        }

        if (req.method === "POST" && url === "/api/rename-component-title") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              const payload = JSON.parse(raw);
              const importPathRaw = String(payload.importPath ?? "");
              const prevTitle = String(payload.prevTitle ?? "");
              const nextTitle = String(payload.nextTitle ?? "").trim();

              if (!importPathRaw || !prevTitle || !nextTitle || nextTitle === prevTitle) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "missing or unchanged title" }));
                return;
              }
              if (nextTitle.includes("/") || nextTitle.includes("\\")) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "title must not contain path separators" }));
                return;
              }

              const absImport = path.isAbsolute(importPathRaw)
                ? path.normalize(importPathRaw)
                : path.normalize(path.join(repoRoot, importPathRaw));
              const rel = path.relative(repoRoot, absImport);
              if (rel.startsWith("..")) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "forbidden path" }));
                return;
              }
              if (!rel.startsWith(`src${path.sep}`)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "only src/** files allowed" }));
                return;
              }
              if (!/\.(stories\.(tsx|ts|jsx|js)|mdx)$/.test(rel)) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, error: "only stories or mdx" }));
                return;
              }

              let text = fs.readFileSync(absImport, "utf8");
              const ext = path.extname(absImport);

              function escapeRe(s) {
                return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              }

              if (ext === ".mdx") {
                const re = new RegExp(
                  `(<Meta\\s+[^>]*\\btitle=)(["'])${escapeRe(prevTitle)}\\2`,
                  "m",
                );
                if (!re.test(text)) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json; charset=utf-8");
                  res.end(JSON.stringify({ ok: false, error: "mdx Meta title not found" }));
                  return;
                }
                text = text.replace(re, (_, open, q) => `${open}${q}${nextTitle}${q}`);
              } else {
                const re = new RegExp(`(\\btitle\\s*:\\s*)(["'])${escapeRe(prevTitle)}\\2`);
                if (!re.test(text)) {
                  res.statusCode = 400;
                  res.setHeader("Content-Type", "application/json; charset=utf-8");
                  res.end(JSON.stringify({ ok: false, error: "csf title not found" }));
                  return;
                }
                text = text.replace(re, (_, open, q) => `${open}${q}${nextTitle}${q}`);
              }

              fs.writeFileSync(absImport, text, "utf8");
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: false, error: String(e) }));
            }
          });
          return;
        }

        if (req.method === "POST" && url === "/api/save-schema") {
          let raw = "";
          req.on("data", (c) => {
            raw += String(c);
          });
          req.on("end", () => {
            try {
              const payload = JSON.parse(raw);
              const filename = payload.filename ?? "";
              const jsonText = payload.jsonText ?? "";
              if (!/^[\w.-]+\.spec\.json$/.test(filename)) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, fileWritten: false, error: "bad filename" }));
                return;
              }
              JSON.parse(jsonText);
              const pretty = `${JSON.stringify(JSON.parse(jsonText), null, 2)}\n`;
              const file = path.join(specDir, filename);
              if (!file.startsWith(specDir + path.sep) || !isWriteAllowed(repoRoot, file)) {
                res.statusCode = 403;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, fileWritten: false, error: "forbidden path" }));
                return;
              }

              writeFileWithFsync(file, pretty);
              const relPath = path.relative(repoRoot, file).split(path.sep).join("/");

              const harnessSync = execSyncCaptured("npm run sync:harness", { cwd: repoRoot });
              let auditResult = null;
              if (harnessSync.ok) {
                const audit = execSyncCaptured("npm run harness:audit", {
                  cwd: repoRoot,
                  timeout: 120000,
                });
                auditResult = audit.ok
                  ? { passed: true, output: audit.stdout || "" }
                  : { passed: false, output: audit.stderr || audit.stdout || "" };
              }

              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(
                JSON.stringify({
                  ok: true,
                  fileWritten: true,
                  path: relPath,
                  syncOk: harnessSync.ok,
                  syncError: harnessSync.ok ? null : harnessSync.stderr || harnessSync.stdout || null,
                  audit: auditResult,
                }),
              );
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ ok: false, fileWritten: false, error: String(e) }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
