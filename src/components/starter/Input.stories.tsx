import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./input.tsx?raw";
import { Input } from "./input";
import { Label } from "./label";

const audit = autoClassControls(componentSrc);

type Args = { disabled: boolean; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Input",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children", "id", "type", "placeholder", "disabled"] }),
  },
  args: { disabled: false, ...audit.args },
  argTypes: {
    disabled: { control: "boolean" },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid w-[320px] gap-xs">
      <Label htmlFor="email">邮箱</Label>
      <Input id="email" type="email" placeholder="请输入邮箱" disabled={args.disabled} className={audit.buildClassName(args as Record<string, string>)} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="grid w-[320px] gap-xs">
      <Label htmlFor="email-d">邮箱</Label>
      <Input id="email-d" type="email" placeholder="禁用状态" disabled={args.disabled} className={audit.buildClassName(args as Record<string, string>)} />
    </div>
  ),
};
