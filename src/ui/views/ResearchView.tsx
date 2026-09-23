import React from "react";
import type { ResearchNodeId, World } from "../../engine/types";
import { Panel } from "../components";
import { C, ctrlBtn, fmtMoney } from "../theme";
import { RESEARCH_NODES, canStartResearch, hasResearch, hasSeatedCIO, researchDef, researchRate } from "../../engine/research";
import { INDUSTRIES } from "../../engine/industries";
import { canStartCategoryExpansion, categoryExpansionSpeed, categoryGrowthDef } from "../../engine/growth";
import { teamEffectiveness } from "../../engine/people";

export function ResearchView({ world, startResearch, startCategoryExpansion }: {
  world: World;
  startResearch: (id: ResearchNodeId) => { ok: boolean; reason: string };
  startCategoryExpansion: (productKey: string) => boolean;
}) {
  const active = world.player.research.active;
  const rate = researchRate(world);
  const hasCio = hasSeatedCIO(world);
  const branches = ["Product","Organization","Operations","Market"] as const;
  const categoryRate = categoryExpansionSpeed(world);
  return <div style={{display:"grid",gap:14}}>
    <Panel title="🔬 Company Development">
      <div style={{color:C.dim,fontSize:12.5,lineHeight:1.6}}>Capabilities unlock what the company is actually able to coordinate. Research is owned by a seated Chief Innovation Officer; Product, Strategy and Operations teams can support the work, but no CIO means no corporate research progress.</div>
      <div style={{marginTop:10,padding:10,border:`1px solid ${hasCio?"#bbf7d0":"#fed7aa"}`,background:hasCio?"#f0fdf4":"#fff7ed",borderRadius:9,fontSize:10.5,color:hasCio?C.green:C.amber,fontWeight:700}}>{hasCio?"✓ Chief Innovation Officer seated — research capability online.":"! Research locked — hire a Chief Innovation Officer and assign them to an office seat."}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginTop:12}}>
        <Metric label="Development rate" value={`${rate.toFixed(1)} pts/day`} />
        <Metric label="Capabilities completed" value={`${world.player.research.completed.length}/${RESEARCH_NODES.length}`} />
        <Metric label="Lifetime development" value={`${Math.round(world.player.research.lifetimePoints).toLocaleString()} pts`} />
      </div>
      {active ? <div style={{marginTop:12,padding:12,border:`1px solid ${C.cyan}`,borderRadius:10,background:"#effbff"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{researchDef(active.nodeId).title}</b><span style={{color:C.cyan,fontWeight:800}}>{Math.round(active.progress/active.requiredPoints*100)}%</span></div>
        <div style={{height:7,background:C.grid,borderRadius:99,marginTop:8}}><div style={{width:`${Math.min(100,active.progress/active.requiredPoints*100)}%`,height:"100%",background:C.cyan,borderRadius:99}}/></div>
        <div style={{color:rate>0?C.dim:C.amber,fontSize:10.5,marginTop:6}}>{rate>0?`${Math.ceil(Math.max(0,active.requiredPoints-active.progress)/rate)} days estimated · ${Math.round(active.progress)}/${active.requiredPoints} points`:`Paused — assign a Chief Innovation Officer to an office seat to resume.`}</div>
      </div> : <div style={{color:C.faint,fontSize:11,marginTop:10}}>No capability project is active. Choose one below.</div>}
    </Panel>

    <Panel title="🔐 Capability Gate Map">
      <div style={{color:C.dim,fontSize:11.5,lineHeight:1.5,marginBottom:9}}>Business Empire uses explicit gates: knowledge tells the company <i>how</i> to do something, people operate it, and physical infrastructure provides capacity. A locked action should always point to the missing piece.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:7}}>
        {[
          ["Corporate research", hasCio, "Seated Chief Innovation Officer"],
          ["AA products", hasResearch(world,"advanced_product_development") && Math.max(0,...world.player.operatingRooms.filter(r=>r.kind==="office").map(r=>r.capacity))>=8, "Advanced Product Development + 8-seat office + Lead/Designer team"],
          ["AAA products", hasResearch(world,"flagship_product_development") && Math.max(0,...world.player.operatingRooms.filter(r=>r.kind==="office").map(r=>r.capacity))>=16, "Flagship Product Development + 16-seat office + Lead + 3 Designers"],
          ["Owned manufacturing", hasResearch(world,"owned_manufacturing") && teamEffectiveness(world,"operations")>0, "Owned Manufacturing + seated Operations specialist + compatible Factory"],
          ["Specialized storage", hasResearch(world,"specialized_storage") && teamEffectiveness(world,"operations")>0, "Specialized Storage + Operations specialist + warehouse module"],
          ["Advanced market intelligence", hasResearch(world,"market_intelligence") && teamEffectiveness(world,"strategy")>0, "Market Intelligence + seated Strategy specialist"],
        ].map(([label,ok,need])=><div key={String(label)} style={{border:`1px solid ${ok?"#bbf7d0":C.line}`,background:ok?"#f0fdf4":C.bg,borderRadius:9,padding:9}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{fontSize:10.5}}>{label as string}</b><span style={{color:ok?C.green:C.faint,fontWeight:900,fontSize:9}}>{ok?"READY":"GATED"}</span></div><div style={{color:C.faint,fontSize:9.5,marginTop:3}}>{need as string}</div></div>)}
      </div>
    </Panel>

    {branches.map(branch => <Panel key={branch} title={`${branch} Capabilities`}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(235px,1fr))",gap:9}}>
        {RESEARCH_NODES.filter(n=>n.branch===branch).map(node => {
          const done=hasResearch(world,node.id); const check=canStartResearch(world,node.id);
          return <div key={node.id} style={{border:`1px solid ${done?"#bbf7d0":active?.nodeId===node.id?C.cyan:C.line}`,borderRadius:10,padding:12,background:done?"#f0fdf4":C.bg}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{fontSize:12.5}}>{node.title}</b><span style={{fontSize:9.5,fontWeight:800,color:done?C.green:active?.nodeId===node.id?C.cyan:C.faint}}>{done?"COMPLETE":active?.nodeId===node.id?"RESEARCHING":check.ok?"AVAILABLE":"LOCKED"}</span></div>
            <div style={{color:C.dim,fontSize:10.5,lineHeight:1.45,marginTop:6}}>{node.description}</div>
            <div style={{color:C.violet,fontSize:10.5,fontWeight:700,marginTop:7}}>Unlocks: {node.unlock}</div>
            <div style={{color:C.faint,fontSize:9.5,marginTop:5}}>{fmtMoney(node.cost)} setup · {node.points} development pts{node.prereq.length?` · Requires ${node.prereq.map(id=>researchDef(id).title).join(" + ")}`:""}</div>
            {!done && active?.nodeId!==node.id && <><button disabled={!check.ok} title={!check.ok?check.reason:undefined} onClick={()=>startResearch(node.id)} style={{...ctrlBtn,width:"100%",marginTop:9,opacity:check.ok?1:.45}}>Start research</button>{!check.ok && <div style={{color:C.amber,fontSize:9.5,marginTop:4}}>↳ {check.reason}</div>}</>}
          </div>
        })}
      </div>
    </Panel>)}

    <Panel title="🧪 Product Category Development">
      <div style={{color:C.dim,fontSize:12,lineHeight:1.5,marginBottom:10}}>Category expansion now lives here rather than inside Brands. A brand can only design categories the underlying business has learned to compete in.</div>
      {Object.values(world.player.businesses ?? {}).filter((b): b is NonNullable<typeof b> => Boolean(b && b.status==="active")).map(b => {
        const cfg=INDUSTRIES[b.industryId]; if(!cfg) return null;
        return <div key={b.industryId} style={{marginBottom:14}}><b style={{fontSize:12}}>{cfg.label}</b><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8,marginTop:7}}>{cfg.products.map(pt=>{
          const unlocked=b.unlockedCategories.includes(pt.key); const project=b.categoryExpansionProjects.find(p=>p.productKey===pt.key); const def=categoryGrowthDef(world,pt.key); const check=!unlocked&&!project?canStartCategoryExpansion(world,pt.key):null;
          return <div key={pt.key} style={{border:`1px solid ${unlocked?"#bbf7d0":project?C.cyan:C.line}`,borderRadius:9,padding:10,background:C.bg}}><div style={{display:"flex",justifyContent:"space-between",gap:6}}><b style={{fontSize:11.5}}>{pt.label}</b><span style={{fontSize:9,color:unlocked?C.green:project?C.cyan:C.faint,fontWeight:800}}>{unlocked?"READY":project?"DEVELOPING":"LOCKED"}</span></div>{project?<><div style={{height:5,background:C.grid,borderRadius:9,marginTop:8}}><div style={{width:`${(1-project.daysLeft/project.totalDays)*100}%`,height:"100%",background:C.cyan,borderRadius:9}}/></div><div style={{fontSize:9.5,color:categoryRate>0?C.dim:C.amber,marginTop:4}}>{categoryRate>0?`${Math.ceil(project.daysLeft/categoryRate)}d estimated`:`Paused — seat both CIO and Product staff to resume.`}</div></>:!unlocked&&def?<><div style={{fontSize:9.5,color:C.dim,marginTop:6}}>{def.blurb}</div><button disabled={!check?.ok} onClick={()=>startCategoryExpansion(pt.key)} style={{...ctrlBtn,width:"100%",marginTop:7,opacity:check?.ok?1:.45}}>Develop · {fmtMoney(def.investment)} · {def.days}d</button>{check&&!check.ok&&<div style={{color:C.amber,fontSize:9,marginTop:3}}>↳ {check.reason}</div>}</>:<div style={{fontSize:9.5,color:C.dim,marginTop:6}}>Available for product design.</div>}</div>
        })}</div></div>
      })}
    </Panel>
  </div>
}
function Metric({label,value}:{label:string;value:string}) { return <div style={{padding:10,border:`1px solid ${C.line}`,borderRadius:9,background:C.bg}}><small style={{color:C.faint}}>{label}</small><div style={{fontWeight:800,fontSize:14,marginTop:3}}>{value}</div></div> }
