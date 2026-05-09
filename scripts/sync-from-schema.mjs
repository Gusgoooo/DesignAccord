#!/usr/bin/env node
/**
 * Schema → Tailwind 扩展 + safelist → .cursorrules + src/harness/rules 镜像
 * 运行：npm run sync:harness
 */
import fs from "node:fs";
import path from "node:path";
import { loadSpecs, getRepoRoot } from "./lib/load-specs.mjs";
import { renderCursorrules, renderHarnessMarkdown } from "./lib/render-harness-rules.mjs";

const root = getRepoRoot();

/** 从 specs 收集需在 JIT 中保留的 class token（JSON enumMap / baseline） */
function consumeSpecLikeForSafelist(specLike, set) {
  if (!specLike || typeof specLike !== "object") return;
  for (const t of specLike.styleLock?.baselineTokens ?? []) {
    for (const part of String(t).split(/\s+/)) if (part) set.add(part);
  }
  const props = [...(specLike.requiredProps ?? []), ...(specLike.optionalProps ?? [])];
  for (const p of props) {
    const em = p.enumMap;
    if (!em) continue;
    for (const classes of Object.values(em)) {
      if (!Array.isArray(classes)) continue;
      for (const chunk of classes) {
        for (const part of String(chunk).split(/\s+/)) if (part) set.add(part);
      }
    }
  }
}

function collectSafelistTokens(specs) {
  const set = new Set();
  for (const s of specs) {
    consumeSpecLikeForSafelist(s, set);
    for (const frag of Object.values(s.storyHarness ?? {})) {
      consumeSpecLikeForSafelist(frag, set);
    }
  }
  return [...set].sort();
}

function buildTailwindExtend(specs) {
  const spacing = {};
  const colors = {};
  const borderRadius = {};
  function mergeTe(te) {
    if (!te) return;
    Object.assign(spacing, te.spacing ?? {});
    Object.assign(colors, te.colors ?? {});
    Object.assign(borderRadius, te.borderRadius ?? {});
  }
  for (const s of specs) {
    mergeTe(s.tailwindExtend);
    for (const frag of Object.values(s.storyHarness ?? {})) {
      mergeTe(frag?.tailwindExtend);
    }
  }
  return { spacing, colors, borderRadius };
}

function writeTailwindHarnessGenerated(specs) {
  const extend = buildTailwindExtend(specs);
  const safelist = collectSafelistTokens(specs);
  const outPath = path.join(root, "tailwind.harness.generated.ts");
  const body = `/* eslint-disable */
// AUTO-GENERATED — 运行 npm run sync:harness 重新生成；请勿手改。
export const harnessTailwindExtend = ${JSON.stringify(extend, null, 2)} as const;

/** 来自 schema enumMap / baselineTokens，供 Tailwind JIT 拣选 */
export const harnessSafelist: string[] = ${JSON.stringify(safelist, null, 2)};
`;
  fs.writeFileSync(outPath, body, "utf8");
  console.log(`Wrote ${path.relative(root, outPath)}`);
}

function writeHarnessRulesMirror(specs) {
  const dir = path.join(root, "src/harness/rules");
  fs.mkdirSync(dir, { recursive: true });
  const md = renderHarnessMarkdown(specs);
  const mdPath = path.join(dir, "HARNESS_RULES.md");
  fs.writeFileSync(mdPath, md, "utf8");
  console.log(`Wrote ${path.relative(root, mdPath)}`);
}

function writeCursorrules(specs) {
  const outFile = path.join(root, ".cursorrules");
  fs.writeFileSync(outFile, renderCursorrules(specs), "utf8");
  console.log(`Wrote ${path.relative(root, outFile)}`);
}

function writeAgentsMd() {
  const agentsPath = path.join(root, "AGENTS.md");
  if (fs.existsSync(agentsPath)) return;
  const content = `# AGENTS.md — AI 编码边界与契约

## 目录约定

1. **UI / 组件 / token 真源** → \`src/components/\` 与 \`src/design-tokens/\`
2. **Portal / sync / kit 集成** → 根层 CLI、scripts、.storybook
3. **上游 npm 包** → \`node_modules/harness-design/\` **只读**，通过 \`harness upgrade\` 同步

## AI 编码契约

- **Import**：优先 \`@design\` 别名；禁止从 \`node_modules\` 深路径引用 kit 组件。
- **颜色**：仅 Design Token 语义类，禁止硬编码色值。
- **间距**：禁止任意值 Tailwind（\`m-[13px]\`），使用 schema 语义 props。
- **组件规范**：\`src/harness/schema/components/*.spec.json\` 为唯一数据源。
- **修改后**：运行 \`npm run sync:harness\` 同步 .cursorrules。
`;
  fs.writeFileSync(agentsPath, content, "utf8");
  console.log(`Wrote AGENTS.md`);
}

const specs = loadSpecs();
writeTailwindHarnessGenerated(specs);
writeHarnessRulesMirror(specs);
writeCursorrules(specs);
writeAgentsMd();

console.log(`sync:harness 完成（${specs.length} specs）`);
