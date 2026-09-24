import type { OperatingRoomKind, ResearchNodeId, World } from "./types";
import { teamEffectiveness } from "./people";

export interface ResearchNodeDef {
  id: ResearchNodeId;
  branch: "Product" | "Organization" | "Operations" | "Market";
  title: string;
  description: string;
  cost: number;
  points: number;
  prereq: ResearchNodeId[];
  unlock: string;
}

export const RESEARCH_NODES: ResearchNodeDef[] = [
  { id:"advanced_product_development", branch:"Product", title:"Advanced Product Development", description:"Learn to coordinate a Product Lead and Designer on larger programs.", cost:80_000, points:120, prereq:[], unlock:"AA product programs" },
  { id:"flagship_product_development", branch:"Product", title:"Flagship Product Development", description:"Build the processes needed to coordinate full four-person flagship product teams.", cost:450_000, points:340, prereq:["advanced_product_development","organizational_scaling"], unlock:"AAA product programs" },
  { id:"professional_recruiting", branch:"Organization", title:"People & HR Foundations", description:"Formalize hiring briefs and broader talent sourcing beyond immediately available candidates.", cost:55_000, points:90, prereq:[], unlock:"Online recruiting searches and formal HR processes" },
  { id:"executive_search", branch:"Organization", title:"Executive Search", description:"Develop the employer brand and search discipline needed to approach scarce senior talent.", cost:180_000, points:190, prereq:["professional_recruiting"], unlock:"Deep recruiting searches" },
  { id:"organizational_scaling", branch:"Organization", title:"Organizational Scaling", description:"Introduce team structures, management layers and workplace standards for a larger company.", cost:175_000, points:180, prereq:[], unlock:"Large Office · 16 seats" },
  { id:"corporate_hq", branch:"Organization", title:"Corporate Headquarters", description:"Create the systems required to operate a multi-department corporate headquarters.", cost:700_000, points:360, prereq:["organizational_scaling"], unlock:"Massive Corporate HQ · 32 seats" },
  { id:"vertical_expansion", branch:"Organization", title:"Vertical Expansion", description:"Standardize floor-by-floor corporate expansion after the HQ reaches full scale.", cost:1_250_000, points:520, prereq:["corporate_hq"], unlock:"Additional HQ floors · +8 seats each" },
  { id:"supplier_management", branch:"Operations", title:"Supplier Management", description:"Move beyond founder-led sourcing into a dedicated supplier-management function.", cost:90_000, points:110, prereq:[], unlock:"Dedicated Sourcing Office" },
  { id:"owned_manufacturing", branch:"Operations", title:"Owned Manufacturing", description:"Develop process engineering, QA and operating controls for company-owned production.", cost:325_000, points:250, prereq:["supplier_management"], unlock:"Factories and owned production" },
  { id:"specialized_storage", branch:"Operations", title:"Specialized Storage", description:"Develop cold-chain, climate-control and secure handling standards for products that cannot live in a normal warehouse.", cost:240_000, points:210, prereq:["supplier_management"], unlock:"Climate-controlled, refrigerated, frozen and secure warehouse modules" },
  { id:"market_intelligence", branch:"Market", title:"Market Intelligence", description:"Build structured research capability for richer market and competitor analysis.", cost:140_000, points:150, prereq:[], unlock:"Advanced market intelligence" },
];

export function researchDef(id: ResearchNodeId) { return RESEARCH_NODES.find(n => n.id === id)!; }
export function hasResearch(w: World, id: ResearchNodeId): boolean { return (w.player.research?.completed ?? []).includes(id); }
export function hasSeatedCIO(w: World): boolean {
  const researchRooms = w.player.operatingRooms.filter((r) => r.facilityType === "research_center");
  const researchSeats = new Set(researchRooms.flatMap((r) => r.assignedPersonnelIds));
  return w.player.personnel.some((p) => p.role === "innovation" && researchSeats.has(p.id));
}
export function researchRate(w: World): number {
  // Corporate research is an organizational capability, not a free founder timer.
  // The Research Center is the physical home of the program; a seated CIO owns it.
  if (!hasSeatedCIO(w)) return 0;
  const cio = teamEffectiveness(w, "innovation");
  const strategy = teamEffectiveness(w, "strategy") * .55;
  const product = teamEffectiveness(w, "product_manager") * .45;
  const operations = teamEffectiveness(w, "operations") * .35;
  const centerLevel = Math.max(0, ...w.player.operatingRooms.filter((r) => r.facilityType === "research_center").map((r) => r.upgradeLevel ?? 1));
  const facilityMult = 1 + centerLevel * .12;
  return (cio * 2.65 + strategy + product + operations) * facilityMult;
}
export function canStartResearch(w: World, id: ResearchNodeId): {ok:boolean; reason:string; def:ResearchNodeDef} {
  const def=researchDef(id);
  if (!w.player.operatingRooms.some(r => r.id === "founder-office")) return {ok:false,reason:"Build the Founder Office before starting company-development research.",def};
  if (!w.player.operatingRooms.some((r) => r.facilityType === "research_center")) return {ok:false,reason:"Build a Research Center before starting company-development research.",def};
  if (!hasSeatedCIO(w)) return {ok:false,reason:"Hire a Chief Innovation Officer and assign them to the Research Center before starting research.",def};
  if (hasResearch(w,id)) return {ok:false,reason:"Already researched.",def};
  if (w.player.research?.active) return {ok:false,reason:"Another capability project is already active.",def};
  const missing=def.prereq.find(p=>!hasResearch(w,p));
  if (missing) return {ok:false,reason:`Requires ${researchDef(missing).title} first.`,def};
  if (w.player.cash < def.cost) return {ok:false,reason:`Need $${def.cost.toLocaleString()} to fund this capability project.`,def};
  return {ok:true,reason:"",def};
}
export function startResearch(w: World,id:ResearchNodeId): {ok:boolean;reason:string} {
  const check=canStartResearch(w,id); if(!check.ok) return {ok:false,reason:check.reason};
  w.player.cash-=check.def.cost;
  w.player.research.active={nodeId:id,startedTick:w.tick,progress:0,requiredPoints:check.def.points,cashCommitted:check.def.cost};
  w.events.push({tick:w.tick,kind:"strategy",text:`🔬 Capability project started — ${check.def.title}.`});
  return {ok:true,reason:""};
}
export function updateResearch(w: World): ResearchNodeId | null {
  const p=w.player.research?.active; if(!p) return null;
  const gain=researchRate(w); p.progress=Math.min(p.requiredPoints,p.progress+gain); w.player.research.lifetimePoints+=gain;
  if(p.progress < p.requiredPoints) return null;
  if(!w.player.research.completed.includes(p.nodeId)) w.player.research.completed.push(p.nodeId);
  const id=p.nodeId; const def=researchDef(id); w.player.research.active=null;
  w.events.push({tick:w.tick,kind:"strategy",text:`✅ Research complete — ${def.title}. ${def.unlock} unlocked.`});
  return id;
}
export function facilityResearchRequirement(w: World, kind: OperatingRoomKind): string | null {
  if(kind==="factory" && !hasResearch(w,"owned_manufacturing")) return "Research Owned Manufacturing first.";
  if(kind==="outsourcing" && !hasResearch(w,"supplier_management")) return "Research Supplier Management first.";
  return null;
}
export function officeUpgradeResearchRequirement(w: World, nextLevel: number): string | null {
  if(nextLevel===3 && !hasResearch(w,"organizational_scaling")) return "Research Organizational Scaling to build a 16-seat Large Office.";
  if(nextLevel===4 && !hasResearch(w,"corporate_hq")) return "Research Corporate Headquarters to reach 32 seats.";
  return null;
}
