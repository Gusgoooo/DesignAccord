import type { Meta, StoryObj } from "@storybook/react";
import { storyHarnessCompliance } from "@/design-tokens/story-preview-shell";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "./dialog";

type DialogStoryArgs = { defaultOpen: boolean };

const meta = {
  title: "Dialog",
  tags: ["autodocs"],
  parameters: {
    harnessTokenCompliance: storyHarnessCompliance({
      ignoreArgNames: ["defaultOpen"],
    }),
  },
  args: { defaultOpen: false },
  argTypes: {
    defaultOpen: { control: "boolean", description: "初始打开状态" },
  },
} satisfies Meta<DialogStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (_a) => {
    const args = _a as unknown as DialogStoryArgs;
    return (
      <Dialog defaultOpen={args.defaultOpen}>
        <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
          打开对话框
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>此处可放置说明文案；点击遮罩或按 Esc 关闭。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
              取消
            </DialogClose>
            <Button type="button">确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};
