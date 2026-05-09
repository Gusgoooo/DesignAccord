import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta = {
  title: "Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["placeholder", "rows", "disabled"],
    }),
  },
  args: { placeholder: "多行内容…", rows: 4, disabled: false },
  argTypes: {
    rows: { control: "number" },
    disabled: { control: "boolean" },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full gap-sm">
      <Label htmlFor="t">备注</Label>
      <Textarea id="t" {...args} />
    </div>
  ),
};
