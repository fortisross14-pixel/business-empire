// ============================================================================
// Batch 11A — Tycoon GUI visual language
// Dark navy game chrome + bright content surfaces. The art passes that follow
// can replace logos/product art/campus visuals without changing this shell.
// ============================================================================
export const C = {
  bg: "#eaf0f4",
  panel: "#ffffff",
  panel2: "#f3f6f8",
  line: "#d3dee6",
  ink: "#172536",
  dim: "#5d7181",
  faint: "#8698a6",
  green: "#12a875",
  red: "#e14f5a",
  amber: "#e9a11b",
  cyan: "#1b86bd",
  violet: "#5367c9",
  grid: "#e3e9ed",
  navy: "#0b2847",
  navy2: "#10375f",
  sky: "#5dc5ff",
  gold: "#f2b84b",
};
export const UI = {
  radius: { sm: 7, md: 10, lg: 14, xl: 18 },
  shadow: { low: "0 2px 8px rgba(23,37,54,.05)", card: "0 8px 22px rgba(23,37,54,.07)", float: "0 18px 42px rgba(23,37,54,.18)" },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  status: { positive: "#198b68", warning: "#b97913", negative: "#c34d55", info: "#287ba8" },
};
export const SERIES = ["#168de2", "#e9a11b", "#7d66df", "#12a875", "#e14f5a"];

export const fmtMoney = (v: number) => {
  const a = Math.abs(v), s = v < 0 ? "-" : "";
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}k`;
  return `${s}$${a.toFixed(0)}`;
};
export const fmtNum = (v: number) =>
  v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "k" : Math.round(v).toString();
export const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

export const ctrlBtn: React.CSSProperties = {
  background: "linear-gradient(180deg,#ffffff 0%,#f5f9fd 100%)",
  color: C.ink,
  border: `1px solid ${C.line}`,
  borderRadius: UI.radius.md,
  padding: "7px 13px",
  fontSize: 12,
  fontWeight: 750,
  cursor: "pointer",
  boxShadow: UI.shadow.low,
  transition: "all 0.15s",
};
export const bigBtn: React.CSSProperties = {
  background: "linear-gradient(180deg,#249eea 0%,#1179c5 100%)",
  color: "#ffffff",
  border: "1px solid #0f6fae",
  borderRadius: UI.radius.md,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 5px 14px rgba(22,141,226,.22), inset 0 1px 0 rgba(255,255,255,.2)",
  transition: "all 0.15s",
};
