import type { OperatingRoom, World } from "../../engine/types";
import { archetypeByKey } from "../../engine/productCatalog";

export type CampusAssetCategory = "building" | "expansion" | "decor";
export type CampusAssetId =
  | "startup_hq"
  | "corporate_hq"
  | "beauty_lab"
  | "toy_studio"
  | "warehouse"
  | "factory"
  | "office_expansion"
  | "warehouse_expansion"
  | "factory_upgrade"
  | "loading_dock"
  | "parking_signage"
  | "landscaping";

export interface CampusFootprint { w: number; h: number; }

export interface CampusAssetDef {
  id: CampusAssetId;
  label: string;
  category: CampusAssetCategory;
  file: string;
  footprint: CampusFootprint;
  /** Bottom-center anchor of the transparent PNG. Kept explicit so art can be replaced without moving buildings. */
  anchor: { x: number; y: number };
  /** Visual scale relative to the isometric footprint width. */
  scale: number;
  compatibleKinds?: OperatingRoom["kind"][];
  notes?: string;
}

const BASE_URL = ((import.meta as any).env?.BASE_URL as string | undefined) ?? "/";
const path = (file: string) => `${BASE_URL}assets/campus/${file}`;

export const CAMPUS_ASSETS: Record<CampusAssetId, CampusAssetDef> = {
  startup_hq: {
    id: "startup_hq", label: "Startup HQ", category: "building", file: path("buildings/startup_hq.png"),
    footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.22, compatibleKinds: ["office"],
    notes: "Founder-led headquarters / early-company corporate office.",
  },
  corporate_hq: {
    id: "corporate_hq", label: "Corporate HQ", category: "building", file: path("buildings/corporate_hq.png"),
    footprint: { w: 6, h: 6 }, anchor: { x: .5, y: .965 }, scale: 1.18, compatibleKinds: ["office"],
    notes: "Visual HQ upgrade for established companies; simulation footprint can remain save-compatible.",
  },
  beauty_lab: {
    id: "beauty_lab", label: "Beauty Lab", category: "building", file: path("buildings/beauty_lab.png"),
    footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.18, compatibleKinds: ["office"],
  },
  toy_studio: {
    id: "toy_studio", label: "Toy Studio", category: "building", file: path("buildings/toy_studio.png"),
    footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.18, compatibleKinds: ["office"],
  },
  warehouse: {
    id: "warehouse", label: "Warehouse", category: "building", file: path("buildings/warehouse.png"),
    footprint: { w: 6, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.16, compatibleKinds: ["warehouse"],
  },
  factory: {
    id: "factory", label: "Factory", category: "building", file: path("buildings/factory.png"),
    footprint: { w: 6, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.16, compatibleKinds: ["factory"],
  },
  office_expansion: {
    id: "office_expansion", label: "Office Expansion", category: "expansion", file: path("expansions/office_expansion.png"),
    footprint: { w: 4, h: 2 }, anchor: { x: .5, y: .965 }, scale: 1.15, compatibleKinds: ["office"],
  },
  warehouse_expansion: {
    id: "warehouse_expansion", label: "Warehouse Expansion", category: "expansion", file: path("expansions/warehouse_expansion.png"),
    footprint: { w: 4, h: 2 }, anchor: { x: .5, y: .965 }, scale: 1.15, compatibleKinds: ["warehouse"],
  },
  factory_upgrade: {
    id: "factory_upgrade", label: "Factory Upgrade", category: "expansion", file: path("expansions/factory_upgrade.png"),
    footprint: { w: 4, h: 2 }, anchor: { x: .5, y: .965 }, scale: 1.15, compatibleKinds: ["factory"],
  },
  loading_dock: {
    id: "loading_dock", label: "Loading Dock", category: "expansion", file: path("expansions/loading_dock.png"),
    footprint: { w: 3, h: 2 }, anchor: { x: .5, y: .965 }, scale: 1.16, compatibleKinds: ["outsourcing", "warehouse"],
  },
  parking_signage: {
    id: "parking_signage", label: "Parking & Signage", category: "decor", file: path("decor/parking_signage.png"),
    footprint: { w: 4, h: 3 }, anchor: { x: .5, y: .965 }, scale: 1.08,
  },
  landscaping: {
    id: "landscaping", label: "Landscaping Plaza", category: "decor", file: path("decor/landscaping.png"),
    footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.08,
  },
};

export const CAMPUS_ASSET_GROUPS = {
  buildings: ["startup_hq", "corporate_hq", "beauty_lab", "toy_studio", "warehouse", "factory"] as CampusAssetId[],
  expansions: ["office_expansion", "warehouse_expansion", "factory_upgrade", "loading_dock"] as CampusAssetId[],
  decor: ["parking_signage", "landscaping"] as CampusAssetId[],
};

export function roomCampusAssetId(world: World, room: OperatingRoom): CampusAssetId {
  if (room.id === "founder-office") return room.w >= 6 && room.h >= 6 ? "corporate_hq" : "startup_hq";
  if (room.kind === "factory") return "factory";
  if (room.kind === "warehouse") return "warehouse";
  if (room.kind === "outsourcing") return "loading_dock";
  if (room.kind === "office" && room.team === "product") {
    const industryId = room.productKey ? archetypeByKey(room.productKey)?.industryId : null;
    if (industryId === "toys") return "toy_studio";
    if (industryId === "skincare") return "beauty_lab";
  }
  return "office_expansion";
}

export function roomCampusAsset(world: World, room: OperatingRoom): CampusAssetDef {
  return CAMPUS_ASSETS[roomCampusAssetId(world, room)];
}

const imageCache = new Map<string, HTMLImageElement>();
const imageLoadHooked = new Set<string>();

/** Browser-only image cache for the canvas renderer. Assets live in /public and are copied verbatim by Vite. */
export function campusAssetImage(asset: CampusAssetDef, onReady?: () => void): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  let image = imageCache.get(asset.file);
  if (!image) {
    image = new Image();
    image.decoding = "async";
    image.src = asset.file;
    imageCache.set(asset.file, image);
  }
  if (!image.complete && onReady && !imageLoadHooked.has(asset.file)) {
    imageLoadHooked.add(asset.file);
    image.addEventListener("load", () => { imageLoadHooked.delete(asset.file); onReady(); }, { once: true });
  }
  return image;
}
