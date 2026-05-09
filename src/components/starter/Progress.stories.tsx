import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Progress } from "./progress";

const meta = {
  title: "Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["value", "max"],
    }),
  },
  args: { value: 45, max: 100 },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    max: { control: "number" },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full">
      <Progress {...args} />
    </div>
  ),
};

function ProgressAnimatedDemo() {
  const [v, setV] = React.useState(10);
  React.useEffect(() => {
    const t = window.setInterval(() => setV((x) => (x >= 100 ? 10 : x + 5)), 400);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="flex w-full flex-col gap-sm">
      <Progress value={v} />
      <p className="text-xs text-muted-foreground">{v}%</p>
    </div>
  );
}

export const AnimatedDemo: Story = {
  render: () => <ProgressAnimatedDemo />,
};
