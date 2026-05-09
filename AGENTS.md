# AGENTS.md — AI 编码边界与契约

## 目录约定

1. **UI / 组件 / token 真源** → `src/components/` 与 `src/design-tokens/`
2. **Portal / sync / kit 集成** → 根层 CLI、scripts、.storybook
3. **上游 npm 包** → `node_modules/component-ai-harness/` **只读**，通过 `harness upgrade` 同步

## AI 编码契约

- **Import**：优先 `@design` 别名；禁止从 `node_modules` 深路径引用 kit 组件。
- **颜色**：仅 Design Token 语义类，禁止硬编码色值。
- **间距**：禁止任意值 Tailwind（`m-[13px]`），使用 schema 语义 props。
- **组件规范**：`src/harness/schema/components/*.spec.json` 为唯一数据源。
- **修改后**：运行 `npm run sync:harness` 同步 .cursorrules。
