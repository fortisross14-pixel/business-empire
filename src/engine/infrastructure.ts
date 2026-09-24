import type { CampusPathTile, DeptTier, FacilityTypeId, OperatingRoom, OperatingRoomKind, OperatingTeamKind, PersonnelRole, World } from "./types";
import type { StorageProfileId } from "./productCatalog";

export const OPERATING_ROOM_DEFS = {
  office: { label: "Office", size: [4, 4] as [number, number], buildCost: 25_000, monthlyCost: 6_000, capacity: 4 },
  factory: { label: "Factory", size: [6, 4] as [number, number], buildCost: 200_000, monthlyCost: 18_000, capacity: 100_000 },
  warehouse: { label: "Warehouse", size: [6, 4] as [number, number], buildCost: 70_000, monthlyCost: 8_000, capacity: 50_000 },
  outsourcing: { label: "Sourcing Office", size: [3, 2] as [number, number], buildCost: 40_000, monthlyCost: 7_000, capacity: 150_000 },
} as const;

export interface FacilityDef {
  id: FacilityTypeId;
  kind: OperatingRoomKind;
  label: string;
  icon: string;
  size: [number, number];
  buildCost: number;
  monthlyCost: number;
  capacity: number;
  team: OperatingTeamKind;
  repeatable: boolean;
  maxLevel: number;
  description: string;
  group: "Core" | "Product" | "Operations" | "People" | "Commercial";
}

export const FACILITY_DEFS: Record<FacilityTypeId, FacilityDef> = {
  office: { id: "office", kind: "office", label: "General Office", icon: "🏢", size: [4,4], buildCost: 25_000, monthlyCost: 6_000, capacity: 4, team: "unassigned", repeatable: true, maxLevel: 3, group: "Core", description: "Flexible office space. The first one becomes the Founder Office." },
  beauty_center: { id: "beauty_center", kind: "office", label: "Beauty Center", icon: "✨", size: [4,4], buildCost: 140_000, monthlyCost: 14_000, capacity: 4, team: "product", repeatable: true, maxLevel: 2, group: "Product", description: "Dedicated skincare and beauty product-development center. Level II supports flagship AAA teams." },
  toy_center: { id: "toy_center", kind: "office", label: "Toy Center", icon: "🧸", size: [4,4], buildCost: 140_000, monthlyCost: 14_000, capacity: 4, team: "product", repeatable: true, maxLevel: 2, group: "Product", description: "Dedicated toy-design center. Level II supports flagship AAA teams." },
  research_center: { id: "research_center", kind: "office", label: "Research Center", icon: "🔬", size: [4,4], buildCost: 180_000, monthlyCost: 18_000, capacity: 2, team: "innovation", repeatable: false, maxLevel: 3, group: "Product", description: "Home for the CIO and R&D team. Required for company research; upgrades accelerate research and unlock flagship development infrastructure." },
  training_center: { id: "training_center", kind: "office", label: "Training Room", icon: "🎓", size: [3,3], buildCost: 45_000, monthlyCost: 5_000, capacity: 1, team: "unassigned", repeatable: true, maxLevel: 2, group: "People", description: "Runs employee upskilling programs. Upgrade for more simultaneous trainees and faster courses." },
  brand_studio: { id: "brand_studio", kind: "office", label: "Brand Studio", icon: "🎨", size: [3,3], buildCost: 60_000, monthlyCost: 7_000, capacity: 2, team: "marketing", repeatable: false, maxLevel: 2, group: "Commercial", description: "Creative brand hub. Improves the efficiency of long-term brand building." },
  hr_office: { id: "hr_office", kind: "office", label: "HR Office", icon: "🧑‍💼", size: [3,3], buildCost: 80_000, monthlyCost: 8_000, capacity: 2, team: "strategy", repeatable: false, maxLevel: 2, group: "People", description: "Formal people operations. Speeds external recruiting searches." },
  marketing_office: { id: "marketing_office", kind: "office", label: "Marketing Office", icon: "📣", size: [4,3], buildCost: 95_000, monthlyCost: 10_000, capacity: 4, team: "marketing", repeatable: false, maxLevel: 2, group: "Commercial", description: "Dedicated campaign team space. Improves paid marketing execution." },
  logistics_office: { id: "logistics_office", kind: "office", label: "Logistics Office", icon: "🚚", size: [3,3], buildCost: 90_000, monthlyCost: 9_000, capacity: 3, team: "operations", repeatable: false, maxLevel: 2, group: "Operations", description: "Coordinates suppliers and freight. Shortens production lead times and improves external capacity." },
  consumer_insights: { id: "consumer_insights", kind: "office", label: "Consumer Insights Lab", icon: "🧭", size: [4,3], buildCost: 160_000, monthlyCost: 15_000, capacity: 3, team: "strategy", repeatable: false, maxLevel: 2, group: "Commercial", description: "Dedicated market-research facility. Speeds commissioned studies and product diagnosis." },
  warehouse: { id: "warehouse", kind: "warehouse", label: "Warehouse", icon: "📦", size: [6,4], buildCost: 70_000, monthlyCost: 8_000, capacity: 50_000, team: "operations", repeatable: true, maxLevel: 3, group: "Operations", description: "Standard finished-goods storage. Build several or expand each from Small to Medium to Large." },
  cold_storage: { id: "cold_storage", kind: "warehouse", label: "Cold Storage", icon: "❄️", size: [5,4], buildCost: 210_000, monthlyCost: 18_000, capacity: 60_000, team: "operations", repeatable: true, maxLevel: 2, group: "Operations", description: "Purpose-built climate, refrigerated and frozen storage for temperature-sensitive products." },
  distribution_hub: { id: "distribution_hub", kind: "warehouse", label: "Distribution Hub", icon: "🚛", size: [7,5], buildCost: 650_000, monthlyCost: 42_000, capacity: 250_000, team: "operations", repeatable: false, maxLevel: 2, group: "Operations", description: "Late-game logistics hub with huge storage and faster inbound/outbound coordination." },
  factory: { id: "factory", kind: "factory", label: "Factory", icon: "🏭", size: [6,4], buildCost: 200_000, monthlyCost: 18_000, capacity: 100_000, team: "operations", repeatable: true, maxLevel: 3, group: "Operations", description: "Owned manufacturing capacity. Requires Owned Manufacturing research." },
  outsourcing: { id: "outsourcing", kind: "outsourcing", label: "Sourcing Office", icon: "🤝", size: [3,2], buildCost: 40_000, monthlyCost: 7_000, capacity: 150_000, team: "operations", repeatable: true, maxLevel: 3, group: "Operations", description: "Dedicated supplier-management capacity for outsourced production." },
  executive_wing: { id: "executive_wing", kind: "office", label: "Executive Wing", icon: "🏛️", size: [4,4], buildCost: 480_000, monthlyCost: 32_000, capacity: 8, team: "unassigned", repeatable: false, maxLevel: 2, group: "Core", description: "Late-game leadership space. Adds flexible senior seats and a small company-wide management bonus." },
};

export const BUILDABLE_FACILITY_IDS: FacilityTypeId[] = [
  "office", "training_center", "brand_studio",
  "beauty_center", "toy_center", "research_center",
  "hr_office", "marketing_office", "logistics_office", "consumer_insights",
  "warehouse", "cold_storage", "distribution_hub", "outsourcing", "factory", "executive_wing",
];

export const WAREHOUSE_MODULE_COST: Record<Exclude<StorageProfileId, "standard">, number> = {
  climate: 90_000,
  refrigerated: 180_000,
  frozen: 300_000,
  secure: 220_000,
};

export function roomFacilityType(room: OperatingRoom): FacilityTypeId {
  if (room.id === "founder-office") return "office";
  if (room.facilityType) return room.facilityType;
  if (room.kind === "warehouse") return "warehouse";
  if (room.kind === "factory") return "factory";
  if (room.kind === "outsourcing") return "outsourcing";
  return "office";
}

export function facilityDefForRoom(room: OperatingRoom): FacilityDef { return FACILITY_DEFS[roomFacilityType(room)]; }
export function founderOffice(w: World): OperatingRoom | undefined { return w.player.operatingRooms.find((r) => r.id === "founder-office"); }
export function founderOfficeLevel(w: World): number { return Math.max(0, founderOffice(w)?.upgradeLevel ?? (founderOffice(w) ? 1 : 0)); }
export function facilityRooms(w: World, type: FacilityTypeId): OperatingRoom[] { return w.player.operatingRooms.filter((r) => roomFacilityType(r) === type && !(r.id === "founder-office" && type !== "office")); }
export function highestFacilityLevel(w: World, type: FacilityTypeId): number { return Math.max(0, ...facilityRooms(w, type).filter(r => r.id !== "founder-office" || type === "office").map((r) => r.upgradeLevel ?? 1)); }
export function hasFacility(w: World, type: FacilityTypeId, minLevel = 1): boolean { return facilityRooms(w, type).some((r) => (r.upgradeLevel ?? 1) >= minLevel && (type !== "office" || r.id !== "founder-office")); }

export function facilityBuildRequirement(w: World, type: FacilityTypeId): string | null {
  const def = FACILITY_DEFS[type];
  const founder = founderOffice(w);
  const founderLevel = founderOfficeLevel(w);
  if (type !== "office" && !founder) return "Build the Founder Office first.";
  if (!def.repeatable && facilityRooms(w, type).some((r) => r.id !== "founder-office")) return `${def.label} is unique; upgrade the existing facility instead.`;
  if (["beauty_center","toy_center","research_center","hr_office","marketing_office","logistics_office"].includes(type) && founderLevel < 2) return "Expand the Founder Office to Level II first.";
  if (type === "consumer_insights" && founderLevel < 3) return "Reach Founder Office III first.";
  if (["distribution_hub","executive_wing"].includes(type) && founderLevel < 4) return "Reach Founder Office IV first.";
  if (type === "beauty_center" && w.player.businesses?.skincare?.status !== "active") return "Activate the Skincare business first.";
  if (type === "toy_center" && w.player.businesses?.toys?.status !== "active") return "Activate the Toys business first.";
  const researched = new Set(w.player.research?.completed ?? []);
  if (type === "factory" && !researched.has("owned_manufacturing")) return "Research Owned Manufacturing first.";
  if (type === "outsourcing" && !researched.has("supplier_management")) return "Research Supplier Management first.";
  if (type === "cold_storage" && !researched.has("specialized_storage")) return "Research Specialized Storage first.";
  if (type === "consumer_insights" && !researched.has("market_intelligence")) return "Research Market Intelligence first.";
  if (["distribution_hub","executive_wing"].includes(type) && !researched.has("corporate_hq")) return "Research Corporate Headquarters first.";
  return null;
}

export function storageModuleRequirement(w: World, profile: StorageProfileId): string | null {
  if (profile === "standard") return null;
  if (!(w.player.research?.completed ?? []).includes("specialized_storage")) return "Research Specialized Storage before installing warehouse modules.";
  return null;
}

export const CAMPUS_MAP_SIZE = 48;
export const CAMPUS_PATH_COST = 250;
export const CAMPUS_ENTRANCE: CampusPathTile = { x: 2, y: 44 };
export const STARTER_ENTRANCE_PATH: CampusPathTile[] = [CAMPUS_ENTRANCE, { x: 3, y: 44 }];

const tileKey = (x: number, y: number) => `${x},${y}`;
export const adjacentTiles = (x: number, y: number): CampusPathTile[] => [
  { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 },
];

export function campusPathConnectedSet(w: World): Set<string> {
  const paths = w.player.campusPaths ?? [];
  const all = new Set(paths.map((p) => tileKey(p.x, p.y)));
  const start = tileKey(CAMPUS_ENTRANCE.x, CAMPUS_ENTRANCE.y);
  const seen = new Set<string>();
  if (!all.has(start)) return seen;
  const queue: CampusPathTile[] = [CAMPUS_ENTRANCE];
  seen.add(start);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of adjacentTiles(cur.x, cur.y)) {
      const k = tileKey(n.x, n.y);
      if (all.has(k) && !seen.has(k)) { seen.add(k); queue.push(n); }
    }
  }
  return seen;
}

export function roomTouchesConnectedPath(w: World, room: Pick<OperatingRoom, "x" | "y" | "w" | "h">): boolean {
  const connected = campusPathConnectedSet(w);
  for (let x = room.x; x < room.x + room.w; x++) {
    if (connected.has(tileKey(x, room.y - 1)) || connected.has(tileKey(x, room.y + room.h))) return true;
  }
  for (let y = room.y; y < room.y + room.h; y++) {
    if (connected.has(tileKey(room.x - 1, y)) || connected.has(tileKey(room.x + room.w, y))) return true;
  }
  return false;
}

export function canBuildCampusPath(w: World, tile: CampusPathTile): { ok: boolean; reason: string } {
  if (tile.x < 0 || tile.y < 0 || tile.x >= CAMPUS_MAP_SIZE || tile.y >= CAMPUS_MAP_SIZE) return { ok: false, reason: "Path must stay inside the campus." };
  if ((w.player.campusPaths ?? []).some((p) => p.x === tile.x && p.y === tile.y)) return { ok: false, reason: "There is already a path here." };
  if (w.player.operatingRooms.some((r) => tile.x >= r.x && tile.x < r.x + r.w && tile.y >= r.y && tile.y < r.y + r.h)) return { ok: false, reason: "A facility already occupies this tile." };
  const connected = campusPathConnectedSet(w);
  if (!adjacentTiles(tile.x, tile.y).some((n) => connected.has(tileKey(n.x, n.y)))) return { ok: false, reason: "Extend the path from the connected entrance network." };
  if (w.player.cash < CAMPUS_PATH_COST) return { ok: false, reason: `Need $${CAMPUS_PATH_COST.toLocaleString()} for this path tile.` };
  return { ok: true, reason: "" };
}

export function roomSupportsProductDesign(room: OperatingRoom, industryId?: string): boolean {
  if (room.kind !== "office") return false;
  if (room.id === "founder-office") return true;
  const type = roomFacilityType(room);
  if (type === "training_center" || type === "research_center" || type === "hr_office" || type === "marketing_office" || type === "logistics_office" || type === "consumer_insights" || type === "brand_studio" || type === "executive_wing") return false;
  if (type === "beauty_center") return !industryId || industryId === "skincare";
  if (type === "toy_center") return !industryId || industryId === "toys";
  return room.team === "product";
}

export function roleFitsRoom(role: PersonnelRole, room: OperatingRoom): boolean {
  if (room.id === "founder-office") return true;
  const type = roomFacilityType(room);
  if (type === "training_center") return false;
  if (type === "beauty_center" || type === "toy_center") return role === "product_manager";
  if (type === "research_center") return role === "innovation";
  if (type === "brand_studio" || type === "marketing_office") return role === "marketing";
  if (type === "logistics_office") return role === "operations";
  if (type === "consumer_insights" || type === "hr_office") return role === "strategy";
  if (type === "executive_wing") return true;
  return roleFitsTeam(role, room.team);
}

export interface FacilityUpgradeQuote {
  currentLevel: number;
  nextLevel: number;
  maxLevel: number | null;
  cost: number;
  capacityGain: number;
  monthlyCostGain: number;
  currentLabel?: string;
  nextLabel?: string;
}

export function officeStageForLevel(level: number): { label: string; capacity: number } {
  const lv = Math.max(1, Math.min(4, Math.floor(level)));
  if (lv === 1) return { label: "Founder Office I", capacity: 4 };
  if (lv === 2) return { label: "Founder Office II", capacity: 8 };
  if (lv === 3) return { label: "Founder Office III", capacity: 16 };
  return { label: "Founder Office IV · Corporate HQ", capacity: 32 };
}

function levelCapacity(type: FacilityTypeId, level: number, room: OperatingRoom): number {
  const lv = Math.max(1, level);
  if (room.id === "founder-office") return officeStageForLevel(lv).capacity;
  if (type === "warehouse") return [0, 50_000, 100_000, 180_000][Math.min(3, lv)] ?? 180_000;
  if (type === "cold_storage") return lv >= 2 ? 120_000 : 60_000;
  if (type === "distribution_hub") return lv >= 2 ? 450_000 : 250_000;
  if (type === "factory") return [0,100_000,175_000,275_000][Math.min(3,lv)] ?? 275_000;
  if (type === "outsourcing") return [0,150_000,250_000,400_000][Math.min(3,lv)] ?? 400_000;
  if (type === "beauty_center" || type === "toy_center") return lv >= 2 ? 8 : 4;
  if (type === "research_center") return [0,2,4,6][Math.min(3,lv)] ?? 6;
  if (type === "training_center") return lv >= 2 ? 3 : 1;
  if (type === "executive_wing") return lv >= 2 ? 12 : 8;
  const base = FACILITY_DEFS[type].capacity;
  return Math.round(base * (1 + (lv - 1) * .75));
}

export function facilityUpgradeQuote(room: OperatingRoom): FacilityUpgradeQuote | null {
  const currentLevel = Math.max(1, Math.floor(room.upgradeLevel ?? 1));
  const type = roomFacilityType(room);
  if (room.id === "founder-office") {
    if (currentLevel >= 4) return null;
    const current = officeStageForLevel(currentLevel);
    const next = officeStageForLevel(currentLevel + 1);
    const cost = currentLevel === 1 ? 75_000 : currentLevel === 2 ? 220_000 : 900_000;
    const monthlyCostGain = currentLevel === 1 ? 6_000 : currentLevel === 2 ? 10_000 : 25_000;
    return { currentLevel, nextLevel: currentLevel + 1, maxLevel: 4, cost, capacityGain: next.capacity - current.capacity, monthlyCostGain, currentLabel: current.label, nextLabel: next.label };
  }
  const def = FACILITY_DEFS[type];
  if (currentLevel >= def.maxLevel) return null;
  const nextLevel = currentLevel + 1;
  const currentCap = levelCapacity(type, currentLevel, room);
  const nextCap = levelCapacity(type, nextLevel, room);
  const specialCosts: Partial<Record<FacilityTypeId, number[]>> = {
    beauty_center: [0, 240_000], toy_center: [0, 240_000], research_center: [0, 260_000, 650_000], training_center: [0, 110_000],
    warehouse: [0, 85_000, 180_000], cold_storage: [0, 280_000], distribution_hub: [0, 700_000], executive_wing: [0, 650_000],
  };
  const cost = specialCosts[type]?.[currentLevel] ?? Math.round(def.buildCost * (currentLevel === 1 ? .65 : .95));
  const monthlyCostGain = Math.max(2_000, Math.round(def.monthlyCost * .4));
  return { currentLevel, nextLevel, maxLevel: def.maxLevel, cost, capacityGain: nextCap - currentCap, monthlyCostGain, currentLabel: `${def.label} ${roman(currentLevel)}`, nextLabel: `${def.label} ${roman(nextLevel)}` };
}

export function facilityUpgradeRequirement(w: World, room: OperatingRoom, nextLevel: number): string | null {
  if (room.id === "founder-office") {
    if (nextLevel === 3 && !(w.player.research?.completed ?? []).includes("organizational_scaling")) return "Research Organizational Scaling to reach Founder Office III.";
    if (nextLevel === 4 && !(w.player.research?.completed ?? []).includes("corporate_hq")) return "Research Corporate Headquarters to reach Founder Office IV.";
    return null;
  }
  const type = roomFacilityType(room);
  if ((type === "beauty_center" || type === "toy_center") && nextLevel >= 2 && !(w.player.research?.completed ?? []).includes("flagship_product_development")) return "Research Flagship Product Development before upgrading this design center to Level II.";
  if (type === "research_center" && nextLevel >= 2 && !(w.player.research?.completed ?? []).includes("advanced_product_development")) return "Research Advanced Product Development before expanding the Research Center.";
  if (type === "research_center" && nextLevel >= 3 && !(w.player.research?.completed ?? []).includes("flagship_product_development")) return "Research Flagship Product Development before building Research Center III.";
  if (type === "consumer_insights" && !(w.player.research?.completed ?? []).includes("market_intelligence")) return "Research Market Intelligence first.";
  return null;
}

function roman(level: number) { return ["0","I","II","III","IV"][Math.min(4, Math.max(0, level))] ?? String(level); }

export function departmentTierFromSeats(seats: number): DeptTier { return seats >= 5 ? 3 : seats >= 3 ? 2 : seats >= 1 ? 1 : 0; }

export function assignedSeatCount(w: World, team: OperatingTeamKind): number {
  const dedicated = w.player.operatingRooms
    .filter((r) => r.kind === "office" && r.team === team && roomFacilityType(r) !== "training_center")
    .reduce((sum, r) => sum + r.assignedPersonnelIds.length, 0);
  const founder = w.player.operatingRooms.find((r) => r.id === "founder-office");
  if (!founder || team === "unassigned") return dedicated;
  const matchingRoles: Partial<Record<OperatingTeamKind, PersonnelRole[]>> = {
    product: ["product_manager"], marketing: ["marketing"], finance: ["finance"], strategy: ["strategy"], innovation: ["innovation"],
    operations: ["operations"], sales: ["operations", "strategy"],
  };
  const allowed = matchingRoles[team] ?? [];
  const founderCount = founder.assignedPersonnelIds.filter((id) => {
    const p = w.player.personnel.find((person) => person.id === id);
    return Boolean(p && allowed.includes(p.role));
  }).length;
  return dedicated + founderCount;
}

export function syncDerivedDepartments(w: World) {
  w.player.financeDept = departmentTierFromSeats(assignedSeatCount(w, "finance"));
  w.player.intelDept = departmentTierFromSeats(assignedSeatCount(w, "strategy"));
}

export function roleFitsTeam(role: PersonnelRole, team: OperatingTeamKind): boolean {
  if (team === "unassigned") return true;
  if (team === "product") return role === "product_manager";
  if (team === "finance") return role === "finance";
  if (team === "marketing") return role === "marketing";
  if (team === "strategy") return role === "strategy";
  if (team === "innovation") return role === "innovation";
  if (team === "operations" || team === "sales") return role === "operations" || role === "strategy";
  return false;
}

export function openSeatCountForRole(w: World, role: PersonnelRole): number {
  return w.player.operatingRooms
    .filter((room) => room.kind === "office" && roomFacilityType(room) !== "training_center" && roleFitsRoom(role, room))
    .reduce((sum, room) => {
      const limit = room.id === "founder-office" ? Math.max(0, room.capacity - 1) : room.capacity;
      return sum + Math.max(0, limit - room.assignedPersonnelIds.length);
    }, 0);
}

export function sanitizeOperatingRooms(w: World, nextRooms: OperatingRoom[]): OperatingRoom[] {
  const validPersonnel = new Set(w.player.personnel.map((p) => p.id));
  const personnelById = new Map(w.player.personnel.map((p) => [p.id, p]));
  const claimed = new Set<string>();
  return nextRooms.map((room) => {
    const type = room.facilityType ?? (room.kind as FacilityTypeId);
    const baseRoom = { ...room, facilityType: room.id === "founder-office" ? "office" as const : type, upgradeLevel: room.upgradeLevel ?? 1 };
    if (room.kind === "warehouse" && type === "cold_storage") baseRoom.storageProfiles = ["standard","climate","refrigerated","frozen"];
    if (room.kind !== "office" || type === "training_center") return { ...baseRoom, assignedPersonnelIds: [] };
    const assigned: string[] = [];
    for (const id of room.assignedPersonnelIds) {
      const p = personnelById.get(id);
      if (!validPersonnel.has(id) || !p || claimed.has(id) || !roleFitsRoom(p.role, baseRoom)) continue;
      const staffCapacity = room.id === "founder-office" ? Math.max(0, room.capacity - 1) : room.capacity;
      if (assigned.length >= staffCapacity) break;
      assigned.push(id); claimed.add(id);
    }
    return { ...baseRoom, assignedPersonnelIds: assigned };
  });
}

export function roomOperatingCostPerQuarter(w: World): number { return w.player.operatingRooms.reduce((sum, room) => sum + room.monthlyCost * 3, 0); }

export function trainingCapacity(w: World): number { return facilityRooms(w, "training_center").reduce((sum, r) => sum + r.capacity, 0); }
export function researchCenterLevel(w: World): number { return highestFacilityLevel(w, "research_center"); }
export function productCenterTypeForIndustry(industryId?: string): FacilityTypeId | null { return industryId === "skincare" ? "beauty_center" : industryId === "toys" ? "toy_center" : null; }
export function productCenterLevel(w: World, industryId?: string): number { const t = productCenterTypeForIndustry(industryId); return t ? highestFacilityLevel(w, t) : 0; }

export function facilityEffectMultiplier(w: World, effect: "brand" | "marketing" | "recruiting" | "logistics" | "insights" | "leadership"): number {
  const effectTypes: Record<"brand" | "marketing" | "recruiting" | "logistics" | "insights" | "leadership", FacilityTypeId> = {
    brand: "brand_studio", marketing: "marketing_office", recruiting: "hr_office", logistics: "logistics_office", insights: "consumer_insights", leadership: "executive_wing",
  };
  const level = highestFacilityLevel(w, effectTypes[effect]);
  if (effect === "brand") return 1 + level * .10;
  if (effect === "marketing") return 1 + level * .08;
  if (effect === "recruiting") return 1 + level * .18;
  if (effect === "logistics") return 1 + level * .10;
  if (effect === "insights") return 1 + level * .15;
  return 1 + level * .04;
}
