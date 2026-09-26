import React from "react";
import { Game } from "./ui/Game";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
  constructor(p: { children: React.ReactNode }) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <main className="be-crash-screen">
          <style>{`
            .be-crash-screen{min-height:100dvh;display:grid;place-items:center;padding:22px;color:#f7fbff;background:linear-gradient(135deg,rgba(4,37,63,.93),rgba(8,91,122,.88)),url('/assets/ui/backgrounds/campus-main-menu.png') center/cover;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.be-crash-card{width:min(680px,100%);overflow:hidden;border:1px solid rgba(255,255,255,.34);border-radius:24px;background:#fff;color:#173d51;box-shadow:0 28px 80px rgba(1,22,38,.42)}.be-crash-hero{display:flex;align-items:center;gap:17px;padding:23px;background:linear-gradient(105deg,#fff1dd,#edf9ff)}.be-crash-icon{width:74px;height:74px;display:grid;place-items:center;flex:0 0 auto;border-radius:21px;background:linear-gradient(145deg,#ffcf56,#ff744a);box-shadow:0 7px 0 #a43f29;font-size:38px;transform:rotate(-3deg)}.be-crash-kicker{color:#be5038;font-size:12px;font-weight:950;letter-spacing:1.3px;text-transform:uppercase}.be-crash-hero h1{margin:4px 0;font-size:clamp(25px,5vw,36px);line-height:1.05}.be-crash-hero p{margin:5px 0 0;color:#607985;font-size:14px;line-height:1.45}.be-crash-body{padding:21px}.be-crash-advice{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}.be-crash-advice>div{padding:13px;border:1px solid #d6e5ec;border-radius:13px;background:#f7fbfd}.be-crash-advice b{display:block;font-size:14px}.be-crash-advice span{display:block;margin-top:3px;color:#637b87;font-size:12px;line-height:1.4}.be-crash-actions{display:flex;gap:10px}.be-crash-actions button{min-height:48px;padding:10px 18px;border-radius:13px;font-size:14px;font-weight:950;cursor:pointer}.be-crash-retry{border:0;background:linear-gradient(180deg,#2bc1ee,#0877cb);color:#fff;box-shadow:0 5px 0 #075492}.be-crash-retry:active{transform:translateY(3px);box-shadow:0 2px 0 #075492}.be-crash-actions button:focus-visible,.be-crash-detail summary:focus-visible{outline:4px solid #ffd34e;outline-offset:3px}.be-crash-detail{margin-top:17px;border-top:1px solid #dbe8ee;padding-top:14px}.be-crash-detail summary{min-height:44px;display:flex;align-items:center;color:#58727f;font-size:13px;font-weight:900;cursor:pointer}.be-crash-detail pre{max-height:210px;overflow:auto;padding:12px;border-radius:11px;background:#102f43;color:#c9efff;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.be-crash-code{margin-left:auto;padding:7px 10px;border-radius:999px;background:#fff0ed;color:#a84837;font-size:12px;font-weight:900}
            @media(max-width:540px){.be-crash-screen{padding:10px}.be-crash-card{border-radius:18px}.be-crash-hero{align-items:flex-start;padding:17px}.be-crash-icon{width:58px;height:58px;border-radius:17px;font-size:30px}.be-crash-advice{grid-template-columns:1fr}.be-crash-body{padding:16px}.be-crash-actions{display:block}.be-crash-actions button{width:100%;font-size:16px}}
          `}</style>
          <section className="be-crash-card" role="alert"><header className="be-crash-hero"><div className="be-crash-icon" aria-hidden="true">🛠️</div><div><div className="be-crash-kicker">Campus interruption</div><h1>The company hit an unexpected problem</h1><p>Your saved company should still be safe. Reload the game to return to the latest saved point.</p></div></header><div className="be-crash-body"><div className="be-crash-advice"><div><b>First, reload the game</b><span>This resolves most temporary interruptions.</span></div><div><b>If it happens again</b><span>Open the technical details and include them in a bug report.</span></div></div><div className="be-crash-actions"><button className="be-crash-retry" onClick={()=>window.location.reload()}>Reload Business Empire</button></div><details className="be-crash-detail"><summary>Show technical details <span className="be-crash-code">Error report</span></summary><pre>{String(this.state.err.stack || this.state.err)}</pre></details></div></section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return <ErrorBoundary><Game /></ErrorBoundary>;
}
