export function patternToString(p) {
  return typeof p.pattern === "string" ? p.pattern : String(p.pattern);
}

/** @param {any[]} specs */
export function renderCursorrules(specs) {
  const forbidden = specs.flatMap((s) => [
    ...(s.forbidden ?? []),
    ...Object.values(s.storyHarness ?? {}).flatMap((frag) =>
      frag && typeof frag === "object" ? frag.forbidden ?? [] : [],
    ),
  ]);
  const refs = [
    ...new Set(
      specs.flatMap((s) => [
        ...(s.referencePriority ?? []),
        ...Object.values(s.storyHarness ?? {}).flatMap((frag) =>
          frag && typeof frag === "object" ? frag.referencePriority ?? [] : [],
        ),
      ]),
    ),
  ];
  const corrections = specs.flatMap((s) => [
    ...(s.corrections ?? []),
    ...Object.values(s.storyHarness ?? {}).flatMap((frag) =>
      frag && typeof frag === "object" ? frag.corrections ?? [] : [],
    ),
  ]);

  const lines = [];
  lines.push(
    "# AI Component Harness — 自动生成，请勿手改（修改请编辑 schema 后运行 npm run sync:harness 或 npm run generate:rules）",
  );
  lines.push("");
  lines.push("## 核心契约（AI 必须遵守）");
  lines.push("");
  lines.push("1. **只用 Design Token**：颜色、间距、圆角等必须通过 token 语义类引用（如 `bg-primary`、`text-muted-foreground`），禁止硬编码色值或任意值 Tailwind。");
  lines.push("2. **组件优先**：页面开发必须使用 schema 声明的业务组件，禁止原生 HTML 标签替代。");
  lines.push("3. **唯一数据源**：组件行为以 `src/harness/schema/components/*.spec.json` 为准，不凭记忆推断 API。");
  lines.push("");
  lines.push("## 引用优先");
  lines.push("- **主路径**：每个组件只以该组件 `referencePriority[0]` 为默认 import；禁止在多条路径间随意切换。");
  lines.push("- 下列为全部已注册组件中出现过的路径（首条对每个 spec 为主路径，其余为备选）：");
  if (refs.length === 0) {
    lines.push("  - （未配置）");
  } else {
    refs.forEach((r) => lines.push(`  - ${r}`));
  }
  lines.push("");
  lines.push("## 禁止项（原生 HTML）");
  if (forbidden.length === 0) {
    lines.push("- （当前 schema 未声明 forbidden）");
  } else {
    forbidden.forEach((f) => {
      lines.push(`- 不要使用 <${f.htmlTag}> — ${f.reason}；请改用：${f.useInstead}`);
    });
  }
  lines.push("");
  lines.push("## 样式锁定（黑名单思维）");
  lines.push("- 禁止在业务页面为表格/按钮等叠加任意值间距类（如 `m-[13px]`、`p-[7px]`）。");
  lines.push("- 禁止通过 className 覆盖下列语义（已在 harness styleLock 声明）：");
  specs.forEach((s) => {
    lines.push(`### ${s.componentName} (${s.id})`);
    (s.styleLock?.blacklist ?? []).forEach((b) => {
      lines.push(`- ${b.description} — pattern: \`${patternToString(b)}\``);
    });
    const sh = s.storyHarness && typeof s.storyHarness === "object" ? s.storyHarness : null;
    if (sh) {
      for (const [sid, frag] of Object.entries(sh)) {
        const bl = frag?.styleLock?.blacklist ?? [];
        if (bl.length === 0) continue;
        lines.push(`  - **变体 \`${sid}\` 附加黑名单**：`);
        for (const b of bl) {
          lines.push(`    - ${b.description} — pattern: \`${patternToString(b)}\``);
        }
      }
    }
  });
  lines.push("");
  lines.push("## 组件意图与 AI 指令");
  specs.forEach((s) => {
    lines.push(`### ${s.componentName}`);
    lines.push(`- **Intent**: ${s.intent}`);
    lines.push(`- **AI**: ${s.aiPrompt}`);
    const ex = s.examples ?? [];
    if (ex.length > 0) {
      lines.push("- **Few-shot 示例**（优先模仿结构与 import）：");
      for (const item of ex) {
        lines.push(`  - **${item.title}**${item.description ? ` — ${item.description}` : ""}`);
        const sn = String(item.snippet ?? "").trim();
        if (sn) {
          lines.push("  ```tsx");
          lines.push(sn.split("\n").map((ln) => `  ${ln}`).join("\n"));
          lines.push("  ```");
        }
      }
    }
    const sh = s.storyHarness && typeof s.storyHarness === "object" ? s.storyHarness : null;
    if (sh && Object.keys(sh).length > 0) {
      lines.push("- **Storybook 变体覆盖**（与侧栏具体 Story 对应）：");
      for (const [sid, frag] of Object.entries(sh)) {
        if (!frag || typeof frag !== "object") continue;
        lines.push(`  - **\`${sid}\`**`);
        if (frag.intent) lines.push(`    - Intent: ${frag.intent}`);
        if (frag.aiPrompt) lines.push(`    - AI: ${frag.aiPrompt}`);
        const vex = frag.examples ?? [];
        if (vex.length > 0) {
          for (const item of vex) {
            lines.push(`    - 示例 **${item.title}**${item.description ? ` — ${item.description}` : ""}`);
            const sn = String(item.snippet ?? "").trim();
            if (sn) {
              lines.push("      ```tsx");
              lines.push(sn.split("\n").map((ln) => `      ${ln}`).join("\n"));
              lines.push("      ```");
            }
          }
        }
      }
    }
  });
  lines.push("");
  lines.push("## 纠错指令");
  if (corrections.length === 0) {
    lines.push("- （无）");
  } else {
    corrections.forEach((c) => {
      lines.push(`- **${c.id}**: 若 ${c.violation} → ${c.fixPrompt}`);
    });
  }
  lines.push("");
  return lines.join("\n");
}

/** Markdown 镜像（供 Code Review / 非 Cursor 工具阅读） */
/** @param {any[]} specs */
export function renderHarnessMarkdown(specs) {
  return `# Harness 规则镜像\n\n与根目录 \`.cursorrules\` 内容一致（由 \`npm run sync:harness\` 生成）；请勿手改。\n\n${renderCursorrules(specs)}`;
}
