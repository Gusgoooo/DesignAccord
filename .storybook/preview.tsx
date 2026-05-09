import type { Preview } from "@storybook/react";
import { useEffect, useState, type ComponentProps } from "react";
import { DocsContainer } from "@storybook/blocks";
import { themes } from "@storybook/theming";
import "../src/styles/globals.css";

const DARK_KEY = "harness-dark-mode";
const PREVIEW_BG_LIGHT = "#ffffff";
const PREVIEW_BG_DARK = "#1c1c1e";

function useDarkSync() {
  const [dark, setDark] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(DARK_KEY) === "true",
  );
  useEffect(() => {
    function apply() {
      const v = localStorage.getItem(DARK_KEY) === "true";
      setDark(v);
      document.documentElement.classList.toggle("dark", v);
      document.body.style.background = v ? PREVIEW_BG_DARK : PREVIEW_BG_LIGHT;
    }
    apply();
    window.addEventListener("storage", apply);
    const ch = new BroadcastChannel(DARK_KEY);
    ch.onmessage = () => apply();
    return () => {
      window.removeEventListener("storage", apply);
      ch.close();
    };
  }, []);
  return dark;
}

function DarkModeDecorator(Story: React.FC) {
  useDarkSync();
  return (
    <div style={{ minHeight: "100%" }}>
      <Story />
    </div>
  );
}

type DocsContainerProps = ComponentProps<typeof DocsContainer>;

function ThemedDocsContainer(props: DocsContainerProps) {
  const dark = useDarkSync();
  return <DocsContainer {...props} theme={dark ? themes.dark : themes.light} />;
}

const preview: Preview = {
  decorators: [DarkModeDecorator],
  parameters: {
    options: {
      storySort: {
        order: [
          "DesignToken",
          "Patterns",
          "Badge",
          "Button",
          "Card",
          "Checkbox",
          "DataTable",
          "Input",
          ["*"],
        ],
      },
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    layout: "centered",
    docs: {
      container: ThemedDocsContainer,
    },
  },
};

export default preview;
