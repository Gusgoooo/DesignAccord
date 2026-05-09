import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { Switch } from "./switch";

const meta = {
  title: "Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["disabled"],
    }),
  },
  args: { disabled: false },
  argTypes: {
    disabled: { control: "boolean" },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex items-center gap-xs">
      <Switch id="sw" {...args} />
      <Label htmlFor="sw">启用通知</Label>
    </div>
  ),
};
