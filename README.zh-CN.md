<p align="center">
  <img src="https://img.shields.io/npm/v/harness-design?style=flat-square&color=0969da" alt="npm version" />
  <img src="https://img.shields.io/npm/l/harness-design?style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/tailwindcss-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/storybook-8-FF4785?style=flat-square&logo=storybook&logoColor=white" alt="Storybook 8" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/AI--first-Cursor%20%7C%20GPT%20%7C%20Claude-blueviolet?style=flat-square" alt="AI-first" />
</p>

<h1 align="center">HarnessUI &nbsp;<a href="./README.md"><img src="https://img.shields.io/badge/lang-English-blue?style=flat-square" alt="English" /></a></h1>

<p align="center">
  <strong>AI 优先的组件设计套件 —— 将设计令牌转化为生产就绪、AI 可治理的 UI 组件库。</strong>
</p>

<p align="center">
  设计令牌 &rarr; Tailwind v4 <code>@theme</code> &rarr; 23 个无障碍组件 &rarr; Storybook 可视化门户 &rarr; AI 编码规则 —— <em>一条管线，零漂移。</em>
</p>

---

## 为什么选择 HarnessUI？

现代 AI 编码工具（Cursor、Copilot、GPT）生成 UI 代码很快——但它们**不了解你的设计系统**。它们会凭空编造颜色值、随意使用间距、忽视组件 API。HarnessUI 通过将设计真源直接嵌入 AI 上下文来解决这些问题：

| 问题 | HarnessUI 方案 |
|------|---------------|
| AI 使用硬编码 `#1677ff` 而非令牌 | **Seed &rarr; Map 令牌管线**自动生成 ~175 个 CSS 变量 + Tailwind 映射 |
| AI 随意写出 `p-[13px]` 等魔法数字 | **组件规范**（`.spec.json`）定义允许的属性、样式锁、禁止模式 |
| 令牌变更无法传播到代码 | **单一真源**：`tokens.json` &rarr; `@theme` + `:root` + `.dark` 合为一份生成文件 |
| 无法审计 AI 生成的代码 | **`harness audit`** CLI 逐项检查组件是否符合规范 |
| 设计系统规则过期失效 | **`harness sync`** 从规范重新生成 `.cursorrules` —— 始终与真源同步 |

## 核心特性

- **Seed &rarr; Map 令牌引擎** —— 只需定义 10 个种子值，自动派生 175+ 令牌（颜色、间距、圆角、阴影、排版、动效、透明度），基于 Ant Design 算法
- **Tailwind CSS v4 原生支持** —— 所有令牌通过 `@theme inline` 映射，直接使用原生工具类（`bg-primary`、`p-sm`、`rounded-lg`、`font-medium`、`duration-fast`）
- **23 个无障碍组件** —— 基于 Radix UI 原语构建，全面集成令牌、暗色模式和键盘导航
- **Storybook 8 门户** —— 交互式设计令牌编辑器，内置 OKLCH 色彩拾取器、实时组件预览和控制面板
- **组件规范系统** —— JSON Schema 定义每个组件的属性、意图、样式锁、AI 提示词和禁止模式
- **Harness CLI** —— `init`、`start`、`dev`、`sync`、`audit`、`upgrade`、`mcp` —— 全生命周期管理
- **MCP 服务** —— Model Context Protocol 集成，为 Cursor Agent 直接提供规范与令牌数据
- **暗色模式** —— 从种子令牌自动派生明/暗色配方，使用 CSS 自定义变体 `&:is(.dark *)`
- **升级安全** —— npm 更新时自动添加新组件，不覆盖你的自定义修改（基于内容哈希比对）

## 架构总览

```
tokens.json（种子层）
    │
    ▼
emit-design-tokens-css.mjs ──► design-tokens.generated.css
    │                              ├── @theme inline { ... }    ← Tailwind 工具类
    │                              ├── :root { ... }            ← CSS 变量
    │                              └── .dark { ... }            ← 暗色覆盖
    ▼
*.spec.json（23 个组件规范）
    │
    ├──► sync-from-schema ──► .cursorrules（AI 编码规则）
    ├──► harness-audit ──► 合规报告
    └──► Storybook Portal ──► 可视化编辑 + 控件
```

### 令牌流转：一跳到位，零漂移

```
tokens.json ──(sync:tokens)──► design-tokens.generated.css ──► Tailwind v4 + 组件
     │                                                              │
     └── 单文件，三段式：                                             │
         @theme（Tailwind 映射）                                     │
         :root （非 Tailwind 变量）                                  │
         .dark （暗色覆盖）                                          │
                                                                    ▼
                                                          AI 读取 .cursorrules
                                                         （从规范自动生成）
```

## 快速开始

### 安装

```bash
npm install harness-design
```

### 在项目中初始化

```bash
npx harness start
```

执行后将：
1. 创建 `.harness/` 目录，包含所有组件、令牌和规范
2. 配置 `.cursor/` AI 编码治理规则
3. 安装依赖
4. 启动 Storybook 门户，访问 `http://localhost:6006`

### 日常开发

```bash
npx harness dev          # 启动 Storybook 门户
npx harness sync         # 从规范重新生成规则
npx harness audit        # 检查组件合规性
npx harness upgrade      # 拉取最新组件包（保留你的修改）
npx harness mcp          # 启动 MCP 服务，供 Cursor Agent 使用
```

### 使用组件

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from "@design/components/starter";

export function MyFeature() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>仪表盘</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" size="default">
          开始使用
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 组件列表

HarnessUI 内置 23 个生产就绪的组件，每个组件均配有 `.spec.json` 规范、Storybook 故事和完整的令牌集成：

| 组件 | 核心特性 | 规范文件 |
|------|---------|---------|
| **Alert 提示** | 4 种变体（默认/错误/成功/警告），图标支持 | `alert.spec.json` |
| **Avatar 头像** | 图片 + 回退显示，可配置尺寸 | `avatar.spec.json` |
| **Badge 徽标** | 5 种变体，语义化颜色 | `badge.spec.json` |
| **Button 按钮** | 6 种变体，4 种尺寸，`asChild` 组合模式 | `button.spec.json` |
| **Card 卡片** | Header/Content/Footer 组合结构 | `card.spec.json` |
| **Checkbox 复选框** | Radix 原语，无障碍 | `checkbox.spec.json` |
| **Data Table 数据表格** | 排序、筛选、分页、密度模式 | `data-table.spec.json` |
| **Dialog 对话框** | 模态层 + 遮罩，键盘关闭 | `dialog.spec.json` |
| **Dropdown Menu 下拉菜单** | 嵌套菜单，键盘导航 | `dropdown-menu.spec.json` |
| **Input 输入框** | 多类型，禁用/错误状态 | `input.spec.json` |
| **Label 标签** | 关联禁用样式，语义配对 | `label.spec.json` |
| **Popover 弹出层** | 浮动内容 + 箭头 | `popover.spec.json` |
| **Progress 进度条** | 动画值条，令牌驱动的动效时长 | `progress.spec.json` |
| **Radio Group 单选组** | Radix 分组，无障碍 | `radio-group.spec.json` |
| **Scroll Area 滚动区域** | 自定义滚动条主题 | `scroll-area.spec.json` |
| **Select 选择器** | 原生选择器 + 令牌样式 | `select.spec.json` |
| **Separator 分隔线** | 水平/垂直 + 语义间距 | `separator.spec.json` |
| **Skeleton 骨架屏** | 加载占位 + 动画 | `skeleton.spec.json` |
| **Slider 滑块** | 范围输入，轨道/滑块主题化 | `slider.spec.json` |
| **Switch 开关** | 切换控件，关联禁用透明度令牌 | `switch.spec.json` |
| **Table 表格** | 完整表格组合，粘性表头 | – |
| **Tabs 标签页** | List/Trigger/Content + 激活态 | `tabs.spec.json` |
| **Textarea 文本域** | 最小高度令牌，禁用态透明度 | `textarea.spec.json` |
| **Tooltip 提示气泡** | 延迟动画 + 动效令牌 | `tooltip.spec.json` |

## 设计令牌系统

### Seed → Map 管线

HarnessUI 采用受 Ant Design 令牌体系启发的**双层令牌架构**：

```jsonc
// tokens.json —— 你只需编辑种子层
{
  "version": 2,
  "seed": {
    "colorPrimary": "#1677ff",    // → 派生 10 级主色阶梯 + 语义别名
    "colorSuccess": "#52c41a",    // → success-bg, success-border, success-text, ...
    "fontSize": 14,               // → 7 级字号梯度令牌
    "borderRadius": 6,            // → xs/sm/md/lg/xl 圆角梯度
    "controlHeight": 36,          // → sm/lg 控件高度变体
    "motionUnit": 0.1             // → fast/mid/slow 动效时长令牌
  },
  "seedDark": {
    "colorBgBase": "#000000",     // → 自动派生暗色调色板
    "colorTextBase": "#ffffff"
  },
  "fixedAliases": {
    "opacityDisabled": 0.5,       // → disabled:opacity-disabled
    "fontWeightMedium": 500,      // → font-medium
    "fontWeightSemibold": 600     // → font-semibold
  }
}
```

运行 `npm run sync:tokens` 后生成单一 CSS 文件，包含三个区段：

### Tailwind v4 `@theme` 映射

令牌通过 Tailwind 的 `@theme inline` 指令映射，启用原生工具类：

```css
@theme inline {
  --color-primary: var(--primary);
  --color-destructive: var(--error);
  --radius-sm: var(--border-radius-sm);
  --spacing-sm: 8px;
  --spacing-base: 12px;
  --font-size-sm: 14px;
  --font-weight-medium: 500;
  --animate-duration-fast: var(--motion-duration-fast);
  /* ... 约 60 个 Tailwind 映射令牌 */
}
```

### 令牌在组件中的使用方式

| 类别 | Tailwind 类名 | 示例 |
|------|-------------|------|
| 颜色 | `bg-primary`、`text-destructive` | `<Button className="bg-primary">` |
| 间距 | `p-sm`、`gap-base`、`mt-xs` | `<Card className="p-lg">` |
| 圆角 | `rounded-md`、`rounded-lg` | `<Badge className="rounded-full">` |
| 排版 | `text-sm`、`font-medium` | `<Label className="text-sm font-medium">` |
| 阴影 | `shadow-sm`、`shadow-md` | `<Card className="shadow-sm">` |
| 动效 | `duration-fast`、`duration-slow` | `<Progress className="duration-slow">` |
| 透明度 | `opacity-disabled`、`opacity-muted` | `<Input className="disabled:opacity-disabled">` |
| 布局变量 | `var(--control-height)` | `h-[var(--control-height)]` |

## 组件规范系统

每个组件拥有一份 `.spec.json` 规范文件，作为 AI 编码规则的**唯一真源**：

```jsonc
// src/harness/schema/components/button.spec.json
{
  "name": "Button",
  "description": "主要操作触发器，支持多种变体与尺寸",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["default", "destructive", "outline", "secondary", "ghost", "link"],
      "default": "default"
    },
    "size": {
      "type": "enum",
      "values": ["default", "sm", "lg", "icon"],
      "default": "default"
    }
  },
  "styleLock": ["font-family", "line-height"],
  "forbiddenPatterns": ["inline color hex", "arbitrary spacing"],
  "aiPrompt": "使用语义化变体名。禁止硬编码颜色或间距。"
}
```

这些规范通过 `harness sync` 自动同步到 `.cursorrules`，确保 AI 工具始终拥有最新的组件 API。

## CLI 命令参考

```
harness start [dir]     初始化 + 安装依赖 + 启动 Storybook 门户
harness init [dir]      创建 .harness/ 和 .cursor/ 脚手架
harness dev [dir]       启动 Storybook 开发服务器（端口 6006）
harness sync [dir]      从规范重新生成 .cursorrules + Tailwind 配置
harness audit [dir]     对组件运行合规检查
harness upgrade [dir]   拉取最新 npm 组件包（保留本地修改）
harness mcp [dir]       启动 MCP 服务供 AI 代理集成
harness help            显示帮助信息
```

## MCP 集成

HarnessUI 内置 [Model Context Protocol](https://modelcontextprotocol.io/) 服务，实现深度 AI 集成：

```bash
npx harness mcp
```

MCP 服务暴露：
- **组件规范** —— 每个组件的完整 Schema 数据
- **令牌注册表** —— 所有派生令牌的值与分类
- **审计结果** —— 实时合规状态

在 `.cursor/mcp.json` 中配置：

```json
{
  "mcpServers": {
    "harness": {
      "command": "npx",
      "args": ["harness", "mcp"]
    }
  }
}
```

## 项目结构

```
harness-design/
├── bin/
│   ├── harness.mjs              # CLI 入口
│   └── harness-mcp.mjs          # MCP 服务
├── scripts/
│   ├── emit-design-tokens-css.mjs   # 令牌 → CSS 管线
│   ├── sync-from-schema.mjs         # 规范 → .cursorrules
│   ├── harness-audit.mjs            # 合规审计器
│   └── generate-cursorrules.mjs     # 规则文件生成器
├── src/
│   ├── components/
│   │   ├── starter/             # 23 个基础组件（Radix + 令牌）
│   │   └── business/            # 业务层组合组件
│   ├── design-tokens/
│   │   ├── tokens.json          # Seed → Map 令牌定义
│   │   ├── seed-to-map.mjs      # 派生引擎（~175 变量）
│   │   ├── token-registry.ts    # 运行时令牌查询
│   │   └── story-controls.ts    # Storybook ↔ 令牌绑定
│   ├── harness/
│   │   ├── schema/components/   # 23 个组件 .spec.json 文件
│   │   ├── patterns/            # Carbon/Material 模式参考
│   │   └── rules/               # 生成的治理规则
│   └── styles/
│       ├── globals.css           # Tailwind 导入 + 基础层
│       └── design-tokens.generated.css  # 自动生成的令牌 CSS
├── .storybook/                  # Storybook 8 配置（React + Vite）
├── docs/                        # 架构与边界文档
├── AGENTS.md                    # AI 编码契约
├── tailwind.config.ts           # Tailwind v4 + Harness 扩展
└── package.json
```

## 升级策略

HarnessUI 的设计理念类似 [shadcn/ui](https://ui.shadcn.com/) —— 组件代码落在**你的代码库**中，而非隐藏在 `node_modules` 里：

```bash
# 首次安装
npm install harness-design
npx harness init

# 后续升级：自动添加新组件，保留你的修改
npm update harness-design
npx harness upgrade
```

升级系统使用**内容哈希**来检测你修改过哪些组件：
- **未修改的组件** → 用最新版本覆盖
- **已修改的组件** → 保留不动，在 Storybook 侧边栏标记状态
- **新增组件** → 自动添加

## Monorepo 推荐结构

对于 Monorepo 项目，推荐以下清晰分层的结构：

```
my-project/
├── packages/
│   └── business-ui/          # 你的组件库（唯一真源）
│       ├── src/components/   # 从 .harness/ 复制的组件
│       ├── tokens.json       # 你定制的令牌
│       └── package.json      # @acme/business-ui
├── apps/
│   └── web/                  # 业务应用
│       └── src/              # 从 @acme/business-ui 导入
├── .harness/                 # Storybook 门户 + 同步工具
└── .cursor/                  # AI 规则 + MCP 配置
```

关键约束：**`.harness/` 依赖 `packages/business-ui`**，反向绝对禁止。

## 写给 AI 工具与大语言模型

> **如果你是正在阅读此文档的 AI**：HarnessUI 在 `src/harness/schema/components/*.spec.json` 提供了结构化的组件规范。每份规范定义了组件的属性、允许的变体、样式约束和禁止模式。在生成使用 HarnessUI 组件的代码前，请务必先查阅对应的规范文件。使用 `@design` 导入别名。禁止硬编码颜色——使用语义化令牌类如 `bg-primary`、`text-destructive`。间距请使用令牌映射的 Tailwind 类（`p-sm`、`gap-base`），而非任意值。

`.cursorrules` 文件（由 `harness sync` 自动生成）包含完整的 AI 编码契约：
- 每个令牌类别允许的 Tailwind 类
- 禁止模式（不允许魔法数字、不允许内联十六进制、不允许随意间距）
- 组件属性 API 和默认值
- 导入约定和路径别名

## 技术栈

| 层级 | 技术方案 |
|------|---------|
| 组件 | [Radix UI](https://www.radix-ui.com/) 原语 + [CVA](https://cva.style/) 变体 |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com/) + `@theme inline` 令牌映射 |
| 令牌引擎 | Ant Design 算法（[`@ant-design/colors`](https://github.com/ant-design/ant-design-colors)） |
| 构建 | [Vite 6](https://vite.dev/) + 自定义 Schema API 插件 |
| Storybook | [Storybook 8](https://storybook.js.org/) + React + Vite |
| 色彩科学 | [OKLCH](https://oklch.com/) 感知色彩空间，使用 [Culori](https://culorijs.org/) |
| 类型安全 | [TypeScript 5](https://www.typescriptlang.org/) 严格模式 |
| AI 协议 | [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) |

## 参与贡献

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing`）
3. 运行类型检查（`npm run typecheck`）
4. 运行令牌同步（`npm run sync:tokens`）
5. 运行合规审计（`npm run harness:audit`）
6. 提交你的改动
7. 推送分支并创建 Pull Request

## 许可证

[MIT](LICENSE) &copy; 2026 [Gusgoooo](https://github.com/Gusgoooo)
