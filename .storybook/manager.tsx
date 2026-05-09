import * as React from "react";
import { createPortal } from "react-dom";
import { create } from "storybook/internal/theming";
import {
  addons,
  types,
  useStorybookApi,
  type API,
} from "storybook/internal/manager-api";
import type { API_ComponentEntry, API_HashEntry } from "storybook/internal/types";

/* ── 暗色模式基础 ── */
const DARK_KEY = "harness-dark-mode";
const _initDark = typeof localStorage !== "undefined" && localStorage.getItem(DARK_KEY) === "true";
if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", _initDark);

const lightTheme = create({
  base: "light",
  appBg: "#ffffff",
  appContentBg: "#ffffff",
  appBorderColor: "#e4e4e7",
  appBorderRadius: 8,
  textColor: "#18181b",
  textMutedColor: "#71717a",
  barBg: "#ffffff",
  barTextColor: "#18181b",
  barSelectedColor: "#18181b",
  brandTitle: "HarnessDesign",
  colorPrimary: "#18181b",
  colorSecondary: "#18181b",
  inputBg: "#ffffff",
  inputBorder: "#e4e4e7",
  inputTextColor: "#18181b",
});

const darkTheme = create({
  base: "dark",
  appBg: "#1c1c1e",
  appContentBg: "#1c1c1e",
  appBorderColor: "#3f3f46",
  appBorderRadius: 8,
  textColor: "#fafafa",
  textMutedColor: "#a1a1aa",
  barBg: "#1c1c1e",
  barTextColor: "#fafafa",
  barSelectedColor: "#fafafa",
  brandTitle: "HarnessDesign",
  colorPrimary: "#fafafa",
  colorSecondary: "#fafafa",
  inputBg: "#27272a",
  inputBorder: "#3f3f46",
  inputTextColor: "#fafafa",
});

function useManagerDarkMode() {
  const [dark, setDark] = React.useState(_initDark);
  React.useEffect(() => {
    function apply() {
      const v = localStorage.getItem(DARK_KEY) === "true";
      setDark(v);
      document.documentElement.classList.toggle("dark", v);
    }
    window.addEventListener("storage", apply);
    const ch = new BroadcastChannel(DARK_KEY);
    ch.onmessage = () => apply();
    return () => { window.removeEventListener("storage", apply); ch.close(); };
  }, []);
  return dark;
}

const DarkCtx = React.createContext(false);
function useIsDark() { return React.useContext(DarkCtx); }

/* ── 辅助 ── */

/** Storybook Manager 与预览同源；显式 origin 避免相对路径在部分环境下未命中 Vite 中间件 */
function devApi(path: string): string {
  if (typeof window === "undefined" || !path.startsWith("/")) return path;
  return `${window.location.origin}${path}`;
}

function getImportPath(api: API, item: API_ComponentEntry): string | null {
  for (const cid of item.children) {
    try {
      const d = api.getData(cid);
      if (d && "importPath" in d && typeof (d as any).importPath === "string") return (d as any).importPath;
    } catch {}
  }
  return null;
}

/* ── 可编辑组件标签 ── */

function EditableLabel({ item, api }: { item: API_ComponentEntry; api: API }) {
  const [editing, setEditing] = React.useState(false);
  const path = React.useMemo(() => getImportPath(api, item), [api, item]);

  async function commit(v: string) {
    const t = v.trim();
    setEditing(false);
    if (!path || !t || t === item.name) return;
    try {
      const r = await fetch(devApi("/api/rename-component-title"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importPath: path, prevTitle: item.name, nextTitle: t }),
      });
      const d = (await r.json()) as any;
      if (!r.ok || !d.ok) { api.addNotification({ id: "rn-err", content: { headline: "重命名失败", subHeadline: d.error ?? r.statusText } }); return; }
      window.location.reload();
    } catch (e) { api.addNotification({ id: "rn-err", content: { headline: "重命名失败", subHeadline: String(e) } }); }
  }

  if (editing) {
    return <input defaultValue={item.name} autoFocus
      style={{ font: "inherit", color: "var(--mgr-text)", width: "100%", padding: "1px 4px", borderRadius: 4, border: "1px solid var(--mgr-border)", background: "var(--mgr-input-bg)", boxSizing: "border-box" }}
      onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void commit(e.currentTarget.value); } if (e.key === "Escape") setEditing(false); }}
      onBlur={e => void commit(e.currentTarget.value)} />;
  }

  return <span title={path ? "双击修改" : ""} style={{ cursor: path ? "text" : "default", color: "var(--mgr-text)" }}
    onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); if (path) setEditing(true); }}>{item.name}</span>;
}

/* ── Kit 版本差异圆点（manifest 驱动） ── */

type KitStatusData = {
  kitVersion?: string;
  syncedAt?: string;
  dotColors?: { new?: string; modified?: string };
  components?: Record<string, { status: "new" | "modified" | "unchanged"; file?: string }>;
};

const kitStatusCache: { data: KitStatusData | null; loading: boolean } = { data: null, loading: false };

function loadKitStatus(): KitStatusData | null {
  if (kitStatusCache.data) return kitStatusCache.data;
  if (kitStatusCache.loading) return null;
  kitStatusCache.loading = true;
  fetch(devApi("/api/kit-status"))
    .then(r => r.json())
    .then((d: KitStatusData) => { kitStatusCache.data = d; })
    .catch(() => { kitStatusCache.data = { components: {} }; })
    .finally(() => { kitStatusCache.loading = false; });
  return null;
}

function useKitStatus(): KitStatusData | null {
  const [data, setData] = React.useState<KitStatusData | null>(() => loadKitStatus());
  React.useEffect(() => {
    if (data) return;
    const id = setInterval(() => {
      const d = loadKitStatus();
      if (d) { setData(d); clearInterval(id); }
    }, 300);
    return () => clearInterval(id);
  }, [data]);
  return data;
}

function getComponentKitStatus(kitStatus: KitStatusData | null, item: API_ComponentEntry): "new" | "modified" | "unchanged" | null {
  if (!kitStatus?.components) return null;
  const name = item.name;
  const entry = kitStatus.components[name];
  if (entry) return entry.status;
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(kitStatus.components)) {
    if (k.toLowerCase() === lower) return v.status;
  }
  return null;
}

function SidebarKitStatusDot({ item }: { item: API_ComponentEntry }) {
  const kitStatus = useKitStatus();
  const status = getComponentKitStatus(kitStatus, item);
  if (!status || status === "unchanged") return null;
  const colors = kitStatus?.dotColors ?? {};
  const color = status === "new" ? (colors.new ?? "#3b82f6") : (colors.modified ?? "#f59e0b");
  const label = status === "new" ? "Kit 新增组件" : "本地已修改";
  const title = status === "new"
    ? "Kit 新增：该组件由最近一次 harness upgrade 引入"
    : "本地已修改：组件内容与 kit 基准不同（upgrade 时不会被覆盖）";
  return (
    <span
      title={title}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: 6,
        height: 6,
        borderRadius: 9999,
        background: color,
        flexShrink: 0,
        marginLeft: "auto",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
      }}
      role="img"
      aria-label={label}
    />
  );
}

/* ── 内联 SVG 图标 ── */

const IcoPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcoSwatch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="12" r="1" fill="currentColor"/></svg>;
/** 叠层 / pattern，与 DesignToken 图标同尺寸 */
const IcoLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
    <path d="M22 17.65 13.5 21.5a2 2 0 0 1-1.66 0l-8.5-3.85a1 1 0 0 1 0-1.83l1-.46" />
    <path d="m22 12.65-3.5 1.59a2 2 0 0 1-1.66 0L8.5 10.36a1 1 0 0 1 0-1.83l1-.46" />
  </svg>
);
const IcoX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
/** 圆形 i，Harness 面板说明用 */
const IcoInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

/** 悬停 / 聚焦显示说明，固定定位避免被折叠区 overflow 裁切 */
function InfoTip({ text }: { text: string }) {
  const wrapRef = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0, maxW: 280 });
  const closeT = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = React.useCallback(() => {
    if (closeT.current) clearTimeout(closeT.current);
    closeT.current = null;
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeT.current = setTimeout(() => setOpen(false), 140);
  }, [cancelClose]);

  const updatePos = React.useCallback(() => {
    const btn = wrapRef.current?.querySelector("button");
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const maxW = 280;
    const maxH = 200;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - maxW - 8);
    const gap = 6;
    let top = r.bottom + gap;
    if (top + maxH > window.innerHeight - 8) top = Math.max(8, r.top - maxH - gap);
    setPos({ top, left, maxW });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePos]);

  const tip = open && typeof document !== "undefined"
    ? createPortal(
        <div
          role="tooltip"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            maxWidth: pos.maxW,
            maxHeight: 200,
            overflowY: "auto" as const,
            zIndex: 2147483647,
            padding: "8px 10px",
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.5,
            color: "#fafafa",
            background: "#27272a",
            borderRadius: 6,
            boxShadow: "0 4px 14px rgba(0,0,0,.2)",
            pointerEvents: "auto" as const,
          }}
        >
          {text}
        </div>,
        document.body,
      )
    : null;

  return (
    <span
      ref={wrapRef}
      style={{ position: "relative", display: "inline-flex", flexShrink: 0, alignItems: "center", verticalAlign: "middle" }}
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label="说明"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onFocus={() => { cancelClose(); setOpen(true); updatePos(); }}
        onBlur={scheduleClose}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          padding: 0,
          border: "none",
          borderRadius: 4,
          background: "transparent",
          color: "var(--mgr-text-tertiary)",
          cursor: "help",
        }}
      >
        <IcoInfo />
      </button>
      {tip}
    </span>
  );
}
const IcoMsg = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IcoImg = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const IcoUp = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;

/* ── 添加组件弹窗 ── */

type AddMode = "text" | "image" | "upload";

function AddComponentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = React.useState<AddMode>("text");
  const [text, setText] = React.useState("");
  const [imgFile, setImgFile] = React.useState<File | null>(null);
  const [imgPrev, setImgPrev] = React.useState<string | null>(null);
  const [storyFile, setStoryFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const dlg = React.useRef<HTMLDialogElement>(null);
  const imgInput = React.useRef<HTMLInputElement>(null);
  const storyInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { const e = dlg.current; if (!e) return; if (open && !e.open) e.showModal(); else if (!open && e.open) e.close(); }, [open]);
  React.useEffect(() => { if (!imgFile) { setImgPrev(null); return; } const u = URL.createObjectURL(imgFile); setImgPrev(u); return () => URL.revokeObjectURL(u); }, [imgFile]);

  function reset() { setText(""); setImgFile(null); setImgPrev(null); setStoryFile(null); setBusy(false); }
  function close() { reset(); onClose(); }

  async function go(url: string, body: BodyInit | string, ct?: string) {
    setBusy(true);
    try {
      const h: Record<string, string> = ct ? { "Content-Type": ct } : {};
      const r = await fetch(devApi(url), { method: "POST", headers: h, body });
      if (r.ok) { close(); window.location.reload(); } else alert("失败: " + (await r.text()));
    } catch (e) { alert(String(e)); } finally { setBusy(false); }
  }

  const dark = useIsDark();
  const D = {
    bg: dark ? "#1c1c1e" : "#fff",
    border: dark ? "#3f3f46" : "#e4e4e7",
    text: dark ? "#fafafa" : "#18181b",
    muted: dark ? "#a1a1aa" : "#71717a",
    blue: dark ? "#3b82f6" : "#2563eb",
    radius: 8,
    bgMuted: dark ? "#27272a" : "#fafafa",
  };

  const tab = (m: AddMode, label: string) => (
    <button type="button" onClick={() => setMode(m)} style={{
      flex: 1, padding: "8px 0", fontSize: 13, fontWeight: mode === m ? 600 : 400,
      color: mode === m ? D.blue : D.muted, background: "none", border: "none",
      borderBottom: mode === m ? `2px solid ${D.blue}` : "2px solid transparent", cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );

  const btnP = (disabled: boolean, label: string, fn: () => void) => (
    <button type="button" disabled={disabled} onClick={fn} style={{
      padding: "8px 20px", fontSize: 13, fontWeight: 600, color: D.bg, background: D.text,
      border: "none", borderRadius: D.radius, cursor: "pointer", fontFamily: "inherit", opacity: busy ? .6 : 1,
    }}>{busy ? "处理中…" : label}</button>
  );

  return (
    <dialog ref={dlg} onClose={close} onClick={e => { if (e.target === dlg.current) close(); }}
      style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", margin: 0,
        width: 500, height: 400, padding: 0,
        border: `1px solid ${D.border}`, borderRadius: 12, background: D.bg, boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)",
        overflow: "hidden", color: D.text, fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${D.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>添加组件</span>
          <button type="button" onClick={close} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: D.muted, display: "flex" }}><IcoX /></button>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${D.border}`, padding: "0 20px" }}>
          {tab("text", "文本描述生成")}{tab("image", "图片识别生成")}{tab("upload", "上传 Story")}
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {mode === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: D.blue }}><IcoMsg /><span style={{ fontSize: 14, fontWeight: 600 }}>用文字描述你需要的组件</span></div>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="例如：一个带搜索过滤的下拉选择器，支持多选…"
                style={{ width: "100%", minHeight: 120, padding: 12, fontSize: 13, fontFamily: "inherit", lineHeight: 1.6,
                  borderRadius: D.radius, border: `1px solid ${D.border}`, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.currentTarget.style.borderColor = D.blue} onBlur={e => e.currentTarget.style.borderColor = D.border} />
            </div>
          )}
          {mode === "image" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: D.blue }}><IcoImg /><span style={{ fontSize: 14, fontWeight: 600 }}>上传设计图自动生成</span></div>
              <input ref={imgInput} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) setImgFile(e.target.files[0]); }} />
              {imgPrev ? (
                <div style={{ position: "relative" }}>
                  <img src={imgPrev} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: D.radius, border: `1px solid ${D.border}`, background: D.bgMuted }} />
                  <button type="button" onClick={() => { setImgFile(null); if (imgInput.current) imgInput.current.value = ""; }}
                    style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", color: "#fff", border: "none", borderRadius: 4, padding: 4, cursor: "pointer", display: "flex" }}><IcoX /></button>
                </div>
              ) : (
                <button type="button" onClick={() => imgInput.current?.click()}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 32,
                    border: `2px dashed ${D.border}`, borderRadius: D.radius, background: D.bgMuted, cursor: "pointer", color: D.muted, fontSize: 13, fontFamily: "inherit" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = D.blue} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                  <IcoImg /><span>点击选择图片</span>
                </button>
              )}
            </div>
          )}
          {mode === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: D.blue }}><IcoUp /><span style={{ fontSize: 14, fontWeight: 600 }}>上传已有组件文件</span></div>
              <input ref={storyInput} type="file" accept=".tsx,.ts,.jsx,.js" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) setStoryFile(e.target.files[0]); }} />
              <button type="button" onClick={() => storyInput.current?.click()}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 32,
                  border: `2px dashed ${D.border}`, borderRadius: D.radius, background: storyFile ? (dark ? "#052e16" : "#f0fdf4") : D.bgMuted,
                  cursor: "pointer", color: storyFile ? "#16a34a" : D.muted, fontSize: 13, fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = D.blue} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                <IcoUp />{storyFile ? <span style={{ fontWeight: 600 }}>{storyFile.name}</span> : <span>点击选择 *.stories.tsx</span>}
              </button>
            </div>
          )}
        </div>
        {/* 固定底部按钮栏 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: `1px solid ${D.border}` }}>
          <button type="button" onClick={close} style={{ padding: "8px 20px", fontSize: 13, background: D.bg, border: `1px solid ${D.border}`, borderRadius: D.radius, cursor: "pointer", fontFamily: "inherit" }}>取消</button>
          {mode === "text" && btnP(!text.trim() || busy, "生成组件", () => void go("/api/generate-component", JSON.stringify({ mode: "text", prompt: text.trim() }), "application/json"))}
          {mode === "image" && btnP(!imgFile || busy, "识别并生成", () => { const fd = new FormData(); fd.append("mode", "image"); fd.append("file", imgFile!); void go("/api/generate-component", fd); })}
          {mode === "upload" && btnP(!storyFile || busy, "上传组件", () => { const fd = new FormData(); fd.append("mode", "upload"); fd.append("file", storyFile!); void go("/api/upload-component", fd); })}
        </div>
      </div>
    </dialog>
  );
}

/* ── 侧边栏顶部（GPT 风格） ── */

function useHideCreateStoryButton() {
  React.useEffect(() => {
    const hide = () => {
      const sidebar = document.querySelector(".sidebar-container");
      if (!sidebar) return;
      sidebar.querySelectorAll<HTMLElement>("button").forEach((btn) => {
        if (btn.closest("#storybook-explorer-tree") || btn.closest("[data-harness-sidebar-top]")) return;
        const svg = btn.querySelector("svg");
        if (!svg) return;
        const paths = svg.querySelectorAll("path, line, polyline");
        if (paths.length <= 3 && btn.offsetWidth < 60 && btn.offsetHeight < 60) {
          btn.style.display = "none";
        }
      });
    };
    hide();
    const mo = new MutationObserver(hide);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
}

function SidebarTop() {
  const api = useStorybookApi();
  const dark = useManagerDarkMode();
  const [addOpen, setAddOpen] = React.useState(false);
  useHideCreateStoryButton();

  React.useEffect(() => {
    addons.setConfig({ theme: dark ? darkTheme : lightTheme });
  }, [dark]);

  const secColor = dark ? "#a1a1aa" : "#52525b";
  const secBorder = dark ? "#3f3f46" : "#e4e4e7";
  const secHoverBg = dark ? "#27272a" : "#f4f4f5";
  const secHoverText = dark ? "#fafafa" : "#18181b";
  const primaryBg = dark ? "#fafafa" : "#18181b";
  const primaryText = dark ? "#18181b" : "#fff";
  const primaryHover = dark ? "#d4d4d8" : "#333";
  /** 暗色下太阳图标用纯白；浅色下月亮用次要灰；hover 再略加重对比 */
  const themeToggleIconColor = dark ? "#ffffff" : "var(--mgr-text-muted)";
  const themeToggleHoverColor = dark ? "#ffffff" : "#18181b";

  return (
    <DarkCtx.Provider value={dark}>
    <div data-harness-sidebar-top="" style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "16px 8px 12px",
      fontFamily: "system-ui,-apple-system,sans-serif",
      borderBottom: `1px solid var(--mgr-border-light)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 12px" }}>
        <div style={{ fontSize: 21, fontWeight: 700, color: "var(--mgr-text)", letterSpacing: "-0.01em", flex: 1 }}>
          HarnessDesign
        </div>
        <button
          type="button"
          title="切换暗色模式以预览所有暗色组件"
          onClick={() => {
            const next = !dark;
            localStorage.setItem(DARK_KEY, String(next));
            document.documentElement.classList.toggle("dark", next);
            try { const ch = new BroadcastChannel(DARK_KEY); ch.postMessage(next); ch.close(); } catch {}
            window.dispatchEvent(new StorageEvent("storage", { key: DARK_KEY, newValue: String(next) }));
          }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, padding: 0, flexShrink: 0,
            border: "none", borderRadius: 6, cursor: "pointer",
            background: "transparent", color: themeToggleIconColor,
            transition: "color 120ms, background 120ms",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = dark ? "#27272a" : "#f4f4f5";
            e.currentTarget.style.color = themeToggleHoverColor;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = themeToggleIconColor;
          }}
        >
          {dark
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" onClick={() => setAddOpen(true)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", padding: "7px 12px",
          fontSize: 13, fontWeight: 500, color: primaryText, background: primaryBg,
          border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
          transition: "background 120ms",
        }}
          onMouseEnter={e => e.currentTarget.style.background = primaryHover}
          onMouseLeave={e => e.currentTarget.style.background = primaryBg}>
          <IcoPlus /> 添加组件
        </button>

        <button type="button"
          onClick={() => api.selectStory("designtoken--docs", undefined, { viewMode: "docs" })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", padding: "7px 12px",
            fontSize: 13, fontWeight: 500, color: secColor, background: "transparent",
            border: `1px solid ${secBorder}`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
            transition: "all 120ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = secHoverBg; e.currentTarget.style.color = secHoverText; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = secColor; }}>
          <IcoSwatch /> DesignToken
        </button>

        <button type="button"
          onClick={() => api.selectStory("patterns--docs", undefined, { viewMode: "docs" })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", padding: "7px 12px",
            fontSize: 13, fontWeight: 500, color: secColor, background: "transparent",
            border: `1px solid ${secBorder}`, borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
            transition: "all 120ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = secHoverBg; e.currentTarget.style.color = secHoverText; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = secColor; }}>
          <IcoLayers /> Patterns
        </button>
      </div>

      <AddComponentDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
    </DarkCtx.Provider>
  );
}

/* ── Harness 面板：与当前 Story 关联的 Schema 结构化编辑（可选工作流；规范源仍为 *.spec.json） ── */

type SpecData = {
  id: string;
  componentName: string;
  version: string;
  intent: string;
  wraps: { module: string; primitives: string[] };
  requiredProps: { name: string; description: string; type: string; required: boolean; defaultValue?: unknown; enumMap?: Record<string, string[]> }[];
  optionalProps?: { name: string; description: string; type: string; required: boolean; defaultValue?: unknown; enumMap?: Record<string, string[]> }[];
  styleLock: { baselineTokens: string[]; blacklist: { description: string; pattern: string }[] };
  aiPrompt: string;
  forbidden?: { htmlTag: string; reason: string; useInstead: string }[];
  corrections?: { id: string; violation: string; fixPrompt: string }[];
  referencePriority: string[];
  /** Few-shot，进入 .cursorrules，每组件建议 1～2 条 */
  examples?: { title: string; description?: string; snippet: string }[];
  tailwindExtend?: Record<string, Record<string, string>>;
  meta?: Record<string, unknown>;
};

type SchemaListItem = { filename: string; id: string; componentName: string };

type HarnessStoryContext = {
  storyId: string | null;
  storyName: string | null;
  componentTitle: string | null;
  leafTitle: string | null;
  isStory: boolean;
};

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function deepMergePlain(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const pb = patch[k];
    const bk = base[k];
    if (isPlainObject(pb) && isPlainObject(bk)) {
      out[k] = deepMergePlain(bk, pb);
    } else {
      out[k] = pb;
    }
  }
  return out;
}

/** 将变体 patch 深度合并到组件基准 spec（数组字段整段替换） */
function deepMergeSpecData(base: SpecData, patch: unknown): SpecData {
  if (!isPlainObject(patch)) return base;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(patch)) {
    if (k === "storyHarness") continue;
    const pb = patch[k];
    const bk = (base as Record<string, unknown>)[k];
    if (isPlainObject(pb) && isPlainObject(bk)) {
      out[k] = deepMergePlain(bk, pb);
    } else {
      out[k] = pb;
    }
  }
  return out as SpecData;
}

const SPEC_PATCH_KEYS: (keyof SpecData)[] = [
  "id",
  "componentName",
  "version",
  "intent",
  "wraps",
  "requiredProps",
  "optionalProps",
  "styleLock",
  "aiPrompt",
  "forbidden",
  "corrections",
  "referencePriority",
  "examples",
  "tailwindExtend",
  "meta",
];

/** 相对组件基准的差异 → 写入 storyHarness[storyId]；无差异则删该变体条目 */
function extractHarnessPatch(edited: SpecData, base: SpecData): Record<string, unknown> | undefined {
  const patch: Record<string, unknown> = {};
  for (const key of SPEC_PATCH_KEYS) {
    if (JSON.stringify(edited[key]) !== JSON.stringify(base[key])) {
      patch[key as string] = edited[key] as unknown;
    }
  }
  return Object.keys(patch).length ? patch : undefined;
}

function normalizeSpecBaseFromRaw(raw: Record<string, unknown>): SpecData {
  const { harnessNarrative: _hn, storyHarness: _sh, ...rest } = raw;
  const r = rest as SpecData;
  return {
    ...r,
    forbidden: Array.isArray(raw.forbidden) ? raw.forbidden as SpecData["forbidden"] : [],
    corrections: Array.isArray(raw.corrections) ? raw.corrections as SpecData["corrections"] : [],
    examples: Array.isArray(raw.examples) ? raw.examples as SpecData["examples"] : [],
    referencePriority: Array.isArray(raw.referencePriority) ? raw.referencePriority as string[] : [],
  };
}

const HS = {
  wrap: { padding: 0, fontFamily: "system-ui,-apple-system,sans-serif", fontSize: 13, display: "flex", flexDirection: "column" as const, height: "100%", boxSizing: "border-box" as const, background: "var(--mgr-bg)" },
  header: { display: "flex", alignItems: "center" as const, gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--mgr-border)", flexShrink: 0 as const },
  body: { flex: 1, overflowY: "auto" as const, padding: "16px" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 600 as const, color: "var(--mgr-text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 },
  field: { display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 500 as const, color: "var(--mgr-text-secondary)" },
  input: { padding: "6px 10px", fontSize: 13, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const, outline: "none", background: "var(--mgr-input-bg)", color: "var(--mgr-text)" },
  textarea: { padding: "6px 10px", fontSize: 13, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const, minHeight: 60, resize: "vertical" as const, outline: "none", lineHeight: 1.5, background: "var(--mgr-input-bg)", color: "var(--mgr-text)" },
  mono: { padding: "6px 10px", fontSize: 12, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "ui-monospace,monospace", width: "100%", boxSizing: "border-box" as const, minHeight: 40, resize: "vertical" as const, outline: "none", lineHeight: 1.5, background: "var(--mgr-input-bg)", color: "var(--mgr-text)" },
  tag: { display: "inline-block", padding: "2px 8px", fontSize: 11, background: "var(--mgr-bg-subtle)", borderRadius: 4, color: "var(--mgr-text-muted)", marginRight: 4, marginBottom: 4 },
  btn: (primary?: boolean) => ({
    padding: "6px 14px", fontSize: 12, fontWeight: 500 as const, border: primary ? "none" : "1px solid var(--mgr-border)",
    borderRadius: 6, cursor: "pointer" as const, fontFamily: "inherit",
    background: primary ? "var(--mgr-text)" : "var(--mgr-bg)", color: primary ? "var(--mgr-bg)" : "var(--mgr-text)",
  }),
  select: { padding: "6px 10px", fontSize: 13, border: "1px solid var(--mgr-border)", borderRadius: 6, fontFamily: "inherit", background: "var(--mgr-input-bg)", color: "var(--mgr-text)", outline: "none" },
  status: { padding: "8px 12px", fontSize: 12, borderRadius: 6, margin: "0 16px 8px", whiteSpace: "pre-wrap" as const } as React.CSSProperties,
  propRow: { display: "flex", gap: 8, alignItems: "flex-start" as const, padding: "8px 0", borderBottom: "1px solid var(--mgr-bg-subtle)" },
  propName: { fontSize: 13, fontWeight: 600 as const, color: "var(--mgr-text)", minWidth: 100, flexShrink: 0 as const },
  blacklistRow: { display: "flex", gap: 8, alignItems: "center" as const, padding: "6px 0", borderBottom: "1px solid var(--mgr-bg-subtle)" },
};

function PropEditor({ prop, onChange }: { prop: SpecData["requiredProps"][0]; onChange: (p: SpecData["requiredProps"][0]) => void }) {
  return (
    <div style={{ border: "1px solid var(--mgr-border)", borderRadius: 6, padding: 10, marginBottom: 8, background: "var(--mgr-bg-muted)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={HS.label}>名称</div>
          <input style={HS.input} value={prop.name} onChange={e => onChange({ ...prop, name: e.target.value })} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={HS.label}>类型</div>
          <input style={HS.input} value={prop.type} onChange={e => onChange({ ...prop, type: e.target.value })} />
        </div>
      </div>
      <div style={HS.label}>描述</div>
      <input style={HS.input} value={prop.description} onChange={e => onChange({ ...prop, description: e.target.value })} />
      {prop.enumMap && (
        <div style={{ marginTop: 6 }}>
          <div style={HS.label}>枚举映射 (JSON)</div>
          <textarea style={HS.mono} value={JSON.stringify(prop.enumMap, null, 2)} onChange={e => {
            try { const v = JSON.parse(e.target.value); onChange({ ...prop, enumMap: v }); } catch {}
          }} />
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, hint, defaultOpen, children }: { title: string; hint?: string; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14, border: "1px solid var(--mgr-border)", borderRadius: 8, overflow: "visible", background: "var(--mgr-bg)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", background: "var(--mgr-bg-muted)", border: "none", cursor: "pointer",
          fontWeight: 600, fontSize: 13, color: "var(--mgr-text)", textAlign: "left" as const, fontFamily: "inherit",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          {hint ? <InfoTip text={hint} /> : null}
        </span>
        <span style={{ color: "var(--mgr-text-muted)", fontSize: 11, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{open ? "▼ 收起" : "▶ 展开"}</span>
      </button>
      {open && <div style={{ padding: 12, borderTop: "1px solid var(--mgr-border)" }}>{children}</div>}
    </div>
  );
}

function ExamplesEditor({ examples, onChange }: { examples: NonNullable<SpecData["examples"]>; onChange: (next: NonNullable<SpecData["examples"]>) => void }) {
  const list = examples ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((ex, i) => (
        <div key={i} style={{ padding: 10, background: "var(--mgr-bg)", borderRadius: 6, border: "1px solid var(--mgr-border)" }}>
          <div style={HS.label}>示例标题 {i + 1}</div>
          <input
            style={HS.input}
            value={ex.title}
            onChange={(e) => {
              const n = [...list];
              n[i] = { ...ex, title: e.target.value };
              onChange(n);
            }}
          />
          <div style={{ ...HS.label, marginTop: 6 }}>一句说明（可选）</div>
          <input
            style={HS.input}
            value={ex.description ?? ""}
            placeholder="如：列表行内主按钮"
            onChange={(e) => {
              const n = [...list];
              const v = e.target.value.trim();
              n[i] = { ...ex, ...(v ? { description: v } : { description: undefined }) };
              onChange(n);
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <div style={HS.label}>最小 JSX</div>
            <InfoTip text="Few-shot 片段；保存并经 sync 后写入 .cursorrules。" />
          </div>
          <textarea
            style={{ ...HS.mono, minHeight: 64 }}
            value={ex.snippet}
            placeholder={'例如：<BusinessButton variant="default">保存</BusinessButton>'}
            onChange={(e) => {
              const n = [...list];
              n[i] = { ...ex, snippet: e.target.value };
              onChange(n);
            }}
          />
          <button
            type="button"
            style={{ ...HS.btn(), marginTop: 6, fontSize: 11 }}
            onClick={() => onChange(list.filter((_, j) => j !== i))}
          >
            删除此示例
          </button>
        </div>
      ))}
      {list.length < 2 && (
        <button
          type="button"
          style={{ ...HS.btn(), fontSize: 12 }}
          onClick={() => onChange([...list, { title: `示例 ${list.length + 1}`, snippet: "" }])}
        >
          + 添加示例（最多 2 条）
        </button>
      )}
    </div>
  );
}

function BlacklistEditor({ rules, onChange }: { rules: SpecData["styleLock"]["blacklist"]; onChange: (r: SpecData["styleLock"]["blacklist"]) => void }) {
  return (
    <div>
      {rules.map((rule, i) => (
        <div key={i} style={HS.blacklistRow}>
          <div style={{ flex: 2 }}>
            <input style={HS.input} placeholder="描述" value={rule.description} onChange={e => {
              const n = [...rules]; n[i] = { ...rule, description: e.target.value }; onChange(n);
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <input style={{ ...HS.input, fontFamily: "ui-monospace,monospace", fontSize: 12 }} placeholder="pattern" value={rule.pattern} onChange={e => {
              const n = [...rules]; n[i] = { ...rule, pattern: e.target.value }; onChange(n);
            }} />
          </div>
          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mgr-text-tertiary)", padding: 4 }} onClick={() => {
            const n = rules.filter((_, j) => j !== i); onChange(n);
          }}><IcoX /></button>
        </div>
      ))}
      <button type="button" style={{ ...HS.btn(), fontSize: 11, marginTop: 6 }} onClick={() => {
        onChange([...rules, { description: "", pattern: "" }]);
      }}>+ 添加黑名单规则</button>
    </div>
  );
}

function useHarnessStoryContext(): HarnessStoryContext {
  const api = useStorybookApi();
  const [ctx, setCtx] = React.useState<HarnessStoryContext>({
    storyId: null,
    storyName: null,
    componentTitle: null,
    leafTitle: null,
    isStory: false,
  });
  React.useEffect(() => {
    function sync() {
      try {
        const current = api.getCurrentStoryData?.();
        if (!current || !("type" in current)) {
          setCtx({
            storyId: null,
            storyName: null,
            componentTitle: null,
            leafTitle: null,
            isStory: false,
          });
          return;
        }
        const title = "title" in current && typeof current.title === "string" ? current.title : "";
        const leaf = title.split("/").pop() ?? title;
        const isStory = current.type === "story";
        const storyId = isStory && "id" in current && typeof current.id === "string" ? current.id : null;
        const storyName = isStory && "name" in current && typeof current.name === "string" ? current.name : null;
        setCtx({
          storyId,
          storyName,
          componentTitle: title || null,
          leafTitle: leaf || null,
          isStory,
        });
      } catch {
        setCtx({
          storyId: null,
          storyName: null,
          componentTitle: null,
          leafTitle: null,
          isStory: false,
        });
      }
    }
    sync();
    const channel = addons.getChannel();
    channel.on("storyChanged", sync);
    channel.on("setCurrentStory", sync);
    const timer = setInterval(sync, 500);
    return () => {
      channel.off("storyChanged", sync);
      channel.off("setCurrentStory", sync);
      clearInterval(timer);
    };
  }, [api]);
  return ctx;
}

function matchSchemaForTitle(schemas: SchemaListItem[], title: string | null): SchemaListItem | null {
  if (!title || schemas.length === 0) return null;
  const lower = title.toLowerCase().replace(/\s+/g, "");
  return schemas.find(s => s.componentName.toLowerCase() === lower)
    ?? schemas.find(s => lower.includes(s.componentName.toLowerCase()))
    ?? schemas.find(s => s.componentName.toLowerCase().includes(lower))
    ?? null;
}

function CreateSchemaPrompt({ leafTitle, onCreated }: { leafTitle: string; onCreated: (filename: string) => void }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const kebab = leafTitle.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase().replace(/\s+/g, "-");
  const filename = `${kebab}.spec.json`;

  async function create() {
    setBusy(true);
    setError(null);
    const spec = {
      id: kebab,
      componentName: leafTitle,
      version: "1.0.0",
      intent: "",
      wraps: { module: `@/components/starter/${kebab}`, primitives: [leafTitle] },
      requiredProps: [],
      optionalProps: [],
      styleLock: { baselineTokens: [], blacklist: [] },
      aiPrompt: "",
      forbidden: [],
      corrections: [],
      referencePriority: [],
      meta: { tags: [], category: "ui", status: "draft" },
    };
    try {
      const r = await fetch(devApi("/api/save-schema"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, jsonText: JSON.stringify(spec, null, 2) }),
      });
      const b = await r.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!r.ok || !b.ok) throw new Error(b.error ?? r.statusText);
      onCreated(filename);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)", gap: 12, padding: 24, textAlign: "center" as const }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--mgr-text-secondary)" }}>{leafTitle}</div>
      <div>该组件尚未创建 Harness Schema</div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void create()}
        style={{
          ...HS.btn(true),
          marginTop: 4,
          opacity: busy ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <IcoPlus /> {busy ? "创建中…" : "创建 Harness Schema"}
      </button>
      {error && <div style={{ fontSize: 12, color: "#dc2626", maxWidth: 300 }}>{error}</div>}
    </div>
  );
}

function HarnessPanel() {
  const [schemas, setSchemas] = React.useState<SchemaListItem[]>([]);
  const [filename, setFilename] = React.useState("");
  const [baseCore, setBaseCore] = React.useState<SpecData | null>(null);
  const [storyHarnessMap, setStoryHarnessMap] = React.useState<Record<string, unknown>>({});
  const [spec, setSpec] = React.useState<SpecData | null>(null);
  const [status, setStatus] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const harnessCtx = useHarnessStoryContext();

  React.useEffect(() => {
    fetch(devApi("/api/schemas")).then(r => r.json()).then((list: SchemaListItem[]) => {
      setSchemas(list);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    const matched = matchSchemaForTitle(schemas, harnessCtx.leafTitle);
    if (matched && matched.filename !== filename) {
      setFilename(matched.filename);
    }
  }, [harnessCtx.leafTitle, schemas, filename]);

  const load = React.useCallback(async () => {
    if (!filename) return;
    setLoading(true); setStatus(null);
    try {
      const r = await fetch(devApi(`/api/schema/${encodeURIComponent(filename)}`));
      if (!r.ok) throw new Error(await r.text());
      const raw = (await r.json()) as Record<string, unknown>;
      const shRaw = raw.storyHarness;
      const map = isPlainObject(shRaw) ? { ...shRaw } : {};
      const { storyHarness: _sh, harnessNarrative: _legacyNarrative, ...rawBase } = raw;
      const normalized = normalizeSpecBaseFromRaw(rawBase);
      setStoryHarnessMap(map);
      setBaseCore(normalized);
    } catch (e) {
      setBaseCore(null);
      setStoryHarnessMap({});
      setSpec(null);
      setStatus({ text: `加载失败：${String(e)}`, ok: false });
    }
    finally { setLoading(false); }
  }, [filename]);

  React.useEffect(() => { void load(); }, [load]);

  React.useEffect(() => {
    if (!baseCore) {
      setSpec(null);
      return;
    }
    if (!harnessCtx.isStory || !harnessCtx.storyId) {
      setSpec(null);
      return;
    }
    const frag = storyHarnessMap[harnessCtx.storyId];
    setSpec(deepMergeSpecData(baseCore, frag ?? {}));
  }, [baseCore, storyHarnessMap, harnessCtx.storyId, harnessCtx.isStory]);

  function update<K extends keyof SpecData>(key: K, val: SpecData[K]) {
    if (!spec) return;
    setSpec({ ...spec, [key]: val });
  }

  async function save() {
    if (!spec || !filename || !baseCore) return;
    if (!harnessCtx.isStory || !harnessCtx.storyId) {
      setStatus({ text: "请从侧栏选择一条 Story 变体后再保存（Docs 总览无法对应单一变体）。", ok: false });
      return;
    }
    setStatus(null);
    try {
      const patch = extractHarnessPatch(spec, baseCore);
      const newMap = { ...storyHarnessMap };
      if (!patch) delete newMap[harnessCtx.storyId];
      else newMap[harnessCtx.storyId] = patch;
      const doc: Record<string, unknown> = { ...(baseCore as unknown as Record<string, unknown>) };
      if (Object.keys(newMap).length > 0) doc.storyHarness = newMap;
      const r = await fetch(devApi("/api/save-schema"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, jsonText: JSON.stringify(doc, null, 2) }),
      });
      const b = await r.json().catch(() => ({})) as {
        ok?: boolean;
        fileWritten?: boolean;
        path?: string;
        syncOk?: boolean;
        syncError?: string | null;
        audit?: { passed: boolean; output: string } | null;
        error?: string;
      };
      if (!r.ok) throw new Error(b.error ?? r.statusText);
      if (!b.ok || !b.fileWritten) throw new Error(b.error ?? "未写入磁盘");
      const parts: string[] = [`已写入磁盘：${b.path ?? filename}`];
      if (b.syncOk === false && b.syncError) {
        parts.push(`⚠️ sync:harness 失败（spec 已落盘，请在本机终端手动执行 npm run sync:harness）：\n${b.syncError}`);
      } else if (b.syncOk !== false) {
        parts.push("已执行 sync:harness。");
      }
      if (b.audit && b.audit.passed === false) parts.push(`⚠️ 审计: ${b.audit.output}`);
      const ok = b.syncOk !== false && (b.audit == null || b.audit.passed !== false);
      setStatus({ text: parts.join("\n"), ok });
      await load();
    } catch (e) { setStatus({ text: `保存失败：${String(e)}`, ok: false }); }
  }

  const matched = matchSchemaForTitle(schemas, harnessCtx.leafTitle);

  if (!matched && harnessCtx.leafTitle) {
    return (
      <CreateSchemaPrompt
        leafTitle={harnessCtx.leafTitle}
        onCreated={(fn) => {
          setFilename(fn);
          fetch(devApi("/api/schemas")).then(r => r.json()).then((list: SchemaListItem[]) => setSchemas(list)).catch(() => {});
        }}
      />
    );
  }

  if (loading && !baseCore) {
    return <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)" }}>加载中…</div>;
  }

  if (matched && (!harnessCtx.isStory || !harnessCtx.storyId)) {
    return (
      <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)", gap: 10, padding: 24, textAlign: "center" as const, maxWidth: 360 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--mgr-text-secondary)" }}>{harnessCtx.leafTitle}</div>
        <div>Harness 按 <strong>Story 变体</strong> 编辑：请在左侧树中点开本组件，选择一条具体 Story（非 Docs 总览）。</div>
      </div>
    );
  }

  if (!spec) {
    return <div style={{ ...HS.wrap, alignItems: "center", justifyContent: "center", color: "var(--mgr-text-tertiary)" }}>请在左侧选择一个组件</div>;
  }

  return (
    <div style={HS.wrap}>
      <div style={HS.header}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mgr-text)" }}>{spec.componentName}</div>
          {harnessCtx.storyId ? (
            <div style={{ fontSize: 11, color: "var(--mgr-text-muted)", lineHeight: 1.35 }}>
              当前变体：<span style={{ color: "var(--mgr-text)" }}>{harnessCtx.storyName ?? harnessCtx.storyId}</span>
              <span style={{ fontFamily: "ui-monospace,monospace", color: "var(--mgr-text-tertiary)" }}> · {harnessCtx.storyId}</span>
            </div>
          ) : null}
        </div>
        <span style={{ fontSize: 11, color: "var(--mgr-text-tertiary)", fontFamily: "ui-monospace,monospace" }}>{filename}</span>
        <div style={{ flex: 1 }} />
        <button type="button" style={HS.btn()} onClick={() => void load()}>刷新</button>
        <button type="button" style={HS.btn(true)} onClick={() => void save()}>保存</button>
      </div>

      {status && (
        <div style={{ ...HS.status, background: status.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${status.ok ? "#bbf7d0" : "#fecaca"}`, color: status.ok ? "#166534" : "#991b1b" }}>
          {status.text}
        </div>
      )}

      <div style={HS.body}>
        <CollapsibleSection
          title="Harness 规则（设计师）"
          hint="编辑结果写入当前 Story 变体（storyHarness[storyId]），与组件顶层基准深度合并后进 .cursorrules；与侧栏其他变体互不覆盖。Intent / AI Prompt / 主路径为常用项。"
          defaultOpen={true}
        >
          <div style={HS.field}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={HS.label}>业务意图 Intent</div>
              <InfoTip text="短句、可判定：何时用本组件、禁止什么（建议「若…则必须用 X」）。" />
            </div>
            <textarea
              style={HS.textarea}
              placeholder={'若页内需要主操作，则必须用 BusinessButton；禁止原生 <button>。'}
              value={spec.intent}
              onChange={e => update("intent", e.target.value)}
            />
          </div>
          <div style={HS.field}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={HS.label}>AI Prompt（进 .cursorrules）</div>
              <InfoTip text="给代码助手 / Cursor 的硬约束：import、variant、禁止手写类等。" />
            </div>
            <textarea
              style={{ ...HS.textarea, minHeight: 80 }}
              placeholder={'若危险操作，则必须用 variant="destructive"；禁止散文与模糊词。'}
              value={spec.aiPrompt}
              onChange={e => update("aiPrompt", e.target.value)}
            />
          </div>
          <div style={HS.field}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={HS.label}>主 import 路径（推荐一条）</div>
              <InfoTip text="优先唯一路径，减少模型乱选；多路径在「高级」里编辑完整列表。" />
            </div>
            <input
              style={{ ...HS.input, fontFamily: "ui-monospace,monospace" }}
              placeholder="@/components/business/…"
              value={(spec.referencePriority ?? [])[0] ?? ""}
              onChange={e => {
                const t = e.target.value.trim();
                const tail = (spec.referencePriority ?? []).slice(1);
                update("referencePriority", t ? [t, ...tail] : tail);
              }}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="规则明细：禁止 / 纠错 / Few-shot（建议前端维护）"
          hint="与 harness-audit、.cursorrules 强对齐：原生标签禁止项、违规→修复、示例 JSX。不熟悉可交给前端同学填写。"
          defaultOpen={false}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>禁止项 Forbidden</div>
            <InfoTip text="每条：标签 + 原因 + 请改用；与审计里「不要用某原生标签」一致。" />
          </div>
          {(spec.forbidden ?? []).map((f, i) => (
            <div key={i} style={{ border: "1px solid var(--mgr-border)", borderRadius: 6, padding: 10, marginBottom: 8, background: "var(--mgr-bg-muted)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                <div style={{ flex: "0 0 88px", minWidth: 72 }}>
                  <div style={HS.label}>HTML 标签</div>
                  <input style={{ ...HS.input, fontFamily: "ui-monospace,monospace" }} value={f.htmlTag} onChange={e => {
                    const arr = [...(spec.forbidden ?? [])]; arr[i] = { ...f, htmlTag: e.target.value }; update("forbidden", arr);
                  }} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <div style={HS.label}>原因</div>
                  <input style={HS.input} value={f.reason} onChange={e => {
                    const arr = [...(spec.forbidden ?? [])]; arr[i] = { ...f, reason: e.target.value }; update("forbidden", arr);
                  }} />
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <div style={HS.label}>替代组件</div>
                  <input style={HS.input} value={f.useInstead} onChange={e => {
                    const arr = [...(spec.forbidden ?? [])]; arr[i] = { ...f, useInstead: e.target.value }; update("forbidden", arr);
                  }} />
                </div>
              </div>
              <button type="button" style={{ ...HS.btn(), marginTop: 8, fontSize: 11 }} onClick={() => {
                update("forbidden", (spec.forbidden ?? []).filter((_, j) => j !== i));
              }}>删除此项</button>
            </div>
          ))}
          <button type="button" style={{ ...HS.btn(), fontSize: 12 }} onClick={() => {
            update("forbidden", [...(spec.forbidden ?? []), { htmlTag: "", reason: "", useInstead: "" }]);
          }}>+ 添加禁止项</button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 8 }}>
            <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>纠错 Corrections</div>
            <InfoTip text="违规与改法成对：可判定的违规描述 + 修复指令。" />
          </div>
          {(spec.corrections ?? []).map((c, i) => (
            <div key={i} style={{ border: "1px solid var(--mgr-border)", borderRadius: 6, padding: 10, marginBottom: 8, background: "var(--mgr-bg-muted)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" as const }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <div style={HS.label}>ID</div>
                  <input style={{ ...HS.input, fontFamily: "ui-monospace,monospace", fontSize: 12 }} value={c.id} onChange={e => {
                    const arr = [...(spec.corrections ?? [])]; arr[i] = { ...c, id: e.target.value }; update("corrections", arr);
                  }} />
                </div>
                <div style={{ flex: "1 1 160px" }}>
                  <div style={HS.label}>违规（可判定）</div>
                  <input style={HS.input} value={c.violation} onChange={e => {
                    const arr = [...(spec.corrections ?? [])]; arr[i] = { ...c, violation: e.target.value }; update("corrections", arr);
                  }} />
                </div>
              </div>
              <div style={HS.label}>修复指令</div>
              <input style={HS.input} value={c.fixPrompt} onChange={e => {
                const arr = [...(spec.corrections ?? [])]; arr[i] = { ...c, fixPrompt: e.target.value }; update("corrections", arr);
              }} />
              <button type="button" style={{ ...HS.btn(), marginTop: 8, fontSize: 11 }} onClick={() => {
                update("corrections", (spec.corrections ?? []).filter((_, j) => j !== i));
              }}>删除此项</button>
            </div>
          ))}
          <button type="button" style={{ ...HS.btn(), fontSize: 12 }} onClick={() => {
            update("corrections", [...(spec.corrections ?? []), { id: "", violation: "", fixPrompt: "" }]);
          }}>+ 添加纠错</button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, marginBottom: 8 }}>
            <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>Few-shot 示例</div>
            <InfoTip text="每组件 1～2 条最小 JSX；保存后经 sync 写入 .cursorrules。" />
          </div>
          <ExamplesEditor examples={spec.examples ?? []} onChange={ex => update("examples", ex)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="高级：元数据 · 上游 · Props · 样式锁定 · 完整引用列表"
          hint="组件名、wraps、Props、styleLock、多行 referencePriority；供工程 / 设计系统维护。"
          defaultOpen={false}
        >
          <div style={HS.section}>
            <div style={HS.sectionTitle}>基本信息</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ ...HS.field, flex: 1 }}>
                <div style={HS.label}>组件名称</div>
                <input style={HS.input} value={spec.componentName} onChange={e => update("componentName", e.target.value)} />
              </div>
              <div style={{ ...HS.field, flex: 1 }}>
                <div style={HS.label}>ID</div>
                <input style={HS.input} value={spec.id} onChange={e => update("id", e.target.value)} />
              </div>
              <div style={{ ...HS.field, width: 100, flexShrink: 0 }}>
                <div style={HS.label}>版本</div>
                <input style={HS.input} value={spec.version} onChange={e => update("version", e.target.value as any)} />
              </div>
            </div>
          </div>

          <div style={HS.section}>
            <div style={HS.sectionTitle}>上游封装</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ ...HS.field, flex: 1 }}>
                <div style={HS.label}>模块路径</div>
                <input style={HS.input} value={spec.wraps.module} onChange={e => update("wraps", { ...spec.wraps, module: e.target.value })} />
              </div>
              <div style={{ ...HS.field, flex: 1 }}>
                <div style={HS.label}>Primitives (逗号分隔)</div>
                <input style={HS.input} value={spec.wraps.primitives.join(", ")} onChange={e => update("wraps", { ...spec.wraps, primitives: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </div>
            </div>
          </div>

          <div style={HS.section}>
            <div style={HS.sectionTitle}>必需 Props ({spec.requiredProps.length})</div>
            {spec.requiredProps.map((p, i) => (
              <PropEditor key={`req-${i}`} prop={p} onChange={np => {
                const arr = [...spec.requiredProps]; arr[i] = np; update("requiredProps", arr);
              }} />
            ))}
          </div>

          {spec.optionalProps && spec.optionalProps.length > 0 && (
            <div style={HS.section}>
              <div style={HS.sectionTitle}>可选 Props ({spec.optionalProps.length})</div>
              {spec.optionalProps.map((p, i) => (
                <PropEditor key={`opt-${i}`} prop={p} onChange={np => {
                  const arr = [...(spec.optionalProps ?? [])]; arr[i] = np; update("optionalProps", arr);
                }} />
              ))}
            </div>
          )}

          <div style={HS.section}>
            <div style={HS.sectionTitle}>样式锁定</div>
            <div style={HS.field}>
              <div style={HS.label}>Baseline Tokens (逗号分隔)</div>
              <input style={HS.input} value={spec.styleLock.baselineTokens.join(", ")} onChange={e => update("styleLock", { ...spec.styleLock, baselineTokens: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
            </div>
            <div style={HS.field}>
              <div style={HS.label}>黑名单规则</div>
              <BlacklistEditor rules={spec.styleLock.blacklist} onChange={bl => update("styleLock", { ...spec.styleLock, blacklist: bl })} />
            </div>
          </div>

          <div style={HS.section}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ ...HS.sectionTitle, marginBottom: 0 }}>引用优先（完整列表，每行一条）</div>
              <InfoTip text="首行应与核心区内「主 import」一致；多路径时在此编辑全部，保存后同步 .cursorrules。" />
            </div>
            <textarea
              style={{ ...HS.mono, minHeight: 56 }}
              value={(spec.referencePriority ?? []).join("\n")}
              onChange={e => update("referencePriority", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

/* ── 注册 ── */

addons.setConfig({
  theme: _initDark ? darkTheme : lightTheme,
  sidebar: {
    showRoots: false,
    renderLabel: (item: API_HashEntry, api: API) => {
      if (item.type === "component") {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <EditableLabel item={item} api={api} />
            </div>
            <SidebarKitStatusDot item={item} />
          </div>
        );
      }
      return undefined;
    },
  },
});

addons.register("harness-design", () => {
  addons.add("harness-design/sidebar-top", {
    type: types.experimental_SIDEBAR_TOP,
    render: () => <SidebarTop />,
  });

  addons.add("harness-design/harness-panel", {
    type: types.PANEL,
    title: "Harness",
    render: ({ active }) => active ? <HarnessPanel /> : null,
  });
});
