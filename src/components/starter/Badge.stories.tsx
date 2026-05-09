import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./badge.tsx?raw";
import { Badge } from "./badge";

const audit = autoClassControls(componentSrc);

type Args = { variant: string; [k: string]: unknown };

const meta: Meta<Args> = {
  title: "Badge",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["variant", "children"] }),
  },
  args: { variant: "default", ...audit.args },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "destructive", "outline"] },
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Badge variant={args.variant as "default" | "secondary" | "destructive" | "outline"} className={audit.buildClassName(args as Record<string, string>)}>
      标签
    </Badge>
  ),
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex gap-xs">
      {(["default", "secondary", "destructive", "outline"] as const).map((v) => (
        <Badge key={v} variant={v} className={audit.buildClassName(args as Record<string, string>)}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};
