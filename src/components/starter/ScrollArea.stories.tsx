import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { ScrollArea } from "./scroll-area";

const meta = {
  title: "ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({}),
  },
  argTypes: {
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="min-h-48 max-w-md rounded-md border border-border p-sm">
      {Array.from({ length: 24 }, (_, i) => (
        <p key={i} className="text-sm leading-relaxed">
          第 {i + 1} 行 — 滚动区域使用原生 overflow-auto，无额外依赖。
        </p>
      ))}
    </ScrollArea>
  ),
};
