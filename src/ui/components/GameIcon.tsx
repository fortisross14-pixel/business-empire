import React from "react";

export type GameIconName =
  | "goals" | "products" | "inventory" | "distribution" | "people" | "market" | "competition" | "segments" | "marketing"
  | "finance" | "capital" | "analysis" | "company" | "roadmap" | "research" | "strategy" | "brands" | "businesses" | "ip"
  | "history" | "annual" | "records" | "achievements" | "spark";

const PALETTES: Record<GameIconName, [string, string, string]> = {
  goals: ["#8b5cf6", "#ec4899", "#fbbf24"], products: ["#f97316", "#ec4899", "#fde047"], inventory: ["#0ea5e9", "#6366f1", "#67e8f9"],
  distribution: ["#14b8a6", "#22c55e", "#a3e635"], people: ["#06b6d4", "#3b82f6", "#a78bfa"], market: ["#10b981", "#0ea5e9", "#bef264"],
  competition: ["#ef4444", "#f97316", "#facc15"], segments: ["#8b5cf6", "#06b6d4", "#f0abfc"], marketing: ["#ec4899", "#8b5cf6", "#fb7185"],
  finance: ["#f59e0b", "#eab308", "#fef08a"], capital: ["#0ea5e9", "#4f46e5", "#67e8f9"], analysis: ["#6366f1", "#8b5cf6", "#c4b5fd"],
  company: ["#2563eb", "#4f46e5", "#93c5fd"], roadmap: ["#0ea5e9", "#14b8a6", "#99f6e4"], research: ["#7c3aed", "#db2777", "#c4b5fd"],
  strategy: ["#334155", "#4f46e5", "#94a3b8"], brands: ["#e11d48", "#f97316", "#fda4af"], businesses: ["#0891b2", "#2563eb", "#67e8f9"],
  ip: ["#7c3aed", "#ec4899", "#f0abfc"], history: ["#a855f7", "#6366f1", "#e9d5ff"], annual: ["#0284c7", "#0d9488", "#7dd3fc"],
  records: ["#f59e0b", "#ef4444", "#fde68a"], achievements: ["#eab308", "#8b5cf6", "#fde047"], spark: ["#06b6d4", "#8b5cf6", "#f0abfc"],
};

function Glyph({ name }: { name: GameIconName }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "goals": return <><circle cx="12" cy="12" r="7" {...shared}/><circle cx="12" cy="12" r="3" {...shared}/><path d="M15 9l5-5m-4 0h4v4" {...shared}/></>;
    case "products": return <><path d="M5 8l7-4 7 4-7 4-7-4Z" {...shared}/><path d="M5 8v8l7 4 7-4V8M12 12v8" {...shared}/></>;
    case "inventory": return <><path d="M4 7h16v13H4zM7 4h10l2 3H5l2-3Z" {...shared}/><path d="M9 11h6" {...shared}/></>;
    case "distribution": return <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" {...shared}/><circle cx="7" cy="18" r="2" {...shared}/><circle cx="18" cy="18" r="2" {...shared}/></>;
    case "people": return <><circle cx="9" cy="8" r="3" {...shared}/><circle cx="17" cy="9" r="2.5" {...shared}/><path d="M3 20c.4-5 2.4-7 6-7s5.6 2 6 7M14 14c3.7-.5 6 1.4 7 5" {...shared}/></>;
    case "market": return <><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" {...shared}/><path d="m4 12 5-4 5 2 5-6" {...shared}/></>;
    case "competition": return <><path d="m5 5 14 14M19 5 5 19" {...shared}/><path d="m4 4 4 1-3 3m15-4-4 1 3 3M4 20l4-1-3-3m15 4-4-1 3-3" {...shared}/></>;
    case "segments": return <><circle cx="12" cy="12" r="8" {...shared}/><path d="M12 4v8l6 5M4 12h8" {...shared}/></>;
    case "marketing": return <><path d="m4 11 12-5v12L4 13v-2Z" {...shared}/><path d="M7 14v5h4v-4M19 8l2-2m-2 8 2 2" {...shared}/></>;
    case "finance": return <><circle cx="12" cy="12" r="8" {...shared}/><path d="M15 8.5c-.8-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1 1.8 3 2.2 3 1 3 2.4-1.3 2.4-3.2 2.4c-1.3 0-2.5-.4-3.3-1.2M12 5.5v13" {...shared}/></>;
    case "capital": return <><path d="M4 9 12 4l8 5M5 10h14M6 10v7m4-7v7m4-7v7m4-7v7M4 20h16" {...shared}/></>;
    case "analysis": return <><path d="M4 19h16M6 16l4-5 3 2 5-7" {...shared}/><circle cx="6" cy="16" r="1" fill="currentColor"/><circle cx="10" cy="11" r="1" fill="currentColor"/><circle cx="13" cy="13" r="1" fill="currentColor"/><circle cx="18" cy="6" r="1" fill="currentColor"/></>;
    case "company": case "businesses": return <><path d="M5 20V7h9v13M14 11h5v9M8 10h2m-2 3h2m-2 3h2m9-2h-2m2 3h-2M3 20h18" {...shared}/></>;
    case "roadmap": return <><circle cx="6" cy="18" r="2" {...shared}/><circle cx="18" cy="6" r="2" {...shared}/><path d="M8 18h2c2 0 2-3 4-3h2c2 0 2-3 2-7M5 5h6v5H5z" {...shared}/></>;
    case "research": return <><path d="M9 4h6M10 4v5l-5 9c-.5 1 .2 2 1.4 2h11.2c1.2 0 1.9-1 1.4-2l-5-9V4" {...shared}/><path d="M8 15h8M9.5 12h5" {...shared}/></>;
    case "strategy": return <><circle cx="12" cy="12" r="8" {...shared}/><path d="M12 7v5l4 2M5 5l2 2m12-2-2 2" {...shared}/></>;
    case "brands": return <><path d="M4 6h9l7 7-7 7-9-9V6Z" {...shared}/><circle cx="8.5" cy="10.5" r="1.5" {...shared}/></>;
    case "ip": return <><rect x="5" y="5" width="14" height="14" rx="3" {...shared}/><path d="m10 9 5 3-5 3V9Z" {...shared}/><path d="M8 3v2m8-2v2M8 19v2m8-2v2" {...shared}/></>;
    case "history": return <><path d="M5 5v5h5M6 10a7 7 0 1 1 1 7" {...shared}/><path d="M12 8v5l3 2" {...shared}/></>;
    case "annual": return <><rect x="4" y="6" width="16" height="14" rx="2" {...shared}/><path d="M8 3v6m8-6v6M4 10h16M8 14h2m3 0h3m-8 3h3" {...shared}/></>;
    case "records": case "achievements": return <><path d="M8 4h8v5c0 3-1.8 5-4 5s-4-2-4-5V4Z" {...shared}/><path d="M8 6H5v2c0 2 1 3 4 3m7-5h3v2c0 2-1 3-4 3M12 14v4m-4 2h8" {...shared}/></>;
    default: return <path d="m12 3 2.1 6.2L21 12l-6.9 2.8L12 21l-2.1-6.2L3 12l6.9-2.8L12 3Z" {...shared}/>;
  }
}

export function GameIcon({ name, size = 34, active = false, compact = false }: { name: GameIconName; size?: number; active?: boolean; compact?: boolean }) {
  const palette = PALETTES[name] ?? PALETTES.spark;
  const radius = compact ? Math.max(7, size * .27) : Math.max(9, size * .3);
  return <span className={`game-icon ${active ? "active" : ""}`} style={{
    width: size, height: size, borderRadius: radius, display: "inline-grid", placeItems: "center", flex: "0 0 auto", color: "white",
    background: `linear-gradient(145deg,${palette[0]},${palette[1]})`, boxShadow: active ? `0 0 0 2px rgba(255,255,255,.32),0 7px 18px ${palette[1]}66` : `0 5px 13px ${palette[1]}45`,
    border: "1px solid rgba(255,255,255,.28)", position: "relative", overflow: "hidden",
  }}>
    <svg aria-hidden="true" viewBox="0 0 24 24" width={compact ? size * .62 : size * .58} height={compact ? size * .62 : size * .58} style={{ position: "relative", zIndex: 1, color: palette[2], filter: "drop-shadow(0 1px 1px rgba(0,0,0,.18))" }}><Glyph name={name}/></svg>
    <span aria-hidden="true" style={{ position: "absolute", width: "70%", height: "70%", left: "-18%", top: "-28%", borderRadius: 999, background: "rgba(255,255,255,.28)", filter: "blur(5px)" }} />
  </span>;
}
