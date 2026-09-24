"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigBtn = exports.ctrlBtn = exports.fmtPct = exports.fmtNum = exports.fmtMoney = exports.SERIES = exports.UI = exports.C = void 0;
// ============================================================================
// Batch 11A — Tycoon GUI visual language
// Dark navy game chrome + bright content surfaces. The art passes that follow
// can replace logos/product art/campus visuals without changing this shell.
// ============================================================================
exports.C = {
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
exports.UI = {
    radius: { sm: 7, md: 10, lg: 14, xl: 18 },
    shadow: { low: "0 2px 8px rgba(23,37,54,.05)", card: "0 8px 22px rgba(23,37,54,.07)", float: "0 18px 42px rgba(23,37,54,.18)" },
    space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    status: { positive: "#198b68", warning: "#b97913", negative: "#c34d55", info: "#287ba8" },
};
exports.SERIES = ["#168de2", "#e9a11b", "#7d66df", "#12a875", "#e14f5a"];
var fmtMoney = function (v) {
    var a = Math.abs(v), s = v < 0 ? "-" : "";
    if (a >= 1e9)
        return "".concat(s, "$").concat((a / 1e9).toFixed(2), "B");
    if (a >= 1e6)
        return "".concat(s, "$").concat((a / 1e6).toFixed(1), "M");
    if (a >= 1e3)
        return "".concat(s, "$").concat((a / 1e3).toFixed(0), "k");
    return "".concat(s, "$").concat(a.toFixed(0));
};
exports.fmtMoney = fmtMoney;
var fmtNum = function (v) {
    return v >= 1e6 ? (v / 1e6).toFixed(2) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "k" : Math.round(v).toString();
};
exports.fmtNum = fmtNum;
var fmtPct = function (v) { return "".concat((v * 100).toFixed(1), "%"); };
exports.fmtPct = fmtPct;
exports.ctrlBtn = {
    background: "linear-gradient(180deg,#ffffff 0%,#f5f9fd 100%)",
    color: exports.C.ink,
    border: "1px solid ".concat(exports.C.line),
    borderRadius: exports.UI.radius.md,
    padding: "7px 13px",
    fontSize: 12,
    fontWeight: 750,
    cursor: "pointer",
    boxShadow: exports.UI.shadow.low,
    transition: "all 0.15s",
};
exports.bigBtn = {
    background: "linear-gradient(180deg,#249eea 0%,#1179c5 100%)",
    color: "#ffffff",
    border: "1px solid #0f6fae",
    borderRadius: exports.UI.radius.md,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(22,141,226,.22), inset 0 1px 0 rgba(255,255,255,.2)",
    transition: "all 0.15s",
};
