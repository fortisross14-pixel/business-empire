import React, { useState } from "react";
import type { ResearchNodeId, World } from "../../engine/types";
import { Panel } from "../components";
import { C, ctrlBtn, fmtMoney } from "../theme";
import { RESEARCH_NODES, canStartResearch, hasResearch, hasSeatedCIO, researchDef, researchRate } from "../../engine/research";
import { INDUSTRIES } from "../../engine/industries";
import { canStartCategoryExpansion, categoryExpansionSpeed, categoryGrowthDef } from "../../engine/growth";
import { teamEffectiveness } from "../../engine/people";
import { productCenterLevel, productCenterTypeForIndustry, researchCenterLevel, roomSupportsProductDesign } from "../../engine/infrastructure";

export function ResearchView({ world, startResearch, startCategoryExpansion }: {
  world: World;
  startResearch: (id: ResearchNodeId) => { ok: boolean; reason: string };
  startCategoryExpansion: (productKey: string) => boolean;
}) {
  const active = world.player.research.active;
  const rate = researchRate(world);
  const hasCio = hasSeatedCIO(world);
  const branches = ["Product","Organization","Operations","Market"] as const;
  type Branch = typeof branches[number];
  const [activeBranch, setActiveBranch] = useState<Branch>(() => {
    const current = active ? RESEARCH_NODES.find((n)=>n.id===active.nodeId)?.branch : undefined;
    return (current && branches.includes(current as Branch) ? current : "Product") as Branch;
  });
  const [showGates, setShowGates] = useState(false);
  const categoryRate = categoryExpansionSpeed(world);
  const primaryIndustry = world.industryId;
  const aaWorkspaceReady = world.player.operatingRooms.some((r) => roomSupportsProductDesign(r, primaryIndustry) && r.capacity >= 8);
  const specializedCenter = productCenterTypeForIndustry(primaryIndustry);
  const aaaWorkspaceReady = specializedCenter ? productCenterLevel(world, primaryIndustry) >= 2 : world.player.operatingRooms.some((r) => roomSupportsProductDesign(r, primaryIndustry) && r.capacity >= 16);
  const aaaInfrastructureReady = researchCenterLevel(world) >= 2 && aaaWorkspaceReady;
  const branchNodes=RESEARCH_NODES.filter((n)=>n.branch===activeBranch);
  const recommended=branchNodes.find((n)=>!hasResearch(world,n.id)&&canStartResearch(world,n.id).ok);
  return <div className="research-playset" style={{display:"grid",gap:14}}>
    <style>{researchCss}</style>
    <section className="research-hero">
      <div className="research-orb" aria-hidden="true"><span>⚗️</span><i/><i/><i/></div>
      <div className="research-hero-copy"><div className="research-kicker">CAPABILITY LAB</div><h2>Turn knowledge into an advantage</h2><p>Choose the capabilities that match your strategy. Every breakthrough unlocks new products, stronger teams or more control over operations.</p></div>
      <div className="research-score"><small>CAPABILITIES</small><b>{world.player.research.completed.length}<span> / {RESEARCH_NODES.length}</span></b><em>{rate.toFixed(1)} development pts/day</em></div>
    </section>
    <Panel title="🔬 Company Development">
      <div style={{color:C.dim,fontSize:12.5,lineHeight:1.6}}>Capabilities unlock what the company is actually able to coordinate. Research is owned by a Chief Innovation Officer seated in a Research Center; Product, Strategy and Operations teams can support the work, but the program needs both the facility and its owner.</div>
      <div className={`research-status ${hasCio?"ready":"locked"}`} style={{marginTop:12,padding:13,border:`1px solid ${hasCio?"#bbf7d0":"#fed7aa"}`,background:hasCio?"#f0fdf4":"#fff7ed",borderRadius:11,fontSize:12.5,color:hasCio?C.green:C.amber,fontWeight:700}}><span>{hasCio?"✓":"!"}</span><div><b>{hasCio?"Research capability online":"Research needs an owner and a home"}</b><p>{hasCio?"Your Chief Innovation Officer is seated in the Research Center.":"Build a Research Center on the campus, then hire and assign a Chief Innovation Officer to it."}</p></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginTop:12}}>
        <Metric label="Development rate" value={`${rate.toFixed(1)} pts/day`} />
        <Metric label="Capabilities completed" value={`${world.player.research.completed.length}/${RESEARCH_NODES.length}`} />
        <Metric label="Lifetime development" value={`${Math.round(world.player.research.lifetimePoints).toLocaleString()} pts`} />
      </div>
      {active ? <div style={{marginTop:12,padding:12,border:`1px solid ${C.cyan}`,borderRadius:10,background:"#effbff"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{researchDef(active.nodeId).title}</b><span style={{color:C.cyan,fontWeight:800}}>{Math.round(active.progress/active.requiredPoints*100)}%</span></div>
        <div style={{height:7,background:C.grid,borderRadius:99,marginTop:8}}><div style={{width:`${Math.min(100,active.progress/active.requiredPoints*100)}%`,height:"100%",background:C.cyan,borderRadius:99}}/></div>
        <div style={{color:rate>0?C.dim:C.amber,fontSize:10.5,marginTop:6}}>{rate>0?`${Math.ceil(Math.max(0,active.requiredPoints-active.progress)/rate)} days estimated · ${Math.round(active.progress)}/${active.requiredPoints} points`:`Paused — assign a Chief Innovation Officer to the Research Center to resume.`}</div>
      </div> : <div style={{color:C.faint,fontSize:11,marginTop:10}}>No capability project is active. Choose one below.</div>}
    </Panel>

    <Panel title="🔐 Capability Requirements">
      <div className="gate-summary"><div><b>Why is an action locked?</b><p>Knowledge, the right people and physical capacity work together. Open the checklist when you need to diagnose a blocked action.</p></div><button className="gate-toggle" style={ctrlBtn} onClick={()=>setShowGates((v)=>!v)}>{showGates?"Hide checklist":"Show readiness checklist"}</button></div>
      {showGates && <div className="gate-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:9,marginTop:12}}>
        {[
          ["Corporate research", hasCio, "Seated Chief Innovation Officer"],
          ["AA products", hasResearch(world,"advanced_product_development") && aaWorkspaceReady, "Advanced Product Development + an 8-seat product-capable workspace + Lead/Designer team"],
          ["AAA products", hasResearch(world,"flagship_product_development") && aaaInfrastructureReady, specializedCenter ? "Flagship Product Development + Research Center II + industry Design Center II + Lead + 3 Designers" : "Flagship Product Development + Research Center II + 16-seat product workspace + Lead + 3 Designers"],
          ["Owned manufacturing", hasResearch(world,"owned_manufacturing") && teamEffectiveness(world,"operations")>0, "Owned Manufacturing + seated Operations specialist + compatible Factory"],
          ["Specialized storage", hasResearch(world,"specialized_storage") && teamEffectiveness(world,"operations")>0, "Specialized Storage + Operations specialist + warehouse module"],
          ["Advanced market intelligence", hasResearch(world,"market_intelligence") && teamEffectiveness(world,"strategy")>0, "Market Intelligence + seated Strategy specialist"],
        ].map(([label,ok,need])=><div className={`gate-card ${ok?"ready":""}`} key={String(label)} style={{border:`1px solid ${ok?"#bbf7d0":C.line}`,background:ok?"#f0fdf4":C.bg,borderRadius:11,padding:12}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{fontSize:12.5}}>{label as string}</b><span style={{color:ok?C.green:C.faint,fontWeight:900,fontSize:11}}>{ok?"READY":"GATED"}</span></div><div style={{color:C.faint,fontSize:12,marginTop:5,lineHeight:1.45}}>{need as string}</div></div>)}
      </div>}
    </Panel>

    <section className="research-tree-shell">
      <div className="research-branch-tabs" role="tablist" aria-label="Research branches">{branches.map((branch)=>{const nodes=RESEARCH_NODES.filter((n)=>n.branch===branch);const completed=nodes.filter((n)=>hasResearch(world,n.id)).length;return <button role="tab" aria-selected={activeBranch===branch} className={activeBranch===branch?"active":""} key={branch} onClick={()=>setActiveBranch(branch)}><span>{branchIcon(branch)}</span><div><b>{branch}</b><small>{completed}/{nodes.length} complete</small></div></button>})}</div>
      <div className="research-branch-head"><div><div className="research-kicker">{branchIcon(activeBranch)} {activeBranch.toUpperCase()} BRANCH</div><h2>{activeBranch} capabilities</h2><p>{branchDescription(activeBranch)}</p></div>{recommended&&<div className="recommended-node"><small>RECOMMENDED NEXT</small><b>{recommended.title}</b><span>{fmtMoney(recommended.cost)} · {recommended.points} pts</span></div>}</div>
      <div className="research-node-grid">
        {branchNodes.map((node,index) => {
          const done=hasResearch(world,node.id); const check=canStartResearch(world,node.id);
          const state=done?"complete":active?.nodeId===node.id?"active":check.ok?"available":"locked";
          return <div className={`research-node ${state}`} key={node.id}>
            <div className="node-top"><span className="node-medallion">{done?"✓":active?.nodeId===node.id?"⚡":check.ok?branchIcon(activeBranch):"🔒"}</span><span className="node-step">STEP {index+1}</span><span className="node-state">{done?"COMPLETE":active?.nodeId===node.id?"RESEARCHING":check.ok?"AVAILABLE":"LOCKED"}</span></div>
            <b className="node-title">{node.title}</b>
            <div className="node-description">{node.description}</div>
            <div className="node-unlock"><small>UNLOCKS</small><span>{node.unlock}</span></div>
            <div className="node-cost">{fmtMoney(node.cost)} setup <i/> {node.points} development pts</div>
            {node.prereq.length>0&&<div className="node-prereq">Requires {node.prereq.map(id=>researchDef(id).title).join(" + ")}</div>}
            {active?.nodeId===node.id&&<div className="node-active-progress"><div><i style={{width:`${Math.min(100,active.progress/active.requiredPoints*100)}%`}}/></div><span>{Math.round(active.progress/active.requiredPoints*100)}% complete</span></div>}
            {!done && active?.nodeId!==node.id && <><button disabled={!check.ok} title={!check.ok?check.reason:undefined} onClick={()=>startResearch(node.id)} style={{...ctrlBtn,width:"100%",marginTop:12,opacity:check.ok?1:.58}}>{check.ok?"Start research":"Locked"}</button>{!check.ok && <div className="node-reason">↳ {check.reason}</div>}</>}
          </div>
        })}
      </div>
    </section>

    <Panel title="🧪 Product Category Development">
      <div style={{color:C.dim,fontSize:12,lineHeight:1.5,marginBottom:10}}>Category expansion now lives here rather than inside Brands. A brand can only design categories the underlying business has learned to compete in.</div>
      {Object.values(world.player.businesses ?? {}).filter((b): b is NonNullable<typeof b> => Boolean(b && b.status==="active")).map(b => {
        const cfg=INDUSTRIES[b.industryId]; if(!cfg) return null;
        return <div key={b.industryId} style={{marginBottom:14}}><b style={{fontSize:12}}>{cfg.label}</b><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8,marginTop:7}}>{cfg.products.map(pt=>{
          const unlocked=b.unlockedCategories.includes(pt.key); const project=b.categoryExpansionProjects.find(p=>p.productKey===pt.key); const def=categoryGrowthDef(world,pt.key); const check=!unlocked&&!project?canStartCategoryExpansion(world,pt.key):null;
          return <div className={`category-node ${unlocked?"ready":project?"active":""}`} key={pt.key} style={{border:`1px solid ${unlocked?"#bbf7d0":project?C.cyan:C.line}`,borderRadius:11,padding:13,background:C.bg}}><div style={{display:"flex",justifyContent:"space-between",gap:6}}><b style={{fontSize:13}}>{pt.label}</b><span style={{fontSize:11,color:unlocked?C.green:project?C.cyan:C.faint,fontWeight:800}}>{unlocked?"READY":project?"DEVELOPING":"LOCKED"}</span></div>{project?<><div style={{height:7,background:C.grid,borderRadius:9,marginTop:10}}><div style={{width:`${(1-project.daysLeft/project.totalDays)*100}%`,height:"100%",background:C.cyan,borderRadius:9}}/></div><div style={{fontSize:12,color:categoryRate>0?C.dim:C.amber,marginTop:6}}>{categoryRate>0?`${Math.ceil(project.daysLeft/categoryRate)}d estimated`:`Paused — seat both CIO and Product staff to resume.`}</div></>:!unlocked&&def?<><div style={{fontSize:12,color:C.dim,marginTop:7,lineHeight:1.45}}>{def.blurb}</div><button disabled={!check?.ok} onClick={()=>startCategoryExpansion(pt.key)} style={{...ctrlBtn,width:"100%",marginTop:9,opacity:check?.ok?1:.5}}>Develop · {fmtMoney(def.investment)} · {def.days}d</button>{check&&!check.ok&&<div style={{color:C.amber,fontSize:12,marginTop:5}}>↳ {check.reason}</div>}</>:<div style={{fontSize:12,color:C.dim,marginTop:7}}>Available for product design.</div>}</div>
        })}</div></div>
      })}
    </Panel>
  </div>
}
function Metric({label,value}:{label:string;value:string}) { return <div style={{padding:10,border:`1px solid ${C.line}`,borderRadius:9,background:C.bg}}><small style={{color:C.faint}}>{label}</small><div style={{fontWeight:800,fontSize:14,marginTop:3}}>{value}</div></div> }

function branchIcon(branch:"Product"|"Organization"|"Operations"|"Market") { return branch==="Product"?"📦":branch==="Organization"?"👥":branch==="Operations"?"⚙️":"📈"; }
function branchDescription(branch:"Product"|"Organization"|"Operations"|"Market") { return branch==="Product"?"Create more ambitious products and move from competent releases to category-defining flagships.":branch==="Organization"?"Build the recruiting, leadership and talent systems that let the company scale.":branch==="Operations"?"Gain control over manufacturing, storage and the reliability of your supply chain.":"Understand buyers, competitors and channels before committing serious capital."; }

const researchCss=`
.research-playset{--research-shadow:0 14px 34px rgba(13,48,79,.11)}.research-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:110px minmax(280px,1fr) auto;gap:20px;align-items:center;padding:22px 24px;border-radius:18px;color:white;background:radial-gradient(circle at 12% 20%,rgba(97,225,255,.34),transparent 25%),radial-gradient(circle at 88% 80%,rgba(187,132,255,.32),transparent 28%),linear-gradient(135deg,#092f55,#145f8b 55%,#5444a0);box-shadow:0 17px 40px rgba(6,31,57,.25)}.research-orb{position:relative;width:88px;height:88px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.5);border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff,#a7e9ff 32%,#7d67d6 74%,#162f68);box-shadow:0 0 0 9px rgba(126,219,255,.08),0 13px 28px rgba(3,21,43,.38)}.research-orb span{font-size:38px;filter:drop-shadow(0 4px 5px rgba(0,0,0,.2))}.research-orb i{position:absolute;width:12px;height:12px;border-radius:50%;background:#f6d365;box-shadow:0 0 12px #f6d365}.research-orb i:nth-of-type(1){top:3px;right:4px}.research-orb i:nth-of-type(2){bottom:8px;left:-2px;width:8px;height:8px}.research-orb i:nth-of-type(3){bottom:-2px;right:13px;width:6px;height:6px}.research-kicker{font-size:11px;font-weight:950;letter-spacing:1.25px;color:#9de7ff}.research-hero h2{font-size:25px;line-height:1.12;margin:5px 0 6px}.research-hero p{font-size:13px;line-height:1.55;color:#d8edf8;margin:0;max-width:680px}.research-score{min-width:170px;padding:13px 15px;border:1px solid rgba(255,255,255,.2);border-radius:14px;background:rgba(4,25,51,.28)}.research-score small{display:block;color:#a4e7ff;font-size:10px;font-weight:900;letter-spacing:.8px}.research-score b{display:block;font-size:30px;margin-top:2px}.research-score b span{font-size:17px;color:#bcd7e8}.research-score em{display:block;font-size:11px;color:#d9eaf4;font-style:normal}.research-status{display:flex;align-items:center;gap:10px}.research-status>span{display:grid;place-items:center;flex:0 0 auto;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.7);font-size:18px}.research-status b{display:block;font-size:13px}.research-status p{font-size:12px;font-weight:500;margin:2px 0 0;color:inherit}.gate-summary{display:flex;justify-content:space-between;gap:14px;align-items:center}.gate-summary b{font-size:14px}.gate-summary p{font-size:12.5px;line-height:1.5;color:${C.dim};margin:3px 0 0}.gate-toggle{flex:0 0 auto}.research-tree-shell{overflow:hidden;border:1px solid ${C.line};border-radius:17px;background:linear-gradient(180deg,#f7fbff,#eef5fb);box-shadow:var(--research-shadow)}.research-branch-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px;background:#dfeaf3;border-bottom:1px solid ${C.line}}.research-branch-tabs button{min-height:58px;display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid transparent;border-radius:12px;background:transparent;color:${C.dim};text-align:left;cursor:pointer;transition:.16s ease}.research-branch-tabs button:hover{background:rgba(255,255,255,.65)}.research-branch-tabs button.active{color:white;border-color:#6b9fd2;background:linear-gradient(135deg,#176fa9,#5845a8);box-shadow:0 7px 17px rgba(38,71,139,.24)}.research-branch-tabs button>span{font-size:22px}.research-branch-tabs b{display:block;font-size:13px}.research-branch-tabs small{display:block;font-size:10px;margin-top:2px;opacity:.8}.research-branch-head{display:flex;justify-content:space-between;align-items:end;gap:20px;padding:18px 20px 14px}.research-branch-head .research-kicker{color:${C.cyan}}.research-branch-head h2{font-size:22px;margin:4px 0}.research-branch-head p{font-size:13px;line-height:1.5;color:${C.dim};margin:0;max-width:700px}.recommended-node{min-width:200px;padding:10px 12px;border:1px solid #f0cf73;border-radius:11px;background:linear-gradient(145deg,#fffdf4,#fff2c7)}.recommended-node small{display:block;font-size:9px;font-weight:900;color:#94630c}.recommended-node b{display:block;font-size:12.5px;margin:3px 0}.recommended-node span{font-size:11px;color:${C.dim}}.research-node-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:11px;padding:0 20px 20px}.research-node{position:relative;display:flex;flex-direction:column;min-height:260px;padding:15px;border:1px solid ${C.line};border-radius:14px;background:white;box-shadow:0 6px 16px rgba(17,51,78,.055);transition:transform .17s ease,box-shadow .17s ease,border-color .17s ease}.research-node:hover{transform:translateY(-3px);box-shadow:0 13px 27px rgba(17,58,91,.11)}.research-node.complete{border-color:#93d8b7;background:linear-gradient(155deg,#fff,#effdf5)}.research-node.active{border-color:#65bfe8;background:linear-gradient(155deg,#fff,#ecf9ff);box-shadow:0 10px 25px rgba(26,139,194,.14)}.research-node.locked{background:#f4f7fa}.node-top{display:flex;align-items:center;gap:7px}.node-medallion{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;color:white;background:linear-gradient(145deg,#2097d2,#6953bd);box-shadow:0 6px 13px rgba(44,71,147,.2);font-size:17px}.complete .node-medallion{background:linear-gradient(145deg,#24ad79,#16885f)}.locked .node-medallion{color:${C.faint};background:#e4eaf0;box-shadow:none}.node-step{font-size:9px;font-weight:900;color:${C.faint};letter-spacing:.7px}.node-state{margin-left:auto;font-size:9px;font-weight:900;color:${C.faint}}.available .node-state{color:${C.violet}}.active .node-state{color:${C.cyan}}.complete .node-state{color:${C.green}}.node-title{font-size:15px;margin-top:13px;color:${C.ink}}.node-description{font-size:12.5px;line-height:1.5;color:${C.dim};margin-top:6px}.node-unlock{margin-top:10px;padding:9px;border-radius:9px;background:#f1efff}.node-unlock small{display:block;font-size:9px;font-weight:900;letter-spacing:.7px;color:${C.violet}}.node-unlock span{display:block;font-size:12px;line-height:1.4;margin-top:2px;color:${C.ink}}.node-cost{display:flex;align-items:center;gap:6px;margin-top:9px;font-size:11.5px;color:${C.dim}}.node-cost i{width:3px;height:3px;border-radius:50%;background:${C.faint}}.node-prereq,.node-reason{font-size:11.5px;line-height:1.4;color:${C.amber};margin-top:6px}.research-node button{min-height:44px;margin-top:auto!important}.node-active-progress{margin-top:auto;padding-top:12px}.node-active-progress>div{height:7px;border-radius:99px;background:${C.grid};overflow:hidden}.node-active-progress i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,${C.cyan},${C.violet})}.node-active-progress span{display:block;font-size:11.5px;color:${C.cyan};font-weight:800;margin-top:5px}.category-node{transition:transform .16s ease,box-shadow .16s ease}.category-node:hover{transform:translateY(-2px);box-shadow:0 9px 20px rgba(18,58,90,.09)}.category-node button,.research-playset button{min-height:44px}.research-playset button:active{transform:scale(.98)}.research-playset button:focus-visible{outline:3px solid rgba(35,161,225,.34);outline-offset:2px}.research-playset [style*="font-size:9"],.research-playset [style*="font-size:10"],.research-playset [style*="font-size:11"]{font-size:12px!important}
.research-playset [style*="font-size: 9"],.research-playset [style*="font-size: 10"],.research-playset [style*="font-size: 11"]{font-size:12px!important}
@media(max-width:840px){.research-hero{grid-template-columns:90px 1fr}.research-score{grid-column:1/-1;display:flex;align-items:center;gap:15px}.research-score small,.research-score b,.research-score em{display:inline}.research-branch-tabs{grid-template-columns:repeat(2,1fr)}.research-branch-head{align-items:start;flex-direction:column}.recommended-node{min-width:0;width:100%;box-sizing:border-box}}
@media(max-width:560px){.research-hero{grid-template-columns:1fr;padding:18px}.research-orb{display:none}.research-hero h2{font-size:21px}.research-score{display:grid;grid-template-columns:1fr auto}.research-score em{grid-column:1/-1}.research-branch-tabs{display:flex;overflow-x:auto}.research-branch-tabs button{flex:0 0 145px}.research-branch-head{padding:15px 14px 12px}.research-node-grid{grid-template-columns:1fr;padding:0 12px 14px}.gate-summary{align-items:stretch;flex-direction:column}.gate-toggle{width:100%}}
`;
