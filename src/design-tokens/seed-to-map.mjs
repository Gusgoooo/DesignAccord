/**
 * Seed → Map → Alias token generation engine.
 * Ported from Ant Design 5's open-source token algorithms:
 *   - @ant-design/colors (generate)
 *   - genColorMapToken / generateNeutralColorPalettes
 *   - genFontMapToken / genFontSizes
 *   - genSizeMapToken / genControlHeight / genRadius / genCommonMapToken
 *
 * Extended with custom alias generators for shadcn semantic colors,
 * shadows, spacing, opacity, font-weight, focus ring, z-index,
 * chart colors, and sidebar colors.
 */

import { generate } from "@ant-design/colors";

// ---------------------------------------------------------------------------
// Color helpers (ported from antd default/colorAlgorithm.ts + colors.ts)
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
  );
}

function alpha(colorHex, a) {
  const [r, g, b] = hexToRgb(
    colorHex.startsWith("#") ? colorHex : `#${colorHex}`,
  );
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount / 100;
  return rgbToHex(r * f, g * f, b * f);
}

function generateColorPalettes(baseColor, isDark = false, bgBase = "#141414") {
  if (isDark) {
    const colors = generate(baseColor, { theme: "dark", backgroundColor: bgBase });
    return {
      1: colors[0],
      2: colors[1],
      3: colors[2],
      4: colors[3],
      5: colors[6],
      6: colors[5],
      7: colors[4],
      8: colors[6],
      9: colors[5],
      10: colors[4],
    };
  }
  const colors = generate(baseColor);
  return {
    1: colors[0],
    2: colors[1],
    3: colors[2],
    4: colors[3],
    5: colors[4],
    6: colors[5],
    7: colors[6],
    8: colors[4],
    9: colors[5],
    10: colors[6],
  };
}

function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = amount / 100;
  return rgbToHex(
    r + (255 - r) * f,
    g + (255 - g) * f,
    b + (255 - b) * f,
  );
}

function isDarkBase(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function generateNeutralColorPalettes(bgBaseColor, textBaseColor) {
  const colorBgBase = bgBaseColor || "#fff";
  const colorTextBase = textBaseColor || "#000";
  const dark = isDarkBase(colorBgBase);
  const colorShadow = "#000";

  if (dark) {
    return {
      colorBgBase,
      colorTextBase,
      colorShadow,

      colorText: alpha(colorTextBase, 0.85),
      colorTextSecondary: alpha(colorTextBase, 0.65),
      colorTextTertiary: alpha(colorTextBase, 0.45),
      colorTextQuaternary: alpha(colorTextBase, 0.25),

      colorFill: alpha(colorTextBase, 0.18),
      colorFillSecondary: alpha(colorTextBase, 0.12),
      colorFillTertiary: alpha(colorTextBase, 0.08),
      colorFillQuaternary: alpha(colorTextBase, 0.04),

      colorBgSolid: alpha(colorTextBase, 1),
      colorBgSolidHover: alpha(colorTextBase, 0.75),
      colorBgSolidActive: alpha(colorTextBase, 0.95),

      colorBgLayout: colorBgBase,
      colorBgContainer: lighten(colorBgBase, 8),
      colorBgElevated: lighten(colorBgBase, 12),
      colorBgSpotlight: lighten(colorBgBase, 26),
      colorBgBlur: "transparent",

      colorBorder: lighten(colorBgBase, 26),
      colorBorderDisabled: lighten(colorBgBase, 10),
      colorBorderSecondary: lighten(colorBgBase, 19),
    };
  }

  return {
    colorBgBase,
    colorTextBase,
    colorShadow,

    colorText: alpha(colorTextBase, 0.88),
    colorTextSecondary: alpha(colorTextBase, 0.65),
    colorTextTertiary: alpha(colorTextBase, 0.45),
    colorTextQuaternary: alpha(colorTextBase, 0.25),

    colorFill: alpha(colorTextBase, 0.15),
    colorFillSecondary: alpha(colorTextBase, 0.06),
    colorFillTertiary: alpha(colorTextBase, 0.04),
    colorFillQuaternary: alpha(colorTextBase, 0.02),

    colorBgSolid: alpha(colorTextBase, 1),
    colorBgSolidHover: alpha(colorTextBase, 0.75),
    colorBgSolidActive: alpha(colorTextBase, 0.95),

    colorBgLayout: darken(colorBgBase, 4),
    colorBgContainer: colorBgBase,
    colorBgElevated: colorBgBase,
    colorBgSpotlight: alpha(colorTextBase, 0.85),
    colorBgBlur: "transparent",

    colorBorder: darken(colorBgBase, 15),
    colorBorderDisabled: darken(colorBgBase, 15),
    colorBorderSecondary: darken(colorBgBase, 6),
  };
}

// ---------------------------------------------------------------------------
// genColorMapToken (ported from antd shared/genColorMapToken.ts)
// ---------------------------------------------------------------------------

function genColorMapToken(seed, isDark = false) {
  const {
    colorSuccess: colorSuccessBase,
    colorWarning: colorWarningBase,
    colorError: colorErrorBase,
    colorInfo: colorInfoBase,
    colorPrimary: colorPrimaryBase,
    colorBgBase,
    colorTextBase,
  } = seed;

  const neutralColors = generateNeutralColorPalettes(colorBgBase, colorTextBase);
  const darkBg = isDark ? neutralColors.colorBgContainer : undefined;

  const primaryColors = generateColorPalettes(colorPrimaryBase, isDark, darkBg);
  const successColors = generateColorPalettes(colorSuccessBase, isDark, darkBg);
  const warningColors = generateColorPalettes(colorWarningBase, isDark, darkBg);
  const errorColors = generateColorPalettes(colorErrorBase, isDark, darkBg);
  const infoColors = generateColorPalettes(colorInfoBase, isDark, darkBg);

  const colorLink = seed.colorLink || seed.colorInfo;
  const linkColors = generateColorPalettes(colorLink, isDark, darkBg);

  return {
    ...neutralColors,

    colorPrimaryBg: primaryColors[1],
    colorPrimaryBgHover: primaryColors[2],
    colorPrimaryBorder: primaryColors[3],
    colorPrimaryBorderHover: primaryColors[4],
    colorPrimaryHover: primaryColors[5],
    colorPrimary: primaryColors[6],
    colorPrimaryActive: primaryColors[7],
    colorPrimaryTextHover: primaryColors[8],
    colorPrimaryText: primaryColors[9],
    colorPrimaryTextActive: primaryColors[10],

    colorSuccessBg: successColors[1],
    colorSuccessBgHover: successColors[2],
    colorSuccessBorder: successColors[3],
    colorSuccessBorderHover: successColors[4],
    colorSuccessHover: successColors[4],
    colorSuccess: successColors[6],
    colorSuccessActive: successColors[7],
    colorSuccessTextHover: successColors[8],
    colorSuccessText: successColors[9],
    colorSuccessTextActive: successColors[10],

    colorErrorBg: errorColors[1],
    colorErrorBgHover: errorColors[2],
    colorErrorBgActive: errorColors[3],
    colorErrorBorder: errorColors[3],
    colorErrorBorderHover: errorColors[4],
    colorErrorHover: errorColors[5],
    colorError: errorColors[6],
    colorErrorActive: errorColors[7],
    colorErrorTextHover: errorColors[8],
    colorErrorText: errorColors[9],
    colorErrorTextActive: errorColors[10],

    colorWarningBg: warningColors[1],
    colorWarningBgHover: warningColors[2],
    colorWarningBorder: warningColors[3],
    colorWarningBorderHover: warningColors[4],
    colorWarningHover: warningColors[4],
    colorWarning: warningColors[6],
    colorWarningActive: warningColors[7],
    colorWarningTextHover: warningColors[8],
    colorWarningText: warningColors[9],
    colorWarningTextActive: warningColors[10],

    colorInfoBg: infoColors[1],
    colorInfoBgHover: infoColors[2],
    colorInfoBorder: infoColors[3],
    colorInfoBorderHover: infoColors[4],
    colorInfoHover: infoColors[4],
    colorInfo: infoColors[6],
    colorInfoActive: infoColors[7],
    colorInfoTextHover: infoColors[8],
    colorInfoText: infoColors[9],
    colorInfoTextActive: infoColors[10],

    colorLinkHover: linkColors[4],
    colorLink: linkColors[6],
    colorLinkActive: linkColors[7],

    colorBgMask: alpha("#000", 0.45),
    colorWhite: "#fff",
  };
}

// ---------------------------------------------------------------------------
// genFontSizes / genFontMapToken (ported from antd shared/genFontSizes.ts)
// ---------------------------------------------------------------------------

function getLineHeight(fontSize) {
  return (fontSize + 8) / fontSize;
}

function genFontSizes(base) {
  const fontSizes = Array.from({ length: 10 }, (_, index) => {
    const i = index - 1;
    const baseSize = base * Math.E ** (i / 5);
    const intSize = index > 1 ? Math.floor(baseSize) : Math.ceil(baseSize);
    return Math.floor(intSize / 2) * 2;
  });
  fontSizes[1] = base;
  return fontSizes.map((size) => ({
    size,
    lineHeight: getLineHeight(size),
  }));
}

function genFontMapToken(fontSize) {
  const pairs = genFontSizes(fontSize);
  const sizes = pairs.map((p) => p.size);
  const lhs = pairs.map((p) => p.lineHeight);

  return {
    fontSizeSM: sizes[0],
    fontSize: sizes[1],
    fontSizeLG: sizes[2],
    fontSizeXL: sizes[3],
    fontSizeHeading1: sizes[6],
    fontSizeHeading2: sizes[5],
    fontSizeHeading3: sizes[4],
    fontSizeHeading4: sizes[3],
    fontSizeHeading5: sizes[2],
    lineHeight: lhs[1],
    lineHeightLG: lhs[2],
    lineHeightSM: lhs[0],
    fontHeight: Math.round(lhs[1] * sizes[1]),
    fontHeightLG: Math.round(lhs[2] * sizes[2]),
    fontHeightSM: Math.round(lhs[0] * sizes[0]),
    lineHeightHeading1: lhs[6],
    lineHeightHeading2: lhs[5],
    lineHeightHeading3: lhs[4],
    lineHeightHeading4: lhs[3],
    lineHeightHeading5: lhs[2],
  };
}

// ---------------------------------------------------------------------------
// genSizeMapToken (ported from antd shared/genSizeMapToken.ts)
// ---------------------------------------------------------------------------

function genSizeMapToken(seed) {
  const { sizeUnit, sizeStep } = seed;
  return {
    sizeXXL: sizeUnit * (sizeStep + 8),
    sizeXL: sizeUnit * (sizeStep + 4),
    sizeLG: sizeUnit * (sizeStep + 2),
    sizeMD: sizeUnit * (sizeStep + 1),
    sizeMS: sizeUnit * sizeStep,
    size: sizeUnit * sizeStep,
    sizeSM: sizeUnit * (sizeStep - 1),
    sizeXS: sizeUnit * (sizeStep - 2),
    sizeXXS: sizeUnit * (sizeStep - 3),
  };
}

// ---------------------------------------------------------------------------
// genControlHeight (ported from antd shared/genControlHeight.ts)
// ---------------------------------------------------------------------------

function genControlHeight(seed) {
  const { controlHeight } = seed;
  return {
    controlHeightSM: controlHeight * 0.75,
    controlHeightXS: controlHeight * 0.5,
    controlHeightLG: controlHeight * 1.25,
  };
}

// ---------------------------------------------------------------------------
// genRadius (ported from antd shared/genRadius.ts)
// ---------------------------------------------------------------------------

function genRadius(radiusBase) {
  let radiusLG = radiusBase;
  let radiusSM = radiusBase;
  let radiusXS = radiusBase;
  let radiusOuter = radiusBase;

  if (radiusBase < 6 && radiusBase >= 5) radiusLG = radiusBase + 1;
  else if (radiusBase < 16 && radiusBase >= 6) radiusLG = radiusBase + 2;
  else if (radiusBase >= 16) radiusLG = 16;

  if (radiusBase < 7 && radiusBase >= 5) radiusSM = 4;
  else if (radiusBase < 8 && radiusBase >= 7) radiusSM = 5;
  else if (radiusBase < 14 && radiusBase >= 8) radiusSM = 6;
  else if (radiusBase < 16 && radiusBase >= 14) radiusSM = 7;
  else if (radiusBase >= 16) radiusSM = 8;

  if (radiusBase < 6 && radiusBase >= 2) radiusXS = 1;
  else if (radiusBase >= 6) radiusXS = 2;

  if (radiusBase > 4 && radiusBase < 8) radiusOuter = 4;
  else if (radiusBase >= 8) radiusOuter = 6;

  return {
    borderRadius: radiusBase,
    borderRadiusXS: radiusXS,
    borderRadiusSM: radiusSM,
    borderRadiusLG: radiusLG,
    borderRadiusOuter: radiusOuter,
  };
}

// ---------------------------------------------------------------------------
// genCommonMapToken (ported from antd shared/genCommonMapToken.ts)
// ---------------------------------------------------------------------------

function genCommonMapToken(seed) {
  const { motionUnit, motionBase, borderRadius, lineWidth } = seed;
  return {
    motionDurationFast: `${(motionBase + motionUnit).toFixed(1)}s`,
    motionDurationMid: `${(motionBase + motionUnit * 2).toFixed(1)}s`,
    motionDurationSlow: `${(motionBase + motionUnit * 3).toFixed(1)}s`,
    lineWidthBold: lineWidth + 1,
    ...genRadius(borderRadius),
  };
}

// ---------------------------------------------------------------------------
// Custom: genShadowTokens
// ---------------------------------------------------------------------------

function genShadowTokens(colorShadow, isDark) {
  const lo = isDark ? 0.2 : 0.05;
  const mid = isDark ? 0.35 : 0.1;
  const hi = isDark ? 0.4 : 0.1;
  return {
    shadowSm: `0 1px 2px 0 ${alpha(colorShadow, lo)}`,
    shadow: `0 1px 3px 0 ${alpha(colorShadow, mid)}, 0 1px 2px -1px ${alpha(colorShadow, mid)}`,
    shadowMd: `0 4px 6px -1px ${alpha(colorShadow, mid)}, 0 2px 4px -2px ${alpha(colorShadow, mid)}`,
    shadowLg: `0 10px 15px -3px ${alpha(colorShadow, mid)}, 0 4px 6px -4px ${alpha(colorShadow, hi)}`,
    shadowInner: `inset 0 2px 4px 0 ${alpha(colorShadow, lo)}`,
  };
}

// ---------------------------------------------------------------------------
// Custom: genSpacingTokens (from sizeUnit, matching Tailwind scale)
// ---------------------------------------------------------------------------

function genSpacingTokens(sizeUnit) {
  const s = (n) => `${sizeUnit * n}px`;
  return {
    "space-0": "0",
    "space-0.5": s(0.5),
    "space-1": s(1),
    "space-1.5": s(1.5),
    "space-2": s(2),
    "space-2.5": s(2.5),
    "space-3": s(3),
    "space-4": s(4),
    "space-5": s(5),
    "space-6": s(6),
    "space-7": s(7),
    "space-8": s(8),
    "space-9": s(9),
    "space-10": s(10),
    "space-11": s(11),
    "space-12": s(12),
    "space-14": s(14),
    "space-16": s(16),
    "space-20": s(20),
    "space-24": s(24),
    "space-32": s(32),
  };
}

// ---------------------------------------------------------------------------
// Custom: genPaddingTokens (antd alias-layer padding/margin from size tokens)
// ---------------------------------------------------------------------------

function genPaddingTokens(sizeTokens) {
  return {
    paddingXXS: sizeTokens.sizeXXS,
    paddingXS: sizeTokens.sizeXS,
    paddingSM: sizeTokens.sizeSM,
    padding: sizeTokens.size,
    paddingMD: sizeTokens.sizeMD,
    paddingLG: sizeTokens.sizeLG,
    paddingXL: sizeTokens.sizeXL,
    marginXXS: sizeTokens.sizeXXS,
    marginXS: sizeTokens.sizeXS,
    marginSM: sizeTokens.sizeSM,
    margin: sizeTokens.size,
    marginMD: sizeTokens.sizeMD,
    marginLG: sizeTokens.sizeLG,
    marginXL: sizeTokens.sizeXL,
    marginXXL: sizeTokens.sizeXXL,
  };
}

// ---------------------------------------------------------------------------
// Custom: genShadcnAliasTokens (maps antd map tokens → shadcn CSS variable names)
// ---------------------------------------------------------------------------

function genShadcnAliasTokens(colorMap) {
  return {
    background: colorMap.colorBgBase,
    foreground: colorMap.colorText,
    card: colorMap.colorBgContainer,
    "card-foreground": colorMap.colorText,
    popover: colorMap.colorBgElevated,
    "popover-foreground": colorMap.colorText,
    primary: colorMap.colorPrimary,
    "primary-foreground": colorMap.colorWhite,
    secondary: colorMap.colorFillSecondary,
    "secondary-foreground": colorMap.colorText,
    muted: colorMap.colorBgLayout,
    "muted-foreground": colorMap.colorTextTertiary,
    accent: colorMap.colorFillSecondary,
    "accent-foreground": colorMap.colorText,
    destructive: colorMap.colorError,
    border: colorMap.colorBorderSecondary,
    input: colorMap.colorBorder,
    ring: colorMap.colorPrimary,
  };
}

// ---------------------------------------------------------------------------
// Custom: genSidebarAliasTokens
// ---------------------------------------------------------------------------

function genSidebarAliasTokens(colorMap) {
  return {
    sidebar: colorMap.colorBgElevated,
    "sidebar-foreground": colorMap.colorText,
    "sidebar-primary": colorMap.colorPrimary,
    "sidebar-primary-foreground": colorMap.colorWhite,
    "sidebar-accent": colorMap.colorFillSecondary,
    "sidebar-accent-foreground": colorMap.colorText,
    "sidebar-border": colorMap.colorBorderSecondary,
    "sidebar-ring": colorMap.colorPrimary,
  };
}

// ---------------------------------------------------------------------------
// Custom: genZIndexTokens
// ---------------------------------------------------------------------------

function genZIndexTokens(seed) {
  const base = seed.zIndexBase ?? 0;
  const popup = seed.zIndexPopupBase ?? 1000;
  return {
    "z-base": base,
    "z-dropdown": popup,
    "z-modal": popup + 300,
    "z-tooltip": popup + 70,
  };
}

// ---------------------------------------------------------------------------
// Main export: deriveSeedToMap
// ---------------------------------------------------------------------------

/**
 * @param {object} seed   – full seed object (light or merged light+darkOverrides)
 * @param {object} options
 * @param {boolean} options.dark – if true, generate dark-mode tokens
 * @param {object} options.customSeeds – chart colors etc.
 * @param {object} options.fixedAliases – opacity, fontWeight, ring etc.
 * @returns {Record<string, string|number>} flat map of CSS variable name → value
 */
export function deriveSeedToMap(seed, { dark = false, customSeeds = {}, fixedAliases = {} } = {}) {
  const vars = {};

  // --- Map layer: antd algorithms ---
  const colorMap = genColorMapToken(seed, dark);
  const fontMap = genFontMapToken(seed.fontSize);
  const sizeMap = genSizeMapToken(seed);
  const heightMap = genControlHeight(seed);
  const commonMap = genCommonMapToken(seed);

  // Color map tokens → CSS variables
  const colorVarMap = {
    "color-primary": colorMap.colorPrimary,
    "color-primary-bg": colorMap.colorPrimaryBg,
    "color-primary-bg-hover": colorMap.colorPrimaryBgHover,
    "color-primary-border": colorMap.colorPrimaryBorder,
    "color-primary-border-hover": colorMap.colorPrimaryBorderHover,
    "color-primary-hover": colorMap.colorPrimaryHover,
    "color-primary-active": colorMap.colorPrimaryActive,
    "color-primary-text-hover": colorMap.colorPrimaryTextHover,
    "color-primary-text": colorMap.colorPrimaryText,
    "color-primary-text-active": colorMap.colorPrimaryTextActive,

    "color-success": colorMap.colorSuccess,
    "color-success-bg": colorMap.colorSuccessBg,
    "color-success-bg-hover": colorMap.colorSuccessBgHover,
    "color-success-border": colorMap.colorSuccessBorder,
    "color-success-border-hover": colorMap.colorSuccessBorderHover,
    "color-success-hover": colorMap.colorSuccessHover,
    "color-success-active": colorMap.colorSuccessActive,
    "color-success-text-hover": colorMap.colorSuccessTextHover,
    "color-success-text": colorMap.colorSuccessText,
    "color-success-text-active": colorMap.colorSuccessTextActive,

    "color-warning": colorMap.colorWarning,
    "color-warning-bg": colorMap.colorWarningBg,
    "color-warning-bg-hover": colorMap.colorWarningBgHover,
    "color-warning-border": colorMap.colorWarningBorder,
    "color-warning-border-hover": colorMap.colorWarningBorderHover,
    "color-warning-hover": colorMap.colorWarningHover,
    "color-warning-active": colorMap.colorWarningActive,
    "color-warning-text-hover": colorMap.colorWarningTextHover,
    "color-warning-text": colorMap.colorWarningText,
    "color-warning-text-active": colorMap.colorWarningTextActive,

    "color-error": colorMap.colorError,
    "color-error-bg": colorMap.colorErrorBg,
    "color-error-bg-hover": colorMap.colorErrorBgHover,
    "color-error-bg-active": colorMap.colorErrorBgActive,
    "color-error-border": colorMap.colorErrorBorder,
    "color-error-border-hover": colorMap.colorErrorBorderHover,
    "color-error-hover": colorMap.colorErrorHover,
    "color-error-active": colorMap.colorErrorActive,
    "color-error-text-hover": colorMap.colorErrorTextHover,
    "color-error-text": colorMap.colorErrorText,
    "color-error-text-active": colorMap.colorErrorTextActive,

    "color-info": colorMap.colorInfo,
    "color-info-bg": colorMap.colorInfoBg,
    "color-info-bg-hover": colorMap.colorInfoBgHover,
    "color-info-border": colorMap.colorInfoBorder,
    "color-info-border-hover": colorMap.colorInfoBorderHover,
    "color-info-hover": colorMap.colorInfoHover,
    "color-info-active": colorMap.colorInfoActive,
    "color-info-text-hover": colorMap.colorInfoTextHover,
    "color-info-text": colorMap.colorInfoText,
    "color-info-text-active": colorMap.colorInfoTextActive,

    "color-link": colorMap.colorLink,
    "color-link-hover": colorMap.colorLinkHover,
    "color-link-active": colorMap.colorLinkActive,

    "color-text": colorMap.colorText,
    "color-text-secondary": colorMap.colorTextSecondary,
    "color-text-tertiary": colorMap.colorTextTertiary,
    "color-text-quaternary": colorMap.colorTextQuaternary,

    "color-fill": colorMap.colorFill,
    "color-fill-secondary": colorMap.colorFillSecondary,
    "color-fill-tertiary": colorMap.colorFillTertiary,
    "color-fill-quaternary": colorMap.colorFillQuaternary,

    "color-bg-base": colorMap.colorBgBase,
    "color-bg-layout": colorMap.colorBgLayout,
    "color-bg-container": colorMap.colorBgContainer,
    "color-bg-elevated": colorMap.colorBgElevated,
    "color-bg-spotlight": colorMap.colorBgSpotlight,
    "color-bg-solid": colorMap.colorBgSolid,
    "color-bg-solid-hover": colorMap.colorBgSolidHover,
    "color-bg-solid-active": colorMap.colorBgSolidActive,
    "color-bg-mask": colorMap.colorBgMask,

    "color-border": colorMap.colorBorder,
    "color-border-secondary": colorMap.colorBorderSecondary,
    "color-border-disabled": colorMap.colorBorderDisabled,

    "color-white": colorMap.colorWhite,
    "color-shadow": colorMap.colorShadow,
  };
  Object.assign(vars, colorVarMap);

  // Font map tokens
  const fontVarMap = {
    "font-size-sm": `${fontMap.fontSizeSM}px`,
    "font-size": `${fontMap.fontSize}px`,
    "font-size-lg": `${fontMap.fontSizeLG}px`,
    "font-size-xl": `${fontMap.fontSizeXL}px`,
    "font-size-heading-1": `${fontMap.fontSizeHeading1}px`,
    "font-size-heading-2": `${fontMap.fontSizeHeading2}px`,
    "font-size-heading-3": `${fontMap.fontSizeHeading3}px`,
    "font-size-heading-4": `${fontMap.fontSizeHeading4}px`,
    "font-size-heading-5": `${fontMap.fontSizeHeading5}px`,
    "line-height": fontMap.lineHeight.toFixed(4),
    "line-height-sm": fontMap.lineHeightSM.toFixed(4),
    "line-height-lg": fontMap.lineHeightLG.toFixed(4),
  };
  Object.assign(vars, fontVarMap);

  // Size map tokens (use explicit names to avoid bad camelCase→kebab for abbreviations)
  const sizeNames = {
    sizeXXL: "size-xxl", sizeXL: "size-xl", sizeLG: "size-lg",
    sizeMD: "size-md", sizeMS: "size-ms", size: "size",
    sizeSM: "size-sm", sizeXS: "size-xs", sizeXXS: "size-xxs",
  };
  for (const [k, v] of Object.entries(sizeMap)) {
    vars[sizeNames[k] || k] = `${v}px`;
  }

  // Control height tokens
  vars["control-height"] = `${seed.controlHeight}px`;
  const heightNames = {
    controlHeightSM: "control-height-sm",
    controlHeightXS: "control-height-xs",
    controlHeightLG: "control-height-lg",
  };
  for (const [k, v] of Object.entries(heightMap)) {
    vars[heightNames[k] || k] = `${v}px`;
  }

  // Radius tokens
  vars["border-radius"] = `${commonMap.borderRadius}px`;
  vars["border-radius-xs"] = `${commonMap.borderRadiusXS}px`;
  vars["border-radius-sm"] = `${commonMap.borderRadiusSM}px`;
  vars["border-radius-lg"] = `${commonMap.borderRadiusLG}px`;
  vars["border-radius-outer"] = `${commonMap.borderRadiusOuter}px`;
  vars["border-radius-xl"] = `${commonMap.borderRadiusLG + 4}px`;

  // Motion tokens
  vars["motion-duration-fast"] = commonMap.motionDurationFast;
  vars["motion-duration-mid"] = commonMap.motionDurationMid;
  vars["motion-duration-slow"] = commonMap.motionDurationSlow;

  // Line width
  vars["line-width"] = `${seed.lineWidth}px`;
  vars["line-width-bold"] = `${commonMap.lineWidthBold}px`;

  // --- Alias layer: padding/margin ---
  const paddingMap = genPaddingTokens(sizeMap);
  const padNames = {
    paddingXXS: "padding-xxs", paddingXS: "padding-xs", paddingSM: "padding-sm",
    padding: "padding", paddingMD: "padding-md", paddingLG: "padding-lg", paddingXL: "padding-xl",
    marginXXS: "margin-xxs", marginXS: "margin-xs", marginSM: "margin-sm",
    margin: "margin", marginMD: "margin-md", marginLG: "margin-lg",
    marginXL: "margin-xl", marginXXL: "margin-xxl",
  };
  for (const [k, v] of Object.entries(paddingMap)) {
    vars[padNames[k] || k] = `${v}px`;
  }

  // --- Alias layer: shadcn semantic colors ---
  const shadcnAliases = genShadcnAliasTokens(colorMap);
  for (const [k, v] of Object.entries(shadcnAliases)) {
    vars[k] = v;
  }

  // --- Alias layer: sidebar ---
  const sidebarAliases = genSidebarAliasTokens(colorMap);
  for (const [k, v] of Object.entries(sidebarAliases)) {
    vars[k] = v;
  }

  // --- Alias layer: shadows ---
  const shadowTokens = genShadowTokens(colorMap.colorShadow || "#000", dark);
  const shadowNames = {
    shadowSm: "elevation-sm", shadow: "elevation", shadowMd: "elevation-md",
    shadowLg: "elevation-lg", shadowInner: "elevation-inner",
  };
  for (const [k, v] of Object.entries(shadowTokens)) {
    vars[shadowNames[k] || k] = v;
  }

  // --- Alias layer: spacing ---
  const spacingTokens = genSpacingTokens(seed.sizeUnit);
  Object.assign(vars, spacingTokens);

  // --- Alias layer: z-index ---
  const zTokens = genZIndexTokens(seed);
  for (const [k, v] of Object.entries(zTokens)) {
    vars[k] = v;
  }

  // --- Alias layer: chart colors (custom seeds) ---
  for (let i = 1; i <= 5; i++) {
    const lightKey = `chart${i}`;
    const darkKey = `chart${i}Dark`;
    vars[`chart-${i}`] = dark
      ? customSeeds[darkKey] || customSeeds[lightKey] || ""
      : customSeeds[lightKey] || "";
  }

  // --- Alias layer: fixed aliases (opacity, font-weight, ring, etc.) ---
  if (fixedAliases.opacityDisabled != null) vars["opacity-disabled"] = fixedAliases.opacityDisabled;
  if (fixedAliases.opacityMuted != null) vars["opacity-muted"] = fixedAliases.opacityMuted;
  if (fixedAliases.opacitySubtle != null) vars["opacity-subtle"] = fixedAliases.opacitySubtle;
  if (fixedAliases.fontWeightMedium != null) vars["font-weight-medium"] = fixedAliases.fontWeightMedium;
  if (fixedAliases.fontWeightSemibold != null) vars["font-weight-semibold"] = fixedAliases.fontWeightSemibold;
  if (fixedAliases.ringWidth != null) vars["ring-width"] = fixedAliases.ringWidth;
  if (fixedAliases.ringOffset != null) vars["ring-offset"] = fixedAliases.ringOffset;
  if (fixedAliases.paddingXXXS != null) vars["padding-xxxs"] = fixedAliases.paddingXXXS;
  if (fixedAliases.textareaMinHeight != null) vars["textarea-min-height"] = fixedAliases.textareaMinHeight;
  if (fixedAliases.motionDuration150 != null) vars["motion-duration-150"] = fixedAliases.motionDuration150;

  // Border width (kept for compatibility)
  vars["border-width-hairline"] = `${seed.lineWidth}px`;
  vars["border-width-0"] = "0";

  // Font family
  if (seed.fontFamily) vars["font-family"] = seed.fontFamily;
  if (seed.fontFamilyCode) vars["font-family-code"] = seed.fontFamilyCode;

  // --- Layout tokens (max-width / min-width for story controls) ---
  const layoutMaxW = {
    "layout-max-w-sm": "24rem",
    "layout-max-w-md": "28rem",
    "layout-max-w-lg": "32rem",
    "layout-max-w-xl": "36rem",
    "layout-max-w-2xl": "42rem",
    "layout-max-w-3xl": "48rem",
    "layout-max-w-4xl": "56rem",
    "layout-max-w-5xl": "64rem",
    "layout-max-w-6xl": "72rem",
    "layout-max-w-7xl": "80rem",
    "layout-max-w-full": "100%",
    "layout-max-w-none": "none",
  };
  Object.assign(vars, layoutMaxW);

  const layoutMinW = {
    "layout-min-w-0": "0",
    "layout-min-w-2xs": "10rem",
    "layout-min-w-xs": "12rem",
    "layout-min-w-sm": "24rem",
    "layout-min-w-md": "28rem",
    "layout-min-w-lg": "32rem",
    "layout-min-w-xl": "36rem",
    "layout-min-w-full": "100%",
  };
  Object.assign(vars, layoutMinW);

  // Elevation "none" alias
  vars["elevation-none"] = "none";

  return vars;
}
