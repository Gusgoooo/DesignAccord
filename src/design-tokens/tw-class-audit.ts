/**
 * Tailwind ClassName → Token 自动审计工具
 *
 * 用法：
 *   import src from './button.tsx?raw';
 *   const audit = autoClassControls(src);
 *   // audit.args      → Storybook 默认值
 *   // audit.argTypes   → 自动 Controls（非 token 项带 ⚠️）
 *   // audit.buildClassName(args) → className 覆盖串
 *   // audit.entries    → 完整审计列表
 */

/* ================================================================== */
/*  1. Token 定义（与 @theme 保持一致）                                 */
/* ================================================================== */

const TOKEN_SPACING: Record<string, string> = {
  "0": "0px", xxxs: "2px", xxs: "4px", xs: "8px",
  sm: "12px", base: "16px", md: "20px", lg: "24px", xl: "32px",
};

const TOKEN_RADIUS: Record<string, string> = {
  none: "0px", sm: "4px", md: "6px", lg: "8px", xl: "12px", full: "9999px",
};

const TOKEN_SHADOW: Record<string, string> = {
  none: "none", sm: "sm", DEFAULT: "DEFAULT", md: "md", lg: "lg",
};

const TOKEN_FONT_SIZE: Record<string, string> = {
  xs: "12px", sm: "14px", base: "16px", lg: "16px",
  xl: "20px", "2xl": "24px", "3xl": "30px",
};

const TOKEN_FONT_WEIGHT: Record<string, string> = {
  normal: "400", medium: "500", semibold: "600", bold: "700",
};

const TOKEN_OPACITY: Record<string, string> = {
  disabled: "0.5", muted: "0.7", subtle: "0.4",
};

const TOKEN_DURATION: Record<string, string> = {
  fast: "0.1s", "150": "0.15s", mid: "0.2s", slow: "0.3s",
};

/** Tailwind 数字间距 → px（用于找等价 token） */
const TW_NUM_SPACING_PX: Record<string, string> = {
  "0": "0px", px: "1px", "0.5": "2px", "1": "4px", "1.5": "6px",
  "2": "8px", "2.5": "10px", "3": "12px", "3.5": "14px", "4": "16px",
  "5": "20px", "6": "24px", "7": "28px", "8": "32px", "9": "36px",
  "10": "40px", "11": "44px", "12": "48px", "14": "56px", "16": "64px",
  "20": "80px", "24": "96px",
};

/** Tailwind 默认圆角 → px */
const TW_NUM_RADIUS_PX: Record<string, string> = {
  none: "0px", sm: "2px", DEFAULT: "4px", md: "6px",
  lg: "8px", xl: "12px", "2xl": "16px", "3xl": "24px", full: "9999px",
};

const TW_NUM_FONT_SIZE_PX: Record<string, string> = {
  xs: "12px", sm: "14px", base: "16px", lg: "18px",
  xl: "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px",
  "5xl": "48px", "6xl": "60px",
};

const TW_FONT_WEIGHT_NUM: Record<string, string> = {
  thin: "100", extralight: "200", light: "300", normal: "400",
  medium: "500", semibold: "600", bold: "700", extrabold: "800", black: "900",
};

const TW_NUM_OPACITY: Record<string, string> = {
  "0": "0", "5": "0.05", "10": "0.1", "15": "0.15", "20": "0.2",
  "25": "0.25", "30": "0.3", "35": "0.35", "40": "0.4", "45": "0.45",
  "50": "0.5", "55": "0.55", "60": "0.6", "65": "0.65", "70": "0.7",
  "75": "0.75", "80": "0.8", "85": "0.85", "90": "0.9", "95": "0.95", "100": "1",
};

const TW_NUM_DURATION_MS: Record<string, string> = {
  "0": "0s", "75": "0.075s", "100": "0.1s", "150": "0.15s",
  "200": "0.2s", "300": "0.3s", "500": "0.5s", "700": "0.7s", "1000": "1s",
};

/** @theme 注册的语义色名（bg-primary, text-foreground 等） */
const SEMANTIC_COLORS = new Set([
  "background", "foreground", "card", "card-foreground",
  "popover", "popover-foreground", "primary", "primary-foreground",
  "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground",
  "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground", "sidebar-primary",
  "sidebar-primary-foreground", "sidebar-accent",
  "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
  "transparent", "current", "inherit", "white", "black",
]);

/* ================================================================== */
/*  2. 类名提取                                                        */
/* ================================================================== */

export function extractClasses(source: string): string[] {
  const raw: string[] = [];

  for (const m of source.matchAll(/className="([^"]+)"/g)) raw.push(m[1]);
  for (const m of source.matchAll(/className=\{`([^`]+)`\}/g)) raw.push(m[1]);

  for (const m of source.matchAll(/(?:cn|cva)\(([\s\S]*?)\n\s*\)/gm)) {
    const body = m[1];
    for (const s of body.matchAll(/"([^"]+)"/g)) raw.push(s[1]);
    for (const s of body.matchAll(/`([^`]+)`/g)) raw.push(s[1]);
  }
  for (const m of source.matchAll(/(?:cn|cva)\(([^\n)]*)\)/g)) {
    const body = m[1];
    for (const s of body.matchAll(/"([^"]+)"/g)) raw.push(s[1]);
    for (const s of body.matchAll(/`([^`]+)`/g)) raw.push(s[1]);
  }

  for (const m of source.matchAll(/:\s*"([^"]{4,})"/g)) {
    if (m[1].includes(" ") || /^[a-z]+-/.test(m[1])) raw.push(m[1]);
  }

  const all = raw.flatMap((s) =>
    s.split(/\s+/).filter((c) => c && !c.startsWith("${")),
  );
  return [...new Set(all)];
}

/* ================================================================== */
/*  3. 类名分类 & Token 匹配                                           */
/* ================================================================== */

export type AuditCategory =
  | "spacing" | "radius" | "shadow" | "fontSize" | "fontWeight"
  | "textColor" | "bgColor" | "borderColor" | "opacity" | "duration"
  | "layout" | "other";

export type AuditEntry = {
  raw: string;
  category: AuditCategory;
  prefix: string;
  value: string;
  isToken: boolean;
  cssValue: string;
  equivalentToken: string | null;
  adjustable: boolean;
};

type TokenDef = {
  tokens: Record<string, string>;
  twLookup: Record<string, string>;
};

function findEquivalent(
  cssVal: string,
  tokens: Record<string, string>,
): string | null {
  for (const [k, v] of Object.entries(tokens)) {
    if (v === cssVal) return k;
  }
  return null;
}

const SPACING_PREFIXES = /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|inset|top|right|bottom|left)-(.+)$/;
const RADIUS_RE = /^rounded(?:-(tl|tr|bl|br|t|r|b|l|s|e|ss|se|es|ee))?(?:-(.+))?$/;

export function auditClass(cls: string): AuditEntry | null {
  if (/^[\w[\]-]+:/.test(cls)) return null;
  if (cls.startsWith("-")) {
    const result = auditClass(cls.slice(1));
    if (result) return { ...result, raw: cls, prefix: "-" + result.prefix };
    return null;
  }

  // --- Spacing ---
  const spM = cls.match(SPACING_PREFIXES);
  if (spM) {
    const [, prefix, val] = spM;
    if (val === "auto" || val === "full" || val === "screen" || val === "fit" || val === "min" || val === "max") return null;
    if (val.startsWith("[")) return arb(cls, "spacing", prefix, val);
    const isToken = val in TOKEN_SPACING;
    const cssVal = isToken ? TOKEN_SPACING[val] : TW_NUM_SPACING_PX[val] ?? "?";
    const eq = isToken ? null : findEquivalent(cssVal, TOKEN_SPACING);
    return { raw: cls, category: "spacing", prefix, value: val, isToken, cssValue: cssVal, equivalentToken: eq, adjustable: true };
  }

  // --- Border Radius ---
  const rdM = cls.match(RADIUS_RE);
  if (rdM) {
    const sub = rdM[1] ?? "";
    const val = rdM[2] ?? "DEFAULT";
    const prefix = sub ? `rounded-${sub}` : "rounded";
    if (val.startsWith("[")) return arb(cls, "radius", prefix, val);
    const isToken = val in TOKEN_RADIUS;
    const cssVal = isToken ? TOKEN_RADIUS[val] : TW_NUM_RADIUS_PX[val] ?? "?";
    const eq = isToken ? null : findEquivalent(cssVal, TOKEN_RADIUS);
    return { raw: cls, category: "radius", prefix, value: val, isToken, cssValue: cssVal, equivalentToken: eq, adjustable: true };
  }

  // --- Shadow ---
  const shM = cls.match(/^shadow(?:-(.+))?$/);
  if (shM) {
    const val = shM[1] ?? "DEFAULT";
    if (val.startsWith("[")) return arb(cls, "shadow", "shadow", val);
    const isToken = val in TOKEN_SHADOW;
    return { raw: cls, category: "shadow", prefix: "shadow", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: true };
  }

  // --- Font Size ---
  const fsM = cls.match(/^text-(xs|sm|base|lg|xl|[2-9]xl)$/);
  if (fsM) {
    const val = fsM[1];
    const isToken = val in TOKEN_FONT_SIZE;
    const cssVal = TW_NUM_FONT_SIZE_PX[val] ?? "?";
    const eq = isToken ? null : findEquivalent(cssVal, TOKEN_FONT_SIZE);
    return { raw: cls, category: "fontSize", prefix: "text", value: val, isToken, cssValue: cssVal, equivalentToken: eq, adjustable: true };
  }

  // --- Font Weight ---
  const fwM = cls.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/);
  if (fwM) {
    const val = fwM[1];
    const isToken = val in TOKEN_FONT_WEIGHT;
    const cssVal = TW_FONT_WEIGHT_NUM[val] ?? "?";
    const eq = isToken ? null : findEquivalent(cssVal, TOKEN_FONT_WEIGHT);
    return { raw: cls, category: "fontWeight", prefix: "font", value: val, isToken, cssValue: cssVal, equivalentToken: eq, adjustable: true };
  }

  // --- Opacity ---
  const opM = cls.match(/^opacity-(.+)$/);
  if (opM) {
    const val = opM[1];
    if (val.startsWith("[")) return arb(cls, "opacity", "opacity", val);
    const isToken = val in TOKEN_OPACITY;
    const cssVal = isToken ? TOKEN_OPACITY[val] : TW_NUM_OPACITY[val] ?? "?";
    const eq = isToken ? null : findEquivalent(cssVal, TOKEN_OPACITY);
    return { raw: cls, category: "opacity", prefix: "opacity", value: val, isToken, cssValue: cssVal, equivalentToken: eq, adjustable: true };
  }

  // --- Duration ---
  const duM = cls.match(/^duration-(.+)$/);
  if (duM) {
    const val = duM[1];
    if (val.startsWith("[")) return arb(cls, "duration", "duration", val);
    const isToken = val in TOKEN_DURATION;
    const cssVal = isToken ? TOKEN_DURATION[val] : TW_NUM_DURATION_MS[val] ?? "?";
    const eq = isToken ? null : findEquivalent(cssVal, TOKEN_DURATION);
    return { raw: cls, category: "duration", prefix: "duration", value: val, isToken, cssValue: cssVal, equivalentToken: eq, adjustable: true };
  }

  // --- Text Color ---
  const tcM = cls.match(/^text-([\w-]+?)(?:\/([\d]+))?$/);
  if (tcM && !TW_NUM_FONT_SIZE_PX[tcM[1]]) {
    const val = tcM[1];
    const isToken = SEMANTIC_COLORS.has(val) || SEMANTIC_COLORS.has(val.replace("-foreground", ""));
    return { raw: cls, category: "textColor", prefix: "text", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: false };
  }

  // --- Background Color ---
  const bgM = cls.match(/^bg-([\w-]+?)(?:\/([\d]+))?$/);
  if (bgM) {
    const val = bgM[1];
    const isToken = SEMANTIC_COLORS.has(val);
    return { raw: cls, category: "bgColor", prefix: "bg", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: false };
  }

  // --- Border Color ---
  const bcM = cls.match(/^border-([\w-]+?)(?:\/([\d]+))?$/);
  if (bcM && !["solid", "dashed", "dotted", "0", "2", "4", "8"].includes(bcM[1])) {
    const val = bcM[1];
    const isToken = SEMANTIC_COLORS.has(val);
    return { raw: cls, category: "borderColor", prefix: "border", value: val, isToken, cssValue: val, equivalentToken: null, adjustable: false };
  }

  return null;
}

function arb(
  raw: string, category: AuditCategory, prefix: string, val: string,
): AuditEntry {
  return { raw, category, prefix, value: val, isToken: false, cssValue: val, equivalentToken: null, adjustable: false };
}

/* ================================================================== */
/*  4. 自动生成 Storybook Controls                                     */
/* ================================================================== */

type CategoryMeta = {
  tokens: Record<string, string>;
  label: string;
  /** 生成 className，e.g. (prefix, key) => `${prefix}-${key}` */
  makeClass: (prefix: string, key: string) => string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  spacing: {
    tokens: TOKEN_SPACING,
    label: "间距",
    makeClass: (p, k) => (k === "0" ? `${p}-0` : `${p}-${k}`),
  },
  radius: {
    tokens: TOKEN_RADIUS,
    label: "圆角",
    makeClass: (p, k) => (k === "none" ? `${p}-none` : k === "full" ? `${p}-full` : `${p}-${k}`),
  },
  shadow: {
    tokens: TOKEN_SHADOW,
    label: "阴影",
    makeClass: (_p, k) => (k === "none" ? "shadow-none" : k === "DEFAULT" ? "shadow" : `shadow-${k}`),
  },
  fontSize: {
    tokens: TOKEN_FONT_SIZE,
    label: "字号",
    makeClass: (_p, k) => `text-${k}`,
  },
  fontWeight: {
    tokens: TOKEN_FONT_WEIGHT,
    label: "字重",
    makeClass: (_p, k) => `font-${k}`,
  },
  opacity: {
    tokens: TOKEN_OPACITY,
    label: "透明度",
    makeClass: (_p, k) => `opacity-${k}`,
  },
  duration: {
    tokens: TOKEN_DURATION,
    label: "动画时长",
    makeClass: (_p, k) => `duration-${k}`,
  },
};

function makeLabels(
  tokens: Record<string, string>,
  currentValue: string | null,
  equivalentToken: string | null,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens)) {
    let lbl = `${k} · ${v}`;
    if (equivalentToken === k) lbl += " ← 等值";
    labels[k] = lbl;
  }
  if (currentValue && !(currentValue in tokens)) {
    labels[currentValue] = `⚠️ ${currentValue} (非 Token)`;
  }
  return labels;
}

export type AutoControlsResult = {
  entries: AuditEntry[];
  args: Record<string, string>;
  argTypes: Record<string, unknown>;
  buildClassName: (runtimeArgs: Record<string, string>) => string;
  /** 非 token 条目总数 */
  nonTokenCount: number;
};

export function autoClassControls(source: string): AutoControlsResult {
  const rawClasses = extractClasses(source);
  const allEntries: AuditEntry[] = [];
  for (const cls of rawClasses) {
    const entry = auditClass(cls);
    if (entry) allEntries.push(entry);
  }

  // 按 prefix 去重，保留第一个（通常是 base / 默认变体中的）
  const seen = new Set<string>();
  const adjustable: AuditEntry[] = [];
  for (const e of allEntries) {
    if (!e.adjustable) continue;
    const slotKey = `${e.category}::${e.prefix}`;
    if (seen.has(slotKey)) continue;
    seen.add(slotKey);
    adjustable.push(e);
  }

  const args: Record<string, string> = {};
  const argTypes: Record<string, unknown> = {};
  const slotMeta: Array<{ controlId: string; entry: AuditEntry; catMeta: CategoryMeta }> = [];

  for (const entry of adjustable) {
    const catMeta = CATEGORY_META[entry.category];
    if (!catMeta) continue;

    const controlId = entry.prefix.replace(/-/g, "_");
    const defaultKey = entry.isToken
      ? entry.value
      : entry.equivalentToken ?? entry.value;

    const options = [...Object.keys(catMeta.tokens)];
    if (!options.includes(entry.value) && !entry.isToken) {
      options.unshift(entry.value);
    }

    const labels = makeLabels(catMeta.tokens, entry.isToken ? null : entry.value, entry.equivalentToken);

    const desc = entry.isToken
      ? `${catMeta.label} · ${entry.raw}`
      : `⚠️ ${catMeta.label} · ${entry.raw} → 建议 ${entry.equivalentToken ?? "手动选择"}`;

    args[controlId] = defaultKey;
    argTypes[controlId] = {
      control: { type: "select" as const, labels },
      options,
      description: desc,
      table: { category: "ClassName 审计" },
    };
    slotMeta.push({ controlId, entry, catMeta });
  }

  function buildClassName(runtimeArgs: Record<string, string>): string {
    return slotMeta
      .map(({ controlId, entry, catMeta }) => {
        const selected = runtimeArgs[controlId];
        if (!selected || selected === entry.value) return "";
        return catMeta.makeClass(entry.prefix, selected);
      })
      .filter(Boolean)
      .join(" ");
  }

  const nonTokenCount = allEntries.filter((e) => !e.isToken).length;

  return { entries: allEntries, args, argTypes, buildClassName, nonTokenCount };
}
