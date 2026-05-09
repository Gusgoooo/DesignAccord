import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
  title: "RadioGroup",
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
    <RadioGroup defaultValue="comfortable" className="flex max-w-sm flex-col gap-sm">
      <div className="flex items-center gap-xs">
        <RadioGroupItem value="default" id="rg-default" />
        <Label htmlFor="rg-default">默认密度</Label>
      </div>
      <div className="flex items-center gap-xs">
        <RadioGroupItem value="comfortable" id="rg-comf" />
        <Label htmlFor="rg-comf">舒适</Label>
      </div>
      <div className="flex items-center gap-xs">
        <RadioGroupItem value="compact" id="rg-compact" />
        <Label htmlFor="rg-compact">紧凑</Label>
      </div>
    </RadioGroup>
  ),
};
