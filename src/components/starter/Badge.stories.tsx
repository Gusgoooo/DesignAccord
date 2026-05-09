import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Badge } from "./badge";

const meta = {
  title: "Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["children", "variant"],
    }),
  },
  args: { children: "Badge", variant: "default" },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "destructive", "outline"] },
    children: { control: "text" },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "次要" } };
export const Destructive: Story = { args: { variant: "destructive", children: "危险" } };
export const Outline: Story = { args: { variant: "outline", children: "线框" } };
