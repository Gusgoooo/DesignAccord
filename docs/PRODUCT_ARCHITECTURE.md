# HarnessUI 产品架构与链路说明

本文档从整体视角说明 **HarnessUI（harness-design）** 的产品流程、数据与治理链路，以及背后的技术思路，便于团队对齐与对外介绍。

---

## 1. 产品定位

**一句话**：在本地把「设计令牌 + 组件规范 + 业务级 Headless 封装」做成可版本化的资产，并通过 **生成规则 + 审计 + Cursor 集成**，让 AI 写业务代码时优先、且尽量合规地使用这套组件库。

**主要角色**

| 角色 | 典型诉求 | 产品提供的入口 |
|------|----------|----------------|
| 设计师 | 调主题、看组件、查阅 Carbon Patterns 索引、维护「组件意图 / AI 语义 / 样式锁定」 | Storybook Portal（DesignToken、Patterns、组件预览 + Harness 面板） |
| 前端 / 工程 | 在业务仓库引用 Business 组件、CI 可审计 | `npm` 依赖、`harness sync` / `harness audit`、`.cursorrules` |
| AI（Cursor Agent） | 知道该用谁、不该写什么 | `.cursor/rules/*.mdc`、MCP 工具、运行时 `styleLock` 剥离 |

---

## 2. 核心流程（端到端）

### 2.1 在项目里落地 Harness（消费者视角）

1. 在**业务项目根目录**执行 `harness start`（或 `harness init` + `npm install` + `harness dev`）。
2. 工具会在项目根创建：
   - **`.harness/`**（隐藏目录）：内含完整「组件库子工程」——Storybook、Shadcn 系 starter、Business 封装、`src/harness/schema`、`scripts`、生成的 Tailwind 片段等。
   - **`.cursor/`**：`rules`（Always Apply 约束）、`mcp.json`（Harness MCP）、可选 `hooks`（保存后审计）。
3. 设计师在浏览器中打开 Portal（由 `harness dev` 启动 Storybook），编辑 DesignToken、在 **Harness** 面板中编辑与当前 Story 关联的 `*.spec.json` 并保存。
4. 保存触发 **sync**：更新 `.cursorrules`、Tailwind 生成物、规则镜像等；可选触发 **audit** 结果回显。
5. 工程师在**项目自有 `src/`** 中写业务；AI 在 Cursor 中受规则与 MCP 约束；业务侧推荐配置 **`@design`** 指向 `.harness` 的 barrel（见项目根 **`HARNESS_INTEGRATION.md`**），详见 **`HARNESS_BOUNDARIES.md`**。

**目录约定（刻意设计）**

- **`.harness/`**：仅组件库与设计资产，**不是**业务应用根目录。
- **`.cursor/`**：仅编辑器与 Agent 侧治理配置（点文件风格，不污染业务源码树命名习惯）。
- **业务代码**：仍放在项目原有的应用 `src/`（或其它约定目录），避免「所有新文件都进组件库」的误用；`harness init` 会在项目根生成 **`HARNESS_BOUNDARIES.md`** 与 **`HARNESS_INTEGRATION.md`** 一页说明。

### 2.2 规范驱动治理（Schema → 规则 → 代码）

1. **单一事实来源**：`ComponentSpec` 以 JSON 形式存放在 `.harness/src/harness/schema/components/*.spec.json`。
2. **人可读 + 机器可读**：同一份 spec 参与：
   - Storybook Harness 表单编辑；
   - `scripts/sync-from-schema.mjs` 聚合生成根目录 **`.cursorrules`**、`tailwind.harness.generated.ts`、`src/harness/rules/HARNESS_RULES.md`；
   - `scripts/harness-audit.mjs` 读取 forbidden 标签等做 AST 级扫描。
3. **运行时兜底**：Business 组件通过 `tailwind-merge` + `stripLockedClasses`（`styleLock.blacklist`）削弱 AI/业务侧通过 `className` 覆盖关键样式的能力。

### 2.3 模式参考（文档型索引 — IBM Carbon）

为降低「只有原子组件、缺少组合流程参考」的缺口，本仓库提供 **IBM Carbon Design System — Universal Patterns** 的**官方深链索引**（不镜像正文，避免版权与同步成本）：

- 说明与更新方式：`docs/patterns/README.md`
- 可读表格：`docs/patterns/carbon-design-system.md`
- 机读清单：`src/harness/patterns/carbon-universal-patterns.json`
- Cursor 可选规则：`.cursor/rules/harness-carbon-pattern-index.mdc`（`alwaysApply: false`，按需纳入对话）

**与组件 spec 的分工**：`*.spec.json` 仍是 Harness **Business 组件**的唯一事实来源；Carbon Patterns 作为业界**组合与流程**对照，实现时仍使用本仓库业务组件与生成规则。

---

## 3. 链路图（数据与控制流）

```
┌─────────────────────────────────────────────────────────────────────────┐
│  设计师 / 工程师（本地）                                                    │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     HTTP API      ┌──────────────────────────┐
│ Storybook       │ ───────────────►  │ vite-plugin-schema-api   │
│ Manager UI      │   /api/schemas    │（Vite middleware）        │
│ Harness 面板    │   save-schema…    │ 读写磁盘 + exec sync     │
└─────────────────┘                   └──────────────────────────┘
         │                                        │
         │ 预览 / Controls                         │ npm run sync:harness
         ▼                                        ▼
┌─────────────────┐                   ┌──────────────────────────┐
│ Storybook       │                   │ .harness/.cursorrules     │
│ Preview (iframe)│                   │ tailwind.harness.*        │
└─────────────────┘                   │ HARNESS_RULES.md          │
         │                             └──────────────────────────┘
         │                                        │
         │                                        │ Cursor 读取
         ▼                                        ▼
┌─────────────────┐                   ┌──────────────────────────┐
│ 组件 TSX        │ ◄── import ──────  │ Cursor Agent + MCP      │
│ starter/        │                   │ list/read/update schema │
│ business/       │                   │ audit / sync_rules / …    │
└─────────────────┘                   └──────────────────────────┘
         │
         │ PR / 本地提交
         ▼
┌─────────────────┐
│ harness audit   │──► 禁止原生标签、任意值 Tailwind（可配置排除路径）
└─────────────────┘
```

**CLI 与 MCP 双通道**

- **CLI**（`bin/harness.mjs`）：`init`、`start`、`dev`、`sync`、`audit`、`mcp` —— 适合脚本、CI、本地一键。
- **MCP**（`bin/harness-mcp.mjs`）：stdio JSON-RPC，把同一套能力暴露给 Cursor Agent，路径参数指向 **`.harness` 根**（默认）。

---

## 4. 背后的技术思路

### 4.1 为什么用 Storybook 做 Portal 壳

- **成熟能力**：iframe 预览、MDX/CSF、Controls、热更新，减少自研「组件展台」成本。
- **产品化取舍**：管理端 UI 大量定制（侧栏、主题、Harness 面板），但**不**把独立 `design-portal` 打进消费者 `init` 脚手架，避免「再塞一套 Schema 产品」的观感；Schema 主路径为 **Harness 面板 + IDE/MCP**。

### 4.2 为什么规范是 JSON + TypeScript 类型双轨

- **JSON**：可被 Portal/API/MCP 直接读写、diff 友好、设计师可参与字段含义（配合 UI）。
- **types.ts**：`ComponentSpec` 等类型保证脚本与运行时合并逻辑一致，避免「文档与实现漂移」。

### 4.3 为什么要有 Business 层

- Starter（shadcn）偏 **通用原子**；业务要的是 **语义 props**（如 `density`）+ **禁止随意改 spacing/品牌色**。
- **同一套 schema** 既生成 `.cursorrules` 文案，又驱动 **运行时** `mergeWithBusinessSpec` / `createBusinessComponent`，形成「文档约束 + 代码兜底」双层。

### 4.4 为什么默认用隐藏目录 `.harness`

- 组件库必须是**独立 npm 子树**（自有 `package.json`、`node_modules`、Storybook），无法「纯点文件」实现。
- 用 **`.harness/`** 与 **`.cursor/`** 并列，满足「尽量以点目录影响项目、不显式 `harness-ui` 文件夹」的产品诉求，同时保持工程可实现性。

### 4.5 审计与规则的关系

- **`.cursorrules`**：偏「协作契约」，依赖模型遵守，覆盖广（含 styleLock 文字说明）。
- **`harness-audit`**：可执行、可 CI，当前实现聚焦 **forbidden 原生标签** + **className 字符串中的任意值 Tailwind**；与 styleLock 正则并非一一对应，属于已知边界，可后续增强。

### 4.6 Cursor 集成三层

1. **`.cursor/rules/*.mdc`**：`alwaysApply` 的约束与自检清单。
2. **`mcp.json`**：Agent 可调用的工具（读改 spec、token、跑 audit 等）。
3. **Hooks（可选）**：`afterFileEdit` 后对相关 `.tsx` 跑 audit，把失败信息注入对话，缩短反馈环。

---

## 5. 关键模块索引（仓库内）

| 模块 | 路径 | 职责 |
|------|------|------|
| CLI | `bin/harness.mjs` | init/start/dev/sync/audit/mcp 编排 |
| MCP | `bin/harness-mcp.mjs` | Cursor 侧工具集 |
| Storybook 管理端 | `.storybook/manager.tsx` | 主题、侧栏、DesignToken 入口、Harness 面板 |
| Storybook 预览 | `.storybook/preview.tsx` | 全局样式与参数 |
| Vite 插件 | `vite-plugin-schema-api.mjs` | Schema / Token HTTP API |
| 规范类型 | `src/harness/schema/types.ts` | `ComponentSpec` 等 |
| 规范 JSON | `src/harness/schema/components/*.spec.json` | 各组件事实来源 |
| 同步脚本 | `scripts/sync-from-schema.mjs` | 生成 `.cursorrules`、Tailwind 片段、规则 MD |
| 审计 | `scripts/harness-audit.mjs` | AST 扫描 |
| Business 封装 | `src/components/business/*`、`business-wrapper.tsx`、`business-style.ts` | styleLock 合并 |
| Design Token | `src/design-tokens/*` | tokens.json + 编辑器页 |

---

## 6. 扩展与演进建议

- **新组件**：增加 `*.spec.json` → registry → Business 封装 → stories；`sync:harness`。
- **更强合规**：审计对齐 `styleLock.blacklist`、结构化 audit JSON、CI 模板。
- **可选独立门户**：仅在 Harness **产品仓库**保留 `src/design-portal`，不进入消费者 `init`。

---

## 7. 已知边界（诚实说明）

- AI **不会**对每条请求数学上「100% 遵守」规则；需 **规则 + 运行时剥离 + 审计 + CI** 组合。
- 组件库物理上必须占用 **`.harness/`** 目录；无法仅靠无源码的点文件完成 Storybook/npm 生态。
- MCP/规则中的路径需与真实 **`.harness` 位置**一致，避免读到错误的 `.cursorrules`。

---

*文档版本：与当前仓库实现一致；若命令或默认路径变更，请以 `harness help` 与 `bin/harness.mjs` 为准。*
