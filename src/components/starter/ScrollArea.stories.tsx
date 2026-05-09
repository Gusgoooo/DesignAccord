import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./scroll-area.tsx?raw";
import { ScrollArea } from "./scroll-area";

const audit = autoClassControls(componentSrc);

const meta = {
  title: "ScrollArea",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({ ignoreArgNames: ["children"] }),
  },
  args: { ...audit.args },
  argTypes: {
    className: { table: { disable: true } },
    children: { table: { disable: true } },
    ...audit.argTypes,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rounded: "md",
    p: "xxxs"
  },

  render: (args) => (
      <ScrollArea className={["h-[200px] w-[350px] rounded-md border p-base", audit.buildClassName(args as unknown as Record<string, string>)].filter(Boolean).join(" ")}>
        <div className="space-y-base">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="text-sm">列表项 {i + 1}</div>
          ))}
        </div>
      </ScrollArea>
    )
};
