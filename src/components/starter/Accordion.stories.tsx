import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { autoClassControls } from "@/design-tokens/tw-class-audit";
import componentSrc from "./accordion.tsx?raw";
import * as Comp from "./accordion";

const audit = autoClassControls(componentSrc);

type Args = { [k: string]: string };

const meta = {
  title: "Accordion",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({}),
  },
  args: { ...audit.args },
  argTypes: { ...audit.argTypes } as Meta<Args>["argTypes"],
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    py: "base"
  },

  render: (args) => {
    return (
      <Comp.Accordion type="single" collapsible className={audit.buildClassName(args)}>
        <Comp.AccordionItem value="item-1">
          <Comp.AccordionTrigger>第一项</Comp.AccordionTrigger>
          <Comp.AccordionContent>这是第一项的内容。</Comp.AccordionContent>
        </Comp.AccordionItem>
        <Comp.AccordionItem value="item-2">
          <Comp.AccordionTrigger>第二项</Comp.AccordionTrigger>
          <Comp.AccordionContent>这是第二项的内容。</Comp.AccordionContent>
        </Comp.AccordionItem>
        <Comp.AccordionItem value="item-3">
          <Comp.AccordionTrigger>第三项</Comp.AccordionTrigger>
          <Comp.AccordionContent>这是第三项的内容。</Comp.AccordionContent>
        </Comp.AccordionItem>
      </Comp.Accordion>
    );
  }
};
