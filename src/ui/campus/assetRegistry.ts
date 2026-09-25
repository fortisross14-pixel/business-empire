import type { OperatingRoom, World } from "../../engine/types";
import { roomFacilityType } from "../../engine/infrastructure";

export type CampusAssetCategory = "building" | "expansion" | "decor";
export type CampusAssetId =
  | "founder_office_1" | "founder_office_2" | "founder_office_3" | "founder_office_4"
  | "design_studio"
  | "beauty_center_1" | "beauty_center_2"
  | "toy_center_1" | "toy_center_2"
  | "food_center" | "fashion_atelier" | "electronics_lab"
  | "research_center_1" | "research_center_2" | "research_center_3"
  | "training_center_1" | "training_center_2"
  | "warehouse_small" | "warehouse_medium" | "warehouse_large"
  | "brand_studio" | "hr_office" | "marketing_office" | "logistics_office" | "consumer_insights"
  | "cold_storage" | "distribution_hub" | "executive_wing"
  | "factory" | "sourcing_office"
  | "parking_signage" | "landscaping";

export interface CampusFootprint { w: number; h: number; }
export interface CampusAssetDef {
  id: CampusAssetId;
  label: string;
  category: CampusAssetCategory;
  file: string;
  footprint: CampusFootprint;
  anchor: { x: number; y: number };
  scale: number;
  compatibleKinds?: OperatingRoom["kind"][];
  notes?: string;
}

const BASE_URL = ((import.meta as any).env?.BASE_URL as string | undefined) ?? "/";
const path = (file: string) => `${BASE_URL}assets/campus/${file}`;
const v3 = (file: string) => path(`buildings/v3/${file}`);

export const CAMPUS_ASSETS: Record<CampusAssetId, CampusAssetDef> = {
  founder_office_1: { id:"founder_office_1", label:"Founder Office I", category:"building", file:v3("founder_office_1.png"), footprint:{w:2,h:2}, anchor:{x:.5,y:.96}, scale:.98, compatibleKinds:["office"], notes:"Compact startup-scale first office." },
  founder_office_2: { id:"founder_office_2", label:"Founder Office II", category:"building", file:v3("founder_office_2.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.96}, scale:1.02, compatibleKinds:["office"] },
  founder_office_3: { id:"founder_office_3", label:"Founder Office III", category:"building", file:v3("founder_office_3.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.96}, scale:1.03, compatibleKinds:["office"] },
  founder_office_4: { id:"founder_office_4", label:"Founder Office IV · Corporate HQ", category:"building", file:v3("founder_office_4.png"), footprint:{w:5,h:5}, anchor:{x:.5,y:.96}, scale:1.04, compatibleKinds:["office"] },

  design_studio: { id:"design_studio", label:"Design Studio", category:"building", file:v3("design_studio.png"), footprint:{w:2,h:2}, anchor:{x:.5,y:.96}, scale:.98, compatibleKinds:["office"] },
  beauty_center_1: { id:"beauty_center_1", label:"Beauty Center I", category:"building", file:v3("beauty_center_1.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.96}, scale:1.00, compatibleKinds:["office"] },
  beauty_center_2: { id:"beauty_center_2", label:"Beauty Center II", category:"building", file:v3("beauty_center_2.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.96}, scale:1.02, compatibleKinds:["office"] },
  toy_center_1: { id:"toy_center_1", label:"Toy Center I", category:"building", file:v3("toy_center_1.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.96}, scale:1.00, compatibleKinds:["office"] },
  toy_center_2: { id:"toy_center_2", label:"Toy Center II", category:"building", file:v3("toy_center_2.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.96}, scale:1.02, compatibleKinds:["office"] },
  food_center: { id:"food_center",label:"Food Innovation Kitchen",category:"building",file:v3("food_center.png"),footprint:{w:3,h:3},anchor:{x:.5,y:.96},scale:1,compatibleKinds:["office"] },
  fashion_atelier: { id:"fashion_atelier",label:"Fashion Atelier",category:"building",file:v3("fashion_atelier.png"),footprint:{w:3,h:3},anchor:{x:.5,y:.96},scale:1,compatibleKinds:["office"] },
  electronics_lab: { id:"electronics_lab",label:"Prototype & Reliability Lab",category:"building",file:v3("electronics_lab.png"),footprint:{w:3,h:3},anchor:{x:.5,y:.96},scale:1,compatibleKinds:["office"] },
  research_center_1: { id:"research_center_1", label:"Research Center I", category:"building", file:v3("research_center_1.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.96}, scale:1.00, compatibleKinds:["office"] },
  research_center_2: { id:"research_center_2", label:"Research Center II", category:"building", file:v3("research_center_2.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.96}, scale:1.02, compatibleKinds:["office"] },
  research_center_3: { id:"research_center_3", label:"Research Center III", category:"building", file:v3("research_center_3.png"), footprint:{w:5,h:5}, anchor:{x:.5,y:.96}, scale:1.04, compatibleKinds:["office"] },
  training_center_1: { id:"training_center_1", label:"Training Room I", category:"building", file:v3("training_center_1.png"), footprint:{w:2,h:2}, anchor:{x:.5,y:.96}, scale:.98, compatibleKinds:["office"] },
  training_center_2: { id:"training_center_2", label:"Training Center II", category:"building", file:v3("training_center_2.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.96}, scale:1.00, compatibleKinds:["office"] },

  warehouse_small: { id:"warehouse_small", label:"Warehouse Small", category:"building", file:v3("warehouse_small.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.95}, scale:1.00, compatibleKinds:["warehouse"] },
  warehouse_medium: { id:"warehouse_medium", label:"Warehouse Medium", category:"building", file:v3("warehouse_medium.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.95}, scale:1.02, compatibleKinds:["warehouse"] },
  warehouse_large: { id:"warehouse_large", label:"Warehouse Large", category:"building", file:v3("warehouse_large.png"), footprint:{w:5,h:5}, anchor:{x:.5,y:.95}, scale:1.04, compatibleKinds:["warehouse"] },
  brand_studio: { id:"brand_studio", label:"Brand Studio", category:"building", file:v3("brand_studio.png"), footprint:{w:2,h:2}, anchor:{x:.5,y:.96}, scale:.98, compatibleKinds:["office"] },
  hr_office: { id:"hr_office", label:"HR Office", category:"building", file:v3("hr_office.png"), footprint:{w:2,h:2}, anchor:{x:.5,y:.96}, scale:.98, compatibleKinds:["office"] },
  marketing_office: { id:"marketing_office", label:"Marketing Office", category:"building", file:v3("marketing_office.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.96}, scale:1.00, compatibleKinds:["office"] },
  logistics_office: { id:"logistics_office", label:"Logistics Office", category:"building", file:v3("logistics_office.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.95}, scale:1.00, compatibleKinds:["office"] },
  consumer_insights: { id:"consumer_insights", label:"Consumer Insights Lab", category:"building", file:v3("consumer_insights.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.96}, scale:1.00, compatibleKinds:["office"] },
  cold_storage: { id:"cold_storage", label:"Cold Storage", category:"building", file:v3("cold_storage.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.95}, scale:1.02, compatibleKinds:["warehouse"] },
  distribution_hub: { id:"distribution_hub", label:"Distribution Hub", category:"building", file:v3("distribution_hub.png"), footprint:{w:5,h:5}, anchor:{x:.5,y:.95}, scale:1.02, compatibleKinds:["warehouse"] },
  executive_wing: { id:"executive_wing", label:"Executive Wing", category:"building", file:v3("executive_wing.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.96}, scale:1.02, compatibleKinds:["office"] },

  factory: { id:"factory", label:"Factory", category:"building", file:path("buildings/factory.png"), footprint:{w:6,h:4}, anchor:{x:.5,y:.965}, scale:1.16, compatibleKinds:["factory"] },
  sourcing_office: { id:"sourcing_office", label:"Sourcing Office", category:"building", file:path("expansions/loading_dock.png"), footprint:{w:3,h:2}, anchor:{x:.5,y:.965}, scale:1.16, compatibleKinds:["outsourcing"] },
  parking_signage: { id:"parking_signage", label:"Parking & Signage", category:"decor", file:path("decor/parking_signage.png"), footprint:{w:4,h:3}, anchor:{x:.5,y:.965}, scale:1.08 },
  landscaping: { id:"landscaping", label:"Landscaping Plaza", category:"decor", file:path("decor/landscaping.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.965}, scale:1.08 },
};

export const CAMPUS_ASSET_GROUPS = {
  buildings: [
    "founder_office_1","founder_office_2","founder_office_3","founder_office_4","design_studio",
    "beauty_center_1","beauty_center_2","toy_center_1","toy_center_2","food_center","fashion_atelier","electronics_lab","research_center_1","research_center_2","research_center_3",
    "training_center_1","training_center_2","warehouse_small","warehouse_medium","warehouse_large","brand_studio","hr_office","marketing_office",
    "logistics_office","consumer_insights","cold_storage","distribution_hub","executive_wing","factory","sourcing_office"
  ] as CampusAssetId[],
  decor: ["parking_signage","landscaping"] as CampusAssetId[],
};

export function roomCampusAssetId(_world: World, room: OperatingRoom): CampusAssetId {
  const level = Math.max(1, room.upgradeLevel ?? 1);
  if (room.id === "founder-office") return (`founder_office_${Math.min(4, level)}` as CampusAssetId);
  const type = roomFacilityType(room);
  if (type === "design_studio") return "design_studio";
  if (type === "beauty_center") return (`beauty_center_${Math.min(2, level)}` as CampusAssetId);
  if (type === "toy_center") return (`toy_center_${Math.min(2, level)}` as CampusAssetId);
  if (type === "food_center") return "food_center";
  if (type === "fashion_atelier") return "fashion_atelier";
  if (type === "electronics_lab") return "electronics_lab";
  if (type === "research_center") return (`research_center_${Math.min(3, level)}` as CampusAssetId);
  if (type === "training_center") return (`training_center_${Math.min(2, level)}` as CampusAssetId);
  if (type === "warehouse") return level <= 1 ? "warehouse_small" : level === 2 ? "warehouse_medium" : "warehouse_large";
  if (type === "brand_studio") return "brand_studio";
  if (type === "hr_office") return "hr_office";
  if (type === "marketing_office") return "marketing_office";
  if (type === "logistics_office") return "logistics_office";
  if (type === "consumer_insights") return "consumer_insights";
  if (type === "cold_storage") return "cold_storage";
  if (type === "distribution_hub") return "distribution_hub";
  if (type === "executive_wing") return "executive_wing";
  if (type === "factory") return "factory";
  if (type === "outsourcing") return "sourcing_office";
  return "founder_office_1";
}

export function roomCampusAsset(world: World, room: OperatingRoom): CampusAssetDef {
  const base = CAMPUS_ASSETS[roomCampusAssetId(world, room)];
  const level = Math.max(1, room.upgradeLevel ?? 1);
  const type = roomFacilityType(room);
  // Support buildings use one authored illustration but still physically grow when upgraded.
  if (["design_studio","food_center","fashion_atelier","electronics_lab","brand_studio","hr_office","marketing_office","logistics_office","consumer_insights","cold_storage","distribution_hub","executive_wing","factory","outsourcing"].includes(type) && level > 1) {
    return { ...base, scale: base.scale * (1 + Math.min(2, level - 1) * .04) };
  }
  return base;
}

const imageCache = new Map<string, HTMLImageElement>();
const imageLoadHooked = new Set<string>();
export function campusAssetImage(asset: CampusAssetDef, onReady?: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  let image = imageCache.get(asset.file);
  if (!image) { image = new Image(); image.decoding = "async"; image.src = asset.file; imageCache.set(asset.file, image); }
  if (!image.complete && onReady && !imageLoadHooked.has(asset.file)) {
    imageLoadHooked.add(asset.file); image.addEventListener("load", () => { imageLoadHooked.delete(asset.file); onReady(); }, { once: true });
  }
  return image;
}
