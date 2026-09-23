import type { CampusPathTile, DeptTier, OperatingRoom, OperatingTeamKind, PersonnelRole, World } from "./types";
import type { StorageProfileId } from "./productCatalog";

export const OPERATING_ROOM_DEFS = {
  office: { label: "Office", size: [4, 4] as [number, number], buildCost: 25_000, monthlyCost: 6_000, capacity: 4 },
  factory: { label: "Factory", size: [6, 4] as [number, number], buildCost: 200_000, monthlyCost: 18_000, capacity: 100_000 },
  warehouse: { label: "Warehouse", size: [6, 4] as [number, number], buildCost: 70_000, monthlyCost: 8_000, capacity: 50_000 },
  outsourcing: { label: "Sourcing Office", size: [3, 2] as [number, number], buildCost: 40_000, monthlyCost: 7_000, capacity: 150_000 },
} as const;


export const WAREHOUSE_MODULE_COST: Record<Exclude<StorageProfileId, "standard">, number> = {
  climate: 90_000,
  refrigerated: 180_000,
  frozen: 300_000,
  secure: 220_000,
};

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

export function founderOffice(w: World): OperatingRoom | undefined {
  return w.player.operatingRooms.find((r) => r.id === "founder-office");
}

export function roleFitsRoom(role: PersonnelRole, room: OperatingRoom): boolean {
  // The first 4-seat founder office is deliberately flexible: one virtual founder slot +
  // three hired staff can cover Product, Sourcing/Operations and Marketing before departments exist.
  if (room.id === "founder-office") return true;
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
  const lv = Math.max(1, Math.floor(level));
  if (lv === 1) return { label: "Small Suburban Office", capacity: 4 };
  if (lv === 2) return { label: "Normal Office", capacity: 8 };
  if (lv === 3) return { label: "Large Office", capacity: 16 };
  if (lv === 4) return { label: "Massive Corporate HQ", capacity: 32 };
  return { label: `Corporate HQ · +${lv - 4} floor${lv - 4 === 1 ? "" : "s"}`, capacity: 32 + (lv - 4) * 8 };
}

export function facilityUpgradeQuote(room: OperatingRoom): FacilityUpgradeQuote | null {
  const currentLevel = Math.max(1, Math.floor(room.upgradeLevel ?? 1));
  const def = OPERATING_ROOM_DEFS[room.kind];
  if (room.kind === "office") {
    const current = officeStageForLevel(currentLevel);
    const next = officeStageForLevel(currentLevel + 1);
    const cost = currentLevel === 1 ? 75_000
      : currentLevel === 2 ? 220_000
        : currentLevel === 3 ? 900_000
          : Math.round(450_000 * Math.pow(1.35, currentLevel - 4));
    const monthlyCostGain = currentLevel === 1 ? 6_000 : currentLevel === 2 ? 10_000 : currentLevel === 3 ? 25_000 : 12_000;
    return { currentLevel, nextLevel: currentLevel + 1, maxLevel: null, cost, capacityGain: next.capacity - current.capacity, monthlyCostGain, currentLabel: current.label, nextLabel: next.label };
  }
  const maxLevel = 3;
  if (currentLevel >= maxLevel) return null;
  const capacityGain = room.kind === "warehouse" ? 25_000 : room.kind === "factory" ? 50_000 : 75_000;
  const cost = Math.round(def.buildCost * (currentLevel === 1 ? 0.60 : 0.90));
  const monthlyCostGain = Math.round(def.monthlyCost * 0.35);
  return { currentLevel, nextLevel: currentLevel + 1, maxLevel, cost, capacityGain, monthlyCostGain };
}

export function departmentTierFromSeats(seats: number): DeptTier {
  return seats >= 5 ? 3 : seats >= 3 ? 2 : seats >= 1 ? 1 : 0;
}

export function assignedSeatCount(w: World, team: OperatingTeamKind): number {
  const dedicated = w.player.operatingRooms
    .filter((r) => r.kind === "office" && r.team === team)
    .reduce((sum, r) => sum + r.assignedPersonnelIds.length, 0);
  // The Founder Office is deliberately cross-functional. A Finance or Strategy hire seated there
  // must count as real capability; otherwise the early-game flexible office would create a hidden
  // requirement for a dedicated department building that the UI never states.
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
    .filter((room) => room.kind === "office" && roleFitsRoom(role, room))
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
    const baseRoom = { ...room, upgradeLevel: room.upgradeLevel ?? 1 };
    if (room.kind !== "office") return { ...baseRoom, assignedPersonnelIds: [] };
    const assigned: string[] = [];
    for (const id of room.assignedPersonnelIds) {
      const p = personnelById.get(id);
      if (!validPersonnel.has(id) || !p || claimed.has(id) || !roleFitsRoom(p.role, room)) continue;
      const staffCapacity = room.id === "founder-office" ? Math.max(0, room.capacity - 1) : room.capacity;
      if (assigned.length >= staffCapacity) break;
      assigned.push(id);
      claimed.add(id);
    }
    return { ...baseRoom, assignedPersonnelIds: assigned };
  });
}

export function roomOperatingCostPerQuarter(w: World): number {
  return w.player.operatingRooms.reduce((sum, room) => sum + room.monthlyCost * 3, 0);
}
