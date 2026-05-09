# Harness 规则镜像

与根目录 `.cursorrules` 内容一致（由 `npm run sync:harness` 生成）；请勿手改。

# AI Component Harness — 自动生成，请勿手改（修改请编辑 schema 后运行 npm run sync:harness 或 npm run generate:rules）

## 核心契约（AI 必须遵守）

1. **只用 Design Token**：颜色、间距、圆角等必须通过 token 语义类引用（如 `bg-primary`、`text-muted-foreground`），禁止硬编码色值或任意值 Tailwind。
2. **组件优先**：页面开发必须使用 schema 声明的业务组件，禁止原生 HTML 标签替代。
3. **唯一数据源**：组件行为以 `src/harness/schema/components/*.spec.json` 为准，不凭记忆推断 API。

## 引用优先
- **主路径**：每个组件只以该组件 `referencePriority[0]` 为默认 import；禁止在多条路径间随意切换。
- 下列为全部已注册组件中出现过的路径（首条对每个 spec 为主路径，其余为备选）：
  - @/components/business/BusinessBadge
  - @/components/business
  - @/components/business/BusinessButton
  - @/components/business/BusinessCheckbox
  - @/components/business/DataTable
  - @/components/business/BusinessInput

## 禁止项（原生 HTML）
- 不要使用 <button> — 业务场景禁止裸 <button>，以保证圆角、间距与品牌色一致；请改用：@/components/business/BusinessButton
- 不要使用 <table> — 业务列表应走统一 DataTable，以确保间距与品牌锁一致；请改用：@/components/business/DataTable
- 不要使用 <input> — 业务场景禁止裸 <input>，以保证高度、边框与 focus 样式一致；请改用：@/components/business/BusinessInput

## 样式锁定（黑名单思维）
- 禁止在业务页面为表格/按钮等叠加任意值间距类（如 `m-[13px]`、`p-[7px]`）。
- 禁止通过 className 覆盖下列语义（已在 harness styleLock 声明）：
### Alert (alert)
- 禁止覆盖内边距与圆角 — pattern: `^(p-|px-|py-|rounded)`
- 禁止覆盖语义颜色（由 variant 控制） — pattern: `^(bg|text|border)-(primary|secondary|destructive|accent)`
### Avatar (avatar)
- 禁止覆盖头像尺寸（使用 className 控制） — pattern: `^(h-|w-)[0-9]`
- 禁止覆盖圆角 — pattern: `^rounded`
### BusinessBadge (business-badge)
- 禁止覆盖内边距 — pattern: `^(px-|py-|p-|pt-|pb-|pl-|pr-)`
- 禁止覆盖圆角与边框 — pattern: `^(border|rounded)`
- 禁止覆盖品牌/语义色（由 variant 映射） — pattern: `^(bg|text)-(primary|secondary|destructive|accent|muted)`
- 禁止任意值间距 — pattern: `^(m|p|gap)-\[`
### BusinessButton (business-button)
- 禁止覆盖按钮高度与内边距（由 size 映射） — pattern: `^(h-|px-|py-|p-|pt-|pb-|pl-|pr-)`
- 禁止覆盖圆角（由 design token --radius 驱动） — pattern: `^rounded`
- 禁止覆盖品牌/语义色（由 variant 映射） — pattern: `^(bg|text|border)-(primary|secondary|destructive|accent|muted)`
- 禁止任意值间距 — pattern: `^(m|p|gap|space-[xy])-\[`
### Card (card)
- 禁止覆盖卡片圆角与阴影 — pattern: `^(rounded|shadow)`
- 禁止覆盖卡片背景色（由 design token 驱动） — pattern: `^bg-(card|background|primary|secondary)`
- 禁止覆盖内边距（由子组件统一控制） — pattern: `^(p-|px-|py-|pt-|pb-)`
### BusinessCheckbox (business-checkbox)
- 禁止覆盖尺寸 — pattern: `^(h-|w-|size-)`
- 禁止覆盖边框与圆角 — pattern: `^(border|rounded)`
- 禁止覆盖品牌色 — pattern: `^accent-`
- 禁止任意值间距 — pattern: `^(m|p|gap)-\[`
### DataTable (business-data-table)
- 禁止覆盖单元格与表头核心垂直内边距（由 density 映射） — pattern: `^(p|px|py|pt|pb|pl|pr)-`
- 禁止改动表格外边框与分割线语义 — pattern: `^(border|rounded|ring|outline|divide)-`
- 禁止覆盖品牌/语义色 — pattern: `^(bg|text|border)-(primary|secondary|destructive|accent|muted|card|popover)`
- 禁止任意值间距（AI 硬编码 m-[13px] 等） — pattern: `^(m|p|gap|space-[xy])-\[`
### Dialog (dialog)
- 禁止覆盖对话框定位与层级 — pattern: `^(fixed|absolute|z-)`
- 禁止覆盖最大宽度（由 DialogContent 内部控制） — pattern: `^max-w-`
- 禁止覆盖背景色与边框 — pattern: `^(bg|border)-(background|border|card)`
### DropdownMenu (dropdown-menu)
- 禁止覆盖菜单定位与层级 — pattern: `^(absolute|fixed|z-)`
- 禁止覆盖菜单背景与边框 — pattern: `^(bg|border)-(popover|border)`
- 禁止覆盖圆角与阴影 — pattern: `^(rounded|shadow)`
### BusinessInput (business-input)
- 禁止覆盖输入框高度与内边距 — pattern: `^(h-|px-|py-|p-|pt-|pb-|pl-|pr-)`
- 禁止覆盖边框与圆角 — pattern: `^(border|rounded|ring|outline)`
- 禁止任意值间距 — pattern: `^(m|p|gap|space-[xy])-\[`
### Label (label)
- 禁止覆盖字体大小与粗细 — pattern: `^(text-|font-)`
### Popover (popover)
- 禁止覆盖气泡框定位与层级 — pattern: `^(absolute|fixed|z-)`
- 禁止覆盖背景与边框色 — pattern: `^(bg|border)-(popover|border)`
### Progress (progress)
- 禁止覆盖进度条高度与圆角 — pattern: `^(h-|rounded)`
- 禁止覆盖轨道与填充颜色 — pattern: `^bg-(primary|secondary)`
### RadioGroup (radio-group)
- 禁止覆盖单选按钮尺寸 — pattern: `^(h-|w-)[0-9]`
- 禁止覆盖圆角（必须保持圆形） — pattern: `^rounded`
### ScrollArea (scroll-area)
- 禁止覆盖 overflow 行为 — pattern: `^overflow`
### Select (select)
- 禁止覆盖高度与内边距 — pattern: `^(h-|px-|py-|p-)`
- 禁止覆盖圆角 — pattern: `^rounded`
- 禁止覆盖边框与背景色 — pattern: `^(bg|border)-(input|background|primary)`
### Separator (separator)
- 禁止覆盖分隔线颜色 — pattern: `^bg-`
- 禁止覆盖尺寸（由 orientation 决定） — pattern: `^(h-|w-)`
### Skeleton (skeleton)
- 禁止覆盖动画效果 — pattern: `^animate-`
- 禁止覆盖骨架屏背景色 — pattern: `^bg-(muted|gray|slate)`
### Slider (slider)
- 禁止覆盖轨道高度与圆角 — pattern: `^(h-|rounded)`
- 禁止覆盖轨道与滑块颜色 — pattern: `^(bg|accent)-(primary|secondary)`
### Switch (switch)
- 禁止覆盖开关尺寸 — pattern: `^(h-|w-)[0-9]`
- 禁止覆盖圆角（必须保持药丸形） — pattern: `^rounded`
- 禁止覆盖选中颜色 — pattern: `^(bg|peer-checked:bg)-(primary|secondary)`
### Tabs (tabs)
- 禁止覆盖 TabsList 背景色 — pattern: `^bg-(muted|background|primary|secondary)`
- 禁止覆盖圆角 — pattern: `^rounded`
- 禁止覆盖内边距与高度 — pattern: `^(h-|p-|px-|py-)`
### Textarea (textarea)
- 禁止覆盖最小高度与圆角 — pattern: `^(min-h-|rounded)`
- 禁止覆盖边框与背景 — pattern: `^(bg|border)-(input|transparent|background)`
- 禁止覆盖内边距 — pattern: `^(px-|py-|p-)`
### Tooltip (tooltip)
- 禁止覆盖定位与层级 — pattern: `^(absolute|fixed|z-)`
- 禁止覆盖背景与文字色 — pattern: `^(bg|text)-(popover|foreground)`
- 禁止覆盖字体大小 — pattern: `^text-(xs|sm|base|lg)`

## 组件意图与 AI 指令
### Alert
- **Intent**: 用于向用户展示重要提示信息，如成功、警告、错误等状态反馈；支持标题与描述组合。
- **AI**: 需要提示信息时使用 Alert 组件；通过 variant 控制类型（默认/错误）；内部使用 AlertTitle 和 AlertDescription 组合内容结构。
### Avatar
- **Intent**: 展示用户头像，支持图片加载与文字回退；用于用户列表、评论、导航栏等场景。
- **AI**: 展示用户头像时使用 Avatar + AvatarImage + AvatarFallback 组合；AvatarFallback 在图片加载失败时显示替代文字或图标。
### BusinessBadge
- **Intent**: 状态标记、标签与计数气泡的统一入口；禁止在业务页手写 span+bg 实现类似效果。
- **AI**: 需要标签/徽章时必须使用 @/components/business/BusinessBadge；通过 variant 控制风格，禁止手写背景色和间距。
### BusinessButton
- **Intent**: 所有可点击行为的统一入口：主操作、次要操作、链接导航等；禁止在业务页散落原生 <button> 并手写间距与品牌色。
- **AI**: 需要按钮时必须使用 @/components/business/BusinessButton；通过 variant 控制视觉风格，通过 size 控制尺寸；禁止在 JSX 上堆叠 h-/px-/bg-primary 等 Tailwind 覆盖。颜色仅允许 design token 语义类。
### Card
- **Intent**: 通用内容容器，用于分组展示相关信息；支持标题、描述、正文、底部操作等结构化布局。
- **AI**: 展示分组内容时使用 Card 组件；内部按 CardHeader > CardTitle/CardDescription > CardContent > CardFooter 的层次结构组织；禁止直接在 Card 上添加 padding 类。
### BusinessCheckbox
- **Intent**: 勾选/取消勾选的统一入口：表单同意项、多选过滤器、批量选择等；禁止在业务页裸用 <input type=checkbox>。
- **AI**: 需要勾选框时必须使用 @/components/business/BusinessCheckbox；禁止手写尺寸与品牌色。
### DataTable
- **Intent**: 展示业务列表数据的主表格：分页、排序、批量操作在此收敛；禁止在业务页散落原生 <table> 与任意间距类。
- **AI**: 展示表格数据时必须使用 @/components/business/DataTable；通过 density/variant 表达密度与斑马纹，禁止在 JSX 上堆叠 p-/m-/border-/bg-primary 等 Tailwind；列宽用 columns 元数据或模板列，不要手写 w-[13px]。颜色与边框仅允许来自全局令牌 src/design-tokens/tokens.json 所映射的语义类（如 border-border、bg-muted），禁止手写 oklch/hex 离散值。
### Dialog
- **Intent**: 模态对话框，用于需要用户确认或输入信息的场景；阻断背景交互，支持受控与非受控模式。
- **AI**: 需要模态交互时使用 Dialog 组件；结构为 Dialog > DialogTrigger + DialogContent > DialogHeader/DialogFooter；通过 open/onOpenChange 实现受控，或使用 DialogTrigger/DialogClose 实现非受控。
### DropdownMenu
- **Intent**: 下拉菜单，用于在触发按钮下方展示操作列表；适用于更多操作、批量操作等场景。
- **AI**: 需要下拉操作列表时使用 DropdownMenu；结构为 DropdownMenu > DropdownMenuTrigger + DropdownMenuContent > DropdownMenuItem；使用 DropdownMenuSeparator 分隔逻辑组。
### BusinessInput
- **Intent**: 所有文本输入场景的统一入口：搜索、表单字段、密码等；禁止在业务页散落原生 <input> 并手写间距与边框。
- **AI**: 需要文本输入时必须使用 @/components/business/BusinessInput；禁止在 JSX 上堆叠 h-/px-/border- 等 Tailwind 覆盖。
### Label
- **Intent**: 表单标签，与 Input/Select 等表单控件配合使用；提供一致的字体样式与禁用态关联。
- **AI**: 表单控件前必须使用 Label 组件提供标签；通过 htmlFor 关联对应控件 id；禁止用 <span> 或 <p> 代替 Label。
### Popover
- **Intent**: 弹出气泡框，用于在触发元素附近展示额外内容或轻量交互；点击外部自动关闭。
- **AI**: 需要轻量弹出内容时使用 Popover；结构为 Popover > PopoverTrigger + PopoverContent；通过 align 属性控制对齐方式（start/center/end）。
### Progress
- **Intent**: 进度条，用于展示任务完成百分比；支持自定义最大值与无障碍属性。
- **AI**: 展示进度时使用 Progress 组件；通过 value 和 max 控制进度；禁止手动设置 h-/bg- 覆盖样式。
### RadioGroup
- **Intent**: 单选按钮组，用于在多个互斥选项中选择一个；支持受控与非受控模式。
- **AI**: 互斥选项选择使用 RadioGroup + RadioGroupItem；通过 value/onValueChange 实现受控；每个 RadioGroupItem 需搭配 Label 使用以保证无障碍。
### ScrollArea
- **Intent**: 自定义滚动区域容器，用于限制内容高度并提供滚动能力；保持滚动行为一致性。
- **AI**: 需要滚动容器时使用 ScrollArea；通过 className 设置 max-h 控制可视高度；禁止直接在容器上覆盖 overflow 类。
### Select
- **Intent**: 原生下拉选择器，统一边框与交互样式；用于简单选项场景，复杂异步选项请外层封装。
- **AI**: 简单选择场景使用 Select 组件包裹 <option>；禁止在业务页使用裸 <select> 标签；复杂选择器（搜索、多选）需在此基础上封装。
### Separator
- **Intent**: 分隔线，用于视觉分隔内容区域；支持水平和垂直方向。
- **AI**: 内容区域之间需要视觉分隔时使用 Separator；通过 orientation 控制方向；禁止用 <hr> 或手写 border 代替。
### Skeleton
- **Intent**: 骨架屏占位符，用于内容加载时展示预期布局形态；减少页面跳动感。
- **AI**: 加载态使用 Skeleton 占位；通过 className 设置宽高模拟真实内容形状（如 h-4 w-[200px]）；禁止修改 animate-pulse 和 bg-muted。
### Slider
- **Intent**: 滑块控件，用于在一个范围内选取数值；基于原生 range input 实现。
- **AI**: 范围选值使用 Slider 组件；通过 min/max/step 控制范围；禁止覆盖轨道样式，颜色由 design token 驱动。
### Switch
- **Intent**: 开关组件，用于布尔值切换场景（如启用/禁用功能）；基于无障碍 checkbox + 视觉化轨道实现。
- **AI**: 布尔切换场景使用 Switch 组件；搭配 Label 使用提供文字说明；禁止用 checkbox 或自定义 div 实现开关效果。
### Tabs
- **Intent**: 选项卡组件，用于在同一区域内切换不同视图/面板；支持受控与非受控模式。
- **AI**: 内容面板切换使用 Tabs 组件；结构为 Tabs > TabsList > TabsTrigger + TabsContent；每个 TabsTrigger 和 TabsContent 的 value 必须对应。
### Textarea
- **Intent**: 多行文本输入框，用于需要较长文本输入的场景；统一边框、圆角与聚焦样式。
- **AI**: 多行输入场景使用 Textarea 组件；禁止在业务页使用裸 <textarea>；搭配 Label 使用；通过 className 仅允许添加布局类（如 w-full）。
### Tooltip
- **Intent**: 文字提示气泡，用于鼠标悬停时展示辅助说明文字；不承载交互内容。
- **AI**: 需要悬停提示时使用 Tooltip 组件；结构为 TooltipProvider > Tooltip > TooltipTrigger + TooltipContent；内容仅限纯文字说明，交互内容请用 Popover。

## 纠错指令
- **no-raw-button**: 若 在 features/** 或 pages/** 使用原生 <button> → 替换为 import { BusinessButton } from '@/components/business/BusinessButton'，用 variant 和 size props 控制样式。
- **no-raw-table**: 若 在 features/** 或 pages/** 使用原生 <table> → 替换为 import { DataTable } from '@/components/business/DataTable'，数据与列定义传入 props。
- **no-hacky-spacing**: 若 在 DataTable 子树使用 m-[13px]、p-[7px] 等任意值 → 删除任意值 class，改用 DataTable 的 density 或设计约定的列模板。
- **no-raw-input**: 若 在 features/** 或 pages/** 使用原生 <input> → 替换为 import { BusinessInput } from '@/components/business/BusinessInput'。
