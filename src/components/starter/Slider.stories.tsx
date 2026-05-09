import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Slider } from "./slider";

const meta = {
  title: "Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["min", "max", "defaultValue"],
    }),
  },
  args: { min: 0, max: 100, defaultValue: 40 },
  argTypes: {
    defaultValue: { control: { type: "range", min: 0, max: 100 } },
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-full">
      <Slider {...args} />
    </div>
  ),
};
