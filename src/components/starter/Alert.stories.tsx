import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle } from "lucide-react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Alert, AlertDescription, AlertTitle } from "./alert";

const meta = {
  title: "Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["variant"],
    }),
  },
  args: { variant: "default" },
  argTypes: {
    variant: { control: "select", options: ["default", "destructive"] },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="w-full">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>提示</AlertTitle>
      <AlertDescription>这是一条说明文案，可用于表单校验或页面级提示。</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args} className="w-full">
      <AlertTitle>操作失败</AlertTitle>
      <AlertDescription>请检查网络或稍后重试。</AlertDescription>
    </Alert>
  ),
};
