#!/usr/bin/env node
/**
 * Reads src/design-tokens/tokens.json (v2 Seed structure),
 * calls seed-to-map engine to derive all map/alias tokens,
 * and writes src/styles/design-tokens.generated.css with:
 *   1. @theme inline block (Tailwind-consumed tokens)
 *   2. :root block (non-Tailwind tokens + intermediate variables for @theme var() chains)
 *   3. .dark block (dark mode overrides)
 *
 * Backwards-compatible: if tokens.json is v1 (has "tokens" array), falls back
 * to the legacy flat-emit path.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSeedToMap } from "../src/design-tokens/seed-to-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "src/design-tokens/tokens.json");
const out = path.join(root, "src/styles/design-tokens.generated.css");

const doc = JSON.parse(fs.readFileSync(src, "utf8"));

// --- v1 legacy fallback ---
if (doc.version === 1 || Array.isArray(doc.tokens)) {
  const tokens = Array.isArray(doc.tokens) ? doc.tokens : [];
  const rootLines = [":root {"];
  const darkLines = [".dark {"];
  for (const t of tokens) {
    if (t?.emitCss === false) continue;
    if (!t?.id || t.light === undefined || t.dark === undefined) continue;
    rootLines.push(`  --${t.id}: ${t.light};`);
    darkLines.push(`  --${t.id}: ${t.dark};`);
  }
  rootLines.push("}");
  darkLines.push("}");
  const banner = `/* AUTO-GENERATED (v1 legacy) — 源：tokens.json；请勿手改 */\n\n`;
  fs.writeFileSync(out, `${banner}${rootLines.join("\n")}\n\n${darkLines.join("\n")}\n`, "utf8");
  console.log(`[v1] Wrote ${path.relative(root, out)} (${tokens.length} rows)`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// v2 Seed→Map generation
// ─────────────────────────────────────────────────────────────────────────────
const { seed, seedDark = {}, customSeeds = {}, fixedAliases = {}, mapOverrides = {} } = doc;
const moLight = mapOverrides.light ?? {};
const moDark = mapOverrides.dark ?? {};

const lightVars = deriveSeedToMap(seed, { dark: false, customSeeds, fixedAliases });
const darkSeed = { ...seed, ...seedDark };
const darkVars = deriveSeedToMap(darkSeed, { dark: true, customSeeds, fixedAliases });
const lightVarsMerged = { ...lightVars, ...moLight };
const darkVarsMerged = { ...darkVars, ...moDark };

// ─────────────────────────────────────────────────────────────────────────────
// @theme mapping configuration
// ─────────────────────────────────────────────────────────────────────────────

// shadcn semantic colors → @theme --color-* via var()
// These use var() indirection because .dark overrides the underlying variable.
const SHADCN_COLORS = [
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "destructive",
  "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground",
  "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground",
  "sidebar-border", "sidebar-ring",
];

// Border radius → @theme --radius-* with direct values (theme-invariant)
const RADIUS_MAP = {
  "border-radius-sm": "radius-sm",
  "border-radius": "radius-md",
  "border-radius-lg": "radius-lg",
  "border-radius-xl": "radius-xl",
};

// Elevation → @theme --shadow-* via var() (dark mode has different shadow intensity)
const SHADOW_MAP = {
  "elevation-sm": "shadow-sm",
  "elevation": "shadow",
  "elevation-md": "shadow-md",
  "elevation-lg": "shadow-lg",
};

// Font weights → @theme --font-weight-* with direct values
const FONT_WEIGHT_KEYS = ["font-weight-medium", "font-weight-semibold"];

// Padding scale → @theme --spacing-* with direct values (theme-invariant)
const SPACING_MAP = {
  "padding-xxxs": "spacing-xxxs",
  "padding-xxs": "spacing-xxs",
  "padding-xs": "spacing-xs",
  "padding-sm": "spacing-sm",
  "padding": "spacing-base",
  "padding-md": "spacing-md",
  "padding-lg": "spacing-lg",
  "padding-xl": "spacing-xl",
};

// Font sizes → @theme --font-size-* with direct values
// Token naming differs from Tailwind naming (e.g. token "font-size-sm"=12px → Tailwind "text-xs")
const FONT_SIZE_MAP = {
  "font-size-sm": "font-size-xs",         // 12px → text-xs
  "font-size": "font-size-sm",            // 14px → text-sm
  "font-size-lg": "font-size-base",       // 16px → text-base
  "font-size-heading-5": "font-size-lg",  // 16px → text-lg
  "font-size-xl": "font-size-xl",         // 20px → text-xl
  "font-size-heading-3": "font-size-2xl", // 24px → text-2xl
  "font-size-heading-2": "font-size-3xl", // 30px → text-3xl
};

// Pair line-heights with font sizes for Tailwind's text-* shorthand
const FONT_SIZE_LINE_HEIGHT = {
  "font-size-xs": "line-height-sm",   // 1.6667
  "font-size-sm": "line-height",      // 1.5714
  "font-size-base": "line-height-lg", // 1.5
};

// Opacity → @theme --opacity-* with direct values (semantic names)
const OPACITY_KEYS = ["opacity-disabled", "opacity-muted", "opacity-subtle"];

// Motion duration → @theme --transition-duration-* for Tailwind's duration-* utilities
const MOTION_MAP = {
  "motion-duration-fast": "transition-duration-fast",
  "motion-duration-150": "transition-duration-150",
  "motion-duration-mid": "transition-duration-mid",
  "motion-duration-slow": "transition-duration-slow",
};

// Build the set of @theme variable names (without --) to exclude from :root/.dark
const themeVarNames = new Set();
for (const name of SHADCN_COLORS) themeVarNames.add(`color-${name}`);
for (const dest of Object.values(RADIUS_MAP)) themeVarNames.add(dest);
for (const dest of Object.values(SHADOW_MAP)) themeVarNames.add(dest);
for (const key of FONT_WEIGHT_KEYS) themeVarNames.add(key);
for (const dest of Object.values(SPACING_MAP)) themeVarNames.add(dest);
for (const dest of Object.values(FONT_SIZE_MAP)) {
  themeVarNames.add(dest);
  const lhKey = `${dest}--line-height`;
  if (FONT_SIZE_LINE_HEIGHT[dest]) themeVarNames.add(lhKey);
}
for (const key of OPACITY_KEYS) themeVarNames.add(key);
for (const dest of Object.values(MOTION_MAP)) themeVarNames.add(dest);

// ─── Output builders ────────────────────────────────────────────────────────

function buildThemeBlock(vars) {
  const lines = ["@theme inline {"];

  lines.push("  /* Semantic colors — var() refs; dark mode switches the underlying variable */");
  for (const name of SHADCN_COLORS) {
    if (vars[name] != null && vars[name] !== "") {
      lines.push(`  --color-${name}: var(--${name});`);
    }
  }

  lines.push("");
  lines.push("  /* Border radius — direct values */");
  for (const [srcKey, destKey] of Object.entries(RADIUS_MAP)) {
    const val = vars[srcKey];
    if (val != null && val !== "") lines.push(`  --${destKey}: ${val};`);
  }

  lines.push("");
  lines.push("  /* Shadows — var() refs; dark mode uses different shadow intensities */");
  for (const [srcKey, destKey] of Object.entries(SHADOW_MAP)) {
    if (vars[srcKey] != null && vars[srcKey] !== "") {
      lines.push(`  --${destKey}: var(--${srcKey});`);
    }
  }

  lines.push("");
  lines.push("  /* Font weights — direct values */");
  for (const key of FONT_WEIGHT_KEYS) {
    const val = vars[key];
    if (val != null && val !== "") lines.push(`  --${key}: ${val};`);
  }

  lines.push("");
  lines.push("  /* Spacing scale — direct values from padding tokens */");
  for (const [srcKey, destKey] of Object.entries(SPACING_MAP)) {
    const val = vars[srcKey];
    if (val != null && val !== "") lines.push(`  --${destKey}: ${val};`);
  }

  lines.push("");
  lines.push("  /* Font sizes — direct values; token naming differs from Tailwind (see mapping above) */");
  for (const [srcKey, destKey] of Object.entries(FONT_SIZE_MAP)) {
    const val = vars[srcKey];
    if (val != null && val !== "") {
      lines.push(`  --${destKey}: ${val};`);
      const lhSrc = FONT_SIZE_LINE_HEIGHT[destKey];
      if (lhSrc && vars[lhSrc] != null) {
        lines.push(`  --${destKey}--line-height: ${vars[lhSrc]};`);
      }
    }
  }

  lines.push("");
  lines.push("  /* Opacity — semantic names for disabled / muted / subtle states */");
  for (const key of OPACITY_KEYS) {
    const val = vars[key];
    if (val != null && val !== "") lines.push(`  --${key}: ${val};`);
  }

  lines.push("");
  lines.push("  /* Motion duration — maps to Tailwind duration-* utilities */");
  for (const [srcKey, destKey] of Object.entries(MOTION_MAP)) {
    const val = vars[srcKey];
    if (val != null && val !== "") lines.push(`  --${destKey}: ${val};`);
  }

  lines.push("}");
  return lines.join("\n");
}

function toCSS(vars, selector) {
  const lines = [`${selector} {`];
  for (const [name, value] of Object.entries(vars)) {
    if (value === "" || value == null) continue;
    if (themeVarNames.has(name)) continue;
    lines.push(`  --${name}: ${value};`);
  }
  lines.push("}");
  return lines.join("\n");
}

// ─── Write output ───────────────────────────────────────────────────────────

const banner = "/* AUTO-GENERATED (v2 Seed→Map) — 源：tokens.json seed 层；请勿手改。运行 npm run sync:tokens */\n\n";
const themeBlock = buildThemeBlock(lightVarsMerged);
const rootBlock = toCSS(lightVarsMerged, ":root");
const darkBlock = toCSS(darkVarsMerged, ".dark");
const content = `${banner}${themeBlock}\n\n${rootBlock}\n\n${darkBlock}\n`;

fs.writeFileSync(out, content, "utf8");

const themeCount = themeVarNames.size;
const rootCount = Object.keys(lightVarsMerged).filter((k) => lightVarsMerged[k] !== "" && lightVarsMerged[k] != null && !themeVarNames.has(k)).length;
const darkCount = Object.keys(darkVarsMerged).filter((k) => darkVarsMerged[k] !== "" && darkVarsMerged[k] != null && !themeVarNames.has(k)).length;
console.log(`[v2] Wrote ${path.relative(root, out)} — @theme: ${themeCount}, :root: ${rootCount}, .dark: ${darkCount}`);
