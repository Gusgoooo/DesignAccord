import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./alert.tsx?raw";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Alert",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["variant", "children"] }),
  },
  args: { variant: "default", ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[400px]">
      <Alert variant={args.variant as "default" | "destructive"} className={audit.buildClassName(args as Record<string, string>)}>
        <AlertTitle>提示</AlertTitle>
        <AlertDescription>这是一条默认提示消息。</AlertDescription>
      </Alert>
    </div>
  ),
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <div className="w-[400px]">
      <Alert variant={args.variant as "default" | "destructive"} className={audit.buildClassName(args as Record<string, string>)}>
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>操作失败，请重试。</AlertDescription>
      </Alert>
    </div>
  ),
};
