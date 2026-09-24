"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_1 = require("react");
var Game_1 = require("./ui/Game");
var theme_1 = require("./ui/theme");
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary(p) {
        var _this = _super.call(this, p) || this;
        _this.state = { err: null };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (err) { return { err: err }; };
    ErrorBoundary.prototype.render = function () {
        if (this.state.err) {
            return (<div style={{ minHeight: "100vh", background: theme_1.C.bg, color: theme_1.C.ink, padding: 30, fontFamily: "ui-monospace, monospace" }}>
          <h2 style={{ color: theme_1.C.red }}>Runtime error</h2>
          <pre style={{ color: theme_1.C.amber, fontSize: 12, whiteSpace: "pre-wrap" }}>{String(this.state.err.stack || this.state.err)}</pre>
        </div>);
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(react_1.default.Component));
function App() {
    return <ErrorBoundary><Game_1.Game /></ErrorBoundary>;
}
