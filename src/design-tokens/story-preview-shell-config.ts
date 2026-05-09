/**
 * Story 级通用工具：radius 选项、合规声明。
 * 不含任何包装组件或全局覆盖。
 */
import { tokenIdsByCategory } from "./story-controls";

export function radiusTokenOptions(): string[] {
  return Array.from(
    new Set([...tokenIdsByCategory("radius"), ...tokenIdsByCategory("radius-scale")]),
  );
}

export function storyHarnessCompliance(opts: {
  extraTokenIds?: string[];
  ignoreArgNames?: string[];
}) {
  return {
    sidebarStatus: "full" as const,
    tokenIdArgs: [...(opts.extraTokenIds ?? [])],
    scanFreeTextControls: true,
    ignoreArgNames: opts.ignoreArgNames ?? [],
  };
}
