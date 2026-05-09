import type { Meta, StoryObj } from "@storybook/react";
import { cssVar, tokenIdsByCategory } from "@/design-tokens/story-controls";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Skeleton } from "./skeleton";

const spacingOptions = tokenIdsByCategory("spacing");

type SkeletonStoryArgs = { skH1: string; skH2: string; skH3: string };

const meta = {
  title: "Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      extraTokenIds: ["skH1", "skH2", "skH3"],
    }),
  },
  args: { skH1: "space-2", skH2: "space-2", skH3: "space-24" } as SkeletonStoryArgs,
  argTypes: {
    skH1: { control: "select", options: spacingOptions, description: "第一行骨架高度", table: { category: "骨架" } },
    skH2: { control: "select", options: spacingOptions, description: "第二行骨架高度", table: { category: "骨架" } },
    skH3: { control: "select", options: spacingOptions, description: "第三块骨架高度", table: { category: "骨架" } },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_a) => {
    const args = _a as unknown as SkeletonStoryArgs;
    return (
      <div className="flex w-full flex-col gap-sm">
        <Skeleton style={{ height: cssVar(args.skH1), width: "75%" }} />
        <Skeleton style={{ height: cssVar(args.skH2), width: "100%" }} />
        <Skeleton style={{ height: cssVar(args.skH3), width: "100%" }} />
      </div>
    );
  },
};
