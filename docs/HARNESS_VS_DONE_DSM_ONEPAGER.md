# 一页纸：HarnessDesign × Done DSM-ForAI（示意图）

> **用途**：对齐两套思路的差异与互补关系，便于评审、对外讲解或内部选型。**HarnessDesign** 指本仓库 **harness-design** 路线；**Done DSM-ForAI** 指「主题 / 基础组件 / 业务组件」三层向 **中央 AI MCP 服务** 汇聚的示意图产品思路。

---

## 1. 一句话

| | **Done DSM-ForAI（图）** | **HarnessDesign** |
|---|-------------------------|-------------------|
| **核心** | 在已有 DSM 上叠 **AI-ready 层**（描述、多格式、外链），**统一汇入中央 MCP 服务**，服务全公司/多系统取数。 | 在**业务仓库内**把 **Token + 组件 spec + 同步与审计** 做成**可版本化资产**，让 AI 在**当前项目**里优先、合规用组件。 |
| **MCP** | 产品形态上的 **集成终点**（「Done AI MCP 服务」）。 | **可选增强**（如 `harness mcp`），主要服务本机 **Cursor Agent**，非必须单点中枢。 |

---

## 2. 三层怎么对应

| 层 | **图中（灰=已有，绿=AI 增量）** | **HarnessDesign** |
|----|--------------------------------|-------------------|
| **主题** | 主题包配置 + **面向 AI 的描述**（JSON / Markdown 等）。 | **Design Token** 为事实来源，生成 CSS / 规则；设计师在 Portal 调参，**不强调**「主题包 + 独立 AI 描述层」双轨。 |
| **基础组件** | **Fusion** 等底座，并扩展 **Ant Design / ShadCN / Element** 多源。 | **选定一条技术栈**（如 Shadcn 系）向上封 **Business 组件**；多库并列接入**不是**当前主叙事。 |
| **业务组件** | **NPM 包 + 研发文档** + **批量外链**（GitHub、代码仓、说明文档）进 MCP。 | **`*.spec.json` + `storyHarness`（按 Story 变体）** 落盘，与 **`.cursorrules`、审计、runtime styleLock** 同源；外链模式类似 **Carbon Patterns 索引**（链到官方，不镜像正文），非「任意资产批量挂接中台」。 |

---

## 3. 粒度、数据与工程化

| 维度 | **Done DSM-ForAI** | **HarnessDesign** |
|------|--------------------|--------------------|
| **数据落点** | 平台 / 服务侧聚合，供 MCP 拉取。 | **Git 仓库内**（`.harness/`、根目录生成物），与 PR、Code Review 同轨。 |
| **规范粒度** | 资产目录 + 描述 + 链接为主。 | **Story 变体级**可维护 harness 覆盖；spec 参与 **sync、Tailwind 片段、静态审计**。 |
| **协作闭环** | 研发在平台维护 DSM → MCP 消费。 | 设计师 **Storybook 面板** 保存写盘 → 工程师 **`harness sync` / `audit`** → Cursor **读 `.cursorrules`**。 |

---

## 4. 关系定位（建议口径）

- **不是替代关系**：中央 DSM + MCP 解决 **跨团队、跨仓库的统一上下文**；Harness 解决 **单仓库内「规范 → 规则 → 代码」的工程闭环**。
- **可组合**：Harness 可作为 **业务仓库侧落地实现**；图上 **业务组件 / 文档 / 外链** 若将来接入公司 MCP，可由 MCP **引用同一 spec 或文档 URL**，与 Harness 本地落盘并行。

---

## 5. 选型提示（各一句话）

- **更贴近图中**：需要 **企业级目录、多来源批量接入、统一 AI 服务入口**。
- **更贴近 Harness**：需要 **强绑定 Git、变体级规范、生成规则 + CI 审计 + Cursor 深度集成**。

---

*文档版本：与 `PRODUCT_ARCHITECTURE.md` 中 HarnessUI 定位一致；若对方产品命名或层级调整，仅需替换表中「Done DSM-ForAI」表述即可。*
