# Harness 目录边界（必读）

在已接入 Harness 的业务仓库中，请严格遵守以下分工，避免业务代码与组件库混写、避免 AI 把页面写进错误目录。

## 1. 业务应用代码

- **位置**：项目根下**自有的**应用目录，常见为 `src/`（或你们团队约定的 `app/`、`packages/web/src` 等）。
- **内容**：路由、页面、feature、接口调用、业务状态、布局组合。
- **禁止**：不要把「真实上线的业务页面」写进 `.harness/`。

## 2. 组件库与设计资产（`.harness/`）

- **位置**：项目根下的隐藏目录 **`.harness/`**（由 `harness init` / `harness start` 生成）。
- **内容**：Starter/Business 组件源码、Stories、Design Token、`src/harness/schema/*.spec.json`、Storybook 配置、同步脚本等。
- **定位**：本地 **设计工作台 + 可版本化的组件库子工程**，不是业务应用根目录。

## 3. Cursor 与 AI 治理（`.cursor/`）

- **位置**：项目根 **`.cursor/`**（rules、mcp、可选 hooks）。
- **内容**：`harness.mdc` 等规则、MCP 指向 `.harness` 的路径。
- **注意**：与业务源码分离；提交策略由团队自行约定（通常与 `.harness` 一并提交或部分忽略生成物）。

## 4. 引用关系（推荐）

- 业务代码中引用 UI：**优先**使用路径别名 **`@design`** 指向 `.harness` 的 barrel（见 `HARNESS_INTEGRATION.md`），或等价相对路径。
- 业务代码**不要**从 `.harness` 内部路径随意 deep import 未导出的实现文件，除非团队明确允许。

## 5. Monorepo 场景

若项目为 monorepo（pnpm workspace / npm workspaces 等），推荐结构：

| 区域 | 路径 | 职责 |
|------|------|------|
| **业务组件真源** | `packages/business-ui/` | 组件、变体、Token、manifest —— 唯一 UI 真源 |
| **Harness 集成** | `.harness/`（或 `apps/harness/`） | Portal 适配、Storybook、sync 脚本 |
| **业务应用** | `apps/web/` 等 | `workspace:*` 依赖 `@acme/business-ui` |

关键约束：
- `packages/business-ui` **禁止**依赖 `.harness`（单向依赖：harness/apps → business-ui）。
- 所有应用 `import { Button } from '@acme/business-ui'`，不要在 `apps/web/src/` 中复制组件实现。
- 上游 npm kit 通过 `harness upgrade` 同步到 `packages/business-ui`。

## 6. 一句话记忆

| 目录 | 谁动 | 写什么 |
|------|------|--------|
| 项目 `src/`（等） | 业务 / 功能开发 | 页面与业务逻辑 |
| `.harness/` | 设计系统 / 组件维护 | 组件、Token、Spec、Storybook |
| `.cursor/` | 工程 / AI 配置 | 规则与 MCP |
| `packages/business-ui/` | 组件真源（monorepo） | 组件 + Token + manifest |

---

*由 Harness `init` 同步到项目根 `HARNESS_BOUNDARIES.md`；修改请以本仓库 `docs/BOUNDARIES.md` 为准再发版。*
