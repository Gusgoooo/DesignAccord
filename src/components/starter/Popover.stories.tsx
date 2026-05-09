import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { buttonVariants } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta = {
  title: "Popover",
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
    <Popover>
      <PopoverTrigger className={buttonVariants({ variant: "outline", size: "default" })}>
        打开 Popover
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-muted-foreground">可放置过滤器、附加表单等。</p>
      </PopoverContent>
    </Popover>
  ),
};
