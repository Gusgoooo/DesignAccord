import type { Meta, StoryObj } from "@storybook/react";
import { BrainIcon, ZapIcon, SparklesIcon } from "lucide-react";
import { autoClassControls, spreadAutoPreviewProps, type ClassOverrideArgs } from "@/design-tokens/tw-class-audit";
import componentSrc from "./model-selector.tsx?raw";
import {
  ModelSelector,
  ModelSelectorRoot,
  ModelSelectorTrigger,
  ModelSelectorContent,
  type ModelOption,
} from "./model-selector";
import { MockRuntimeProvider } from "./_story-runtime";

const audit = autoClassControls(componentSrc);

const sampleModels: ModelOption[] = [
  { id: "gpt-4o", name: "GPT-4o", description: "Most capable", icon: <SparklesIcon /> },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast & affordable", icon: <ZapIcon /> },
  { id: "claude-3", name: "Claude 3", description: "Thoughtful", icon: <BrainIcon /> },
  { id: "disabled-model", name: "Unavailable", description: "Coming soon", disabled: true },
];

type Args = ClassOverrideArgs & {
  variant: "outline" | "ghost" | "muted";
  size: "sm" | "default" | "lg";
};

const meta: Meta<Args> = {
  title: "AI组件库/ModelSelector",
  parameters: { layout: "centered" },
  args: {
    variant: "outline",
    size: "default",
    ...audit.args,
  },
  argTypes: {
    variant: { control: "select", options: ["outline", "ghost", "muted"] },
    size: { control: "select", options: ["sm", "default", "lg"] },
    ...audit.argTypes,
  },
  decorators: [
    (Story) => (
      <MockRuntimeProvider>
        <div style={{ padding: 40, minWidth: 320 }}>
          <Story />
        </div>
      </MockRuntimeProvider>
    ),
  ],
  render: (args) => (
    <ModelSelector models={sampleModels} variant={args.variant} size={args.size} {...spreadAutoPreviewProps(audit, args)} />
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["outline", "ghost", "muted"] as const).map((v) => (
        <ModelSelector key={v} models={sampleModels} variant={v} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["sm", "default", "lg"] as const).map((s) => (
        <ModelSelector key={s} models={sampleModels} size={s} />
      ))}
    </div>
  ),
};

export const Composed: Story = {
  render: (args) => (
    <ModelSelectorRoot models={sampleModels}>
      <ModelSelectorTrigger variant={args.variant} size={args.size} />
      <ModelSelectorContent />
    </ModelSelectorRoot>
  ),
};
