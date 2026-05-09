import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["placeholder", "defaultValue", "type", "disabled", "readOnly", "required"],
    }),
  },
  args: {
    placeholder: "请输入…",
    type: "text",
    disabled: false,
    readOnly: false,
    required: false,
  },
  argTypes: {
    type: { control: "select", options: ["text", "password", "email", "search", "number", "tel", "url"] },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    required: { control: "boolean" },
    defaultValue: { control: "text" },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Password: Story = { args: { type: "password", placeholder: "请输入密码…" } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "不可编辑" } };

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid w-full gap-xs">
      <Label htmlFor="demo-input">标签</Label>
      <Input id="demo-input" {...args} />
    </div>
  ),
};
