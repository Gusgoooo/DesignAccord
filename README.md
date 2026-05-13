<p align="center">
  <img src="https://img.shields.io/npm/v/harness-design?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/harness-design?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20Copilot%20%7C%20Claude-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">HarnessDesign</h1>

<p align="center"><strong>Protocol is Design &nbsp;|&nbsp; 协议即设计</strong></p>

<p align="center">
  The AI coding pipeline that turns design protocols into governed production code.<br/>
  将设计协议转化为受治理的生产代码的 AI 编码流水线。
</p>

---

## What is HarnessDesign?

HarnessDesign is an **AI coding governance pipeline**. You define your design system as JSON protocols (spec.json), and the Harness pipeline automatically generates components, Tailwind tokens, AI coding rules, and compliance audits — ensuring every line of AI-generated code respects your design intent.

**HarnessDesign 是一条 AI 编码治理流水线。** 你用 JSON 协议（spec.json）定义设计系统，Harness 流水线自动生成组件、Tailwind Token、AI 编码规则与合规审计——确保每一行 AI 生成的代码都遵守你的设计意图。

---

## Core Features | 核心特征

| | Feature | Description |
|---|---|---|
| **1** | Protocol-Driven | spec.json 是唯一数据源。组件行为、样式约束、AI 提示词全部从协议派生 |
| **2** | One Command Pipeline | `npx harness start` — 从零到组件库 + Storybook + AI 规则，一条命令 |
| **3** | AI Governance Built-in | 自动生成 `.cursorrules` / `.cursor/rules/` / `AGENTS.md` / MCP Server |
| **4** | Token Pipeline | 10 个 seed 值 → 175+ CSS 变量 → Tailwind v4 `@theme` 映射 |
| **5** | Component = Compliance | 每个组件自带审计规则，`harness audit` 一键检测违规 |
| **6** | Govern Mode | `harness govern` — 零侵入治理模式，仅注入规则文件，适配已有项目 |

---

## Who is it for? | 面向人群

**For new product teams** — 从零构建产品，需要开箱即用的设计系统 + AI 编码约束，不想事后补规范。

**For AI-native developers** — 使用 Cursor / Copilot / Claude Code 编码，需要让 AI 输出遵守统一设计语言而非各写各的。

**For startups without a design team** — 没有专职设计师，但需要保持产品 UI 一致性，用协议代替人工 review。

---

## Quick Start

```bash
# 1. Install
npm install harness-design

# 2. Initialize + Launch
npx harness start

# 3. Done — Storybook portal opens, AI rules are configured
```

After `harness start`:
- `.harness/` — 组件库 + Storybook + Token 系统
- `.cursor/rules/` — AI 编码治理规则（自动生效）
- `AGENTS.md` — AI 编码边界契约

---

## CLI

```
harness start     一键启动（init + install + 打开 Portal）
harness init      初始化组件库
harness govern    治理模式：仅注入 AI 规则，不拷贝组件（适合已有项目）
harness dev       启动 Storybook Portal
harness sync      从 spec.json 重新生成规则 + Tailwind 配置
harness audit     合规审计
harness upgrade   升级 kit（保留你的修改）
harness mcp       启动 MCP Server（Cursor Agent 集成）
```

---

## Why not just design.md? | 为什么不用 design.md？

| | design.md | HarnessDesign |
|---|---|---|
| **Nature 本质** | Natural language doc for AI 人写给 AI 看的自然语言 | Executable JSON protocol + automation pipeline 机器可执行的 JSON 协议 + 自动化管道 |
| **Enforcement 执行力** | AI "suggests" compliance, often ignored AI "建议"遵守，经常忽略 | `harness audit` enforces and reports violations 强制检测违规 |
| **Components 组件** | Describes "you should have a Button" 描述"应该有 Button" | Provides Button source + spec + import path 直接提供源码 + 规范 + 导入路径 |
| **Maintenance 维护** | Manual updates, easily outdated 手动维护，容易过时 | `harness sync` auto-regenerates rules from spec.json 自动重新生成 |
| **Scene Routing 场景路由** | "Please use our components" (AI doesn't know which) "请用组件"（AI 不知道有哪些） | Scene → Component lookup table AI 直接查表 |
| **Validation 验证** | None 没有 | `harness audit` compliance report 出违规报告 |
| **Tokens** | "Primary color is #1677ff" "主色是 #1677ff" | Seed → 175+ CSS vars → Tailwind mapping 改 seed 全局联动 |

> **design.md tells AI "you should do this". Harness tells AI "you can only do this, and I'll check after".**
>
> **design.md 告诉 AI"你应该怎么做"，Harness 告诉 AI"你只能这么做，做完我还会检查"。**

---

## How the Pipeline Works | 流水线原理

```
spec.json (Design Protocol)
    │
    ├──► Components (23 production-ready, Radix + CVA)
    ├──► Token CSS (175+ variables, light/dark)
    ├──► Tailwind v4 @theme (utility classes)
    ├──► .cursorrules + .cursor/rules/ (AI governance)
    ├──► MCP Server (real-time AI context)
    └──► harness audit (compliance check)
```

One source. Multiple outputs. Zero drift.
一个数据源，多路输出，零漂移。

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Components | Radix UI + CVA + Tailwind CSS v4 |
| Token Engine | Ant Design algorithm → 175+ derived vars |
| Portal | Storybook 8 (React + Vite 6) |
| AI Protocol | MCP (Model Context Protocol) |
| Color Science | OKLCH via Culori |
| Type Safety | TypeScript 5 strict |

---

## License

[MIT](LICENSE) &copy; 2026 [Gusgoooo](https://github.com/Gusgoooo)

---

<p align="center"><em>Protocol is Design — 用协议定义设计，让流水线保障执行。</em></p>
