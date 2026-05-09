import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Tabs",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({}),
  },
  argTypes: {
    className: { table: { disable: true } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full">
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">概况</TabsTrigger>
          <TabsTrigger value="b">详情</TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="text-sm text-muted-foreground">
          概况面板内容。
        </TabsContent>
        <TabsContent value="b" className="text-sm text-muted-foreground">
          详情面板内容。
        </TabsContent>
      </Tabs>
    </div>
  ),
};
