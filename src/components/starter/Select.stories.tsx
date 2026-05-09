import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Label } from "./label";
import { Select } from "./select";

const meta = {
  title: "Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["id", "defaultValue", "children"],
    }),
  },
  argTypes: {
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Native: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-sm">
      <Label htmlFor="sel">选项</Label>
      <Select id="sel" defaultValue="b">
        <option value="a">选项 A</option>
        <option value="b">选项 B</option>
        <option value="c">选项 C</option>
      </Select>
    </div>
  ),
};
