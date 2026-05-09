import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./button.tsx?raw";
import { Button } from "./button";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; size: string; disabled: boolean; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Button",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["variant", "size", "children", "asChild", "disabled"] }),
  },
  args: { variant: "default", size: "default", disabled: false, ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"] },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
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
    <Button
      variant={args.variant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
      size={args.size as "default" | "sm" | "lg" | "icon"}
      disabled={args.disabled}
      className={audit.buildClassName(args as Record<string, string>)}
    >
      按钮
    </Button>
  ),
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-xs">
      {(["default", "destructive", "outline", "secondary", "ghost", "link"] as const).map((v) => (
        <Button key={v} variant={v} className={audit.buildClassName(args as Record<string, string>)}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-xs">
      <Button size="sm" className={audit.buildClassName(args as Record<string, string>)}>小按钮</Button>
      <Button size="default" className={audit.buildClassName(args as Record<string, string>)}>默认按钮</Button>
      <Button size="lg" className={audit.buildClassName(args as Record<string, string>)}>大按钮</Button>
      <Button size="icon" className={audit.buildClassName(args as Record<string, string>)}>⚡</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="flex gap-xs">
      <Button disabled={args.disabled} className={audit.buildClassName(args as Record<string, string>)}>禁用状态</Button>
      <Button variant="outline" disabled={args.disabled} className={audit.buildClassName(args as Record<string, string>)}>禁用描边</Button>
      <Button variant="destructive" disabled={args.disabled} className={audit.buildClassName(args as Record<string, string>)}>禁用危险</Button>
    </div>
  ),
};
