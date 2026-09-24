import type { OperatingRoom, World } from "../../engine/types";
import { roomFacilityType } from "../../engine/infrastructure";

export type CampusAssetCategory = "building" | "expansion" | "decor";
export type CampusAssetId =
  | "founder_office_1" | "founder_office_2" | "founder_office_3" | "founder_office_4"
  | "warehouse_small" | "warehouse_medium"
  | "research_center" | "beauty_center" | "toy_center" | "training_center"
  | "factory" | "office_expansion" | "warehouse_expansion" | "factory_upgrade" | "loading_dock"
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
const v2 = (file: string) => path(`buildings/v2/${file}`);

export const CAMPUS_ASSETS: Record<CampusAssetId, CampusAssetDef> = {
  founder_office_1: { id:"founder_office_1", label:"Founder Office I", category:"building", file:v2("founder_office_1.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:.78, compatibleKinds:["office"], notes:"Deliberately visually modest so campus growth is obvious." },
  founder_office_2: { id:"founder_office_2", label:"Founder Office II", category:"building", file:v2("founder_office_2.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:1.00, compatibleKinds:["office"] },
  founder_office_3: { id:"founder_office_3", label:"Founder Office III", category:"building", file:v2("founder_office_3.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:1.10, compatibleKinds:["office"] },
  founder_office_4: { id:"founder_office_4", label:"Founder Office IV", category:"building", file:v2("founder_office_4.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:1.17, compatibleKinds:["office"] },
  warehouse_small: { id:"warehouse_small", label:"Warehouse Small", category:"building", file:v2("warehouse_small.png"), footprint:{w:6,h:4}, anchor:{x:.5,y:.93}, scale:1.06, compatibleKinds:["warehouse"] },
  warehouse_medium: { id:"warehouse_medium", label:"Warehouse Medium / Large", category:"building", file:v2("warehouse_medium.png"), footprint:{w:6,h:4}, anchor:{x:.5,y:.94}, scale:1.12, compatibleKinds:["warehouse"] },
  research_center: { id:"research_center", label:"Research Center", category:"building", file:v2("research_center.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:1.04, compatibleKinds:["office"] },
  beauty_center: { id:"beauty_center", label:"Beauty Center", category:"building", file:v2("beauty_center.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:1.04, compatibleKinds:["office"] },
  toy_center: { id:"toy_center", label:"Toy Center", category:"building", file:v2("toy_center.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:1.04, compatibleKinds:["office"] },
  training_center: { id:"training_center", label:"Training Room", category:"building", file:v2("training_center.png"), footprint:{w:3,h:3}, anchor:{x:.5,y:.93}, scale:1.02, compatibleKinds:["office"] },
  factory: { id:"factory", label:"Factory", category:"building", file:path("buildings/factory.png"), footprint:{w:6,h:4}, anchor:{x:.5,y:.965}, scale:1.16, compatibleKinds:["factory"] },
  office_expansion: { id:"office_expansion", label:"Specialist Office", category:"expansion", file:v2("founder_office_1.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.94}, scale:.92, compatibleKinds:["office"] },
  warehouse_expansion: { id:"warehouse_expansion", label:"Warehouse Expansion", category:"expansion", file:v2("warehouse_medium.png"), footprint:{w:6,h:4}, anchor:{x:.5,y:.94}, scale:1.08, compatibleKinds:["warehouse"] },
  factory_upgrade: { id:"factory_upgrade", label:"Factory Upgrade", category:"expansion", file:path("expansions/factory_upgrade.png"), footprint:{w:4,h:2}, anchor:{x:.5,y:.965}, scale:1.15, compatibleKinds:["factory"] },
  loading_dock: { id:"loading_dock", label:"Loading Dock", category:"expansion", file:path("expansions/loading_dock.png"), footprint:{w:3,h:2}, anchor:{x:.5,y:.965}, scale:1.16, compatibleKinds:["outsourcing","warehouse"] },
  parking_signage: { id:"parking_signage", label:"Parking & Signage", category:"decor", file:path("decor/parking_signage.png"), footprint:{w:4,h:3}, anchor:{x:.5,y:.965}, scale:1.08 },
  landscaping: { id:"landscaping", label:"Landscaping Plaza", category:"decor", file:path("decor/landscaping.png"), footprint:{w:4,h:4}, anchor:{x:.5,y:.965}, scale:1.08 },
};

export const CAMPUS_ASSET_GROUPS = {
  buildings: ["founder_office_1","founder_office_2","founder_office_3","founder_office_4","warehouse_small","warehouse_medium","research_center","beauty_center","toy_center","training_center","factory"] as CampusAssetId[],
  expansions: ["office_expansion","warehouse_expansion","factory_upgrade","loading_dock"] as CampusAssetId[],
  decor: ["parking_signage","landscaping"] as CampusAssetId[],
};

export function roomCampusAssetId(_world: World, room: OperatingRoom): CampusAssetId {
  const level = Math.max(1, room.upgradeLevel ?? 1);
  if (room.id === "founder-office") return (`founder_office_${Math.min(4,level)}` as CampusAssetId);
  const type = roomFacilityType(room);
  if (type === "beauty_center") return "beauty_center";
  if (type === "toy_center") return "toy_center";
  if (type === "research_center") return "research_center";
  if (type === "training_center") return "training_center";
  if (type === "warehouse" || type === "cold_storage" || type === "distribution_hub") return level <= 1 && type === "warehouse" ? "warehouse_small" : "warehouse_medium";
  if (type === "factory") return "factory";
  if (type === "outsourcing") return "loading_dock";
  return "office_expansion";
}

export function roomCampusAsset(world: World, room: OperatingRoom): CampusAssetDef {
  const base = CAMPUS_ASSETS[roomCampusAssetId(world, room)];
  const level = Math.max(1, room.upgradeLevel ?? 1);
  const type = roomFacilityType(room);
  // Founder stages have bespoke art. Other upgradeable facilities keep their
  // authored sprite but grow slightly on the map so upgrades still read
  // visually until a later art pass adds a unique sprite for every tier.
  if (room.id === "founder-office") return base;
  if (type === "warehouse" && level >= 3) return { ...base, scale: base.scale * 1.10 };
  if (["beauty_center","toy_center","research_center","training_center","cold_storage","distribution_hub"].includes(type) && level > 1) return { ...base, scale: base.scale * (1 + Math.min(2, level - 1) * .06) };
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
