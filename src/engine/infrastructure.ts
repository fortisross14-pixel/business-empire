import type { DeptTier, OperatingRoom, OperatingTeamKind, PersonnelRole, World } from "./types";

export const OPERATING_ROOM_DEFS = {
  office: { label: "Office", size: [4, 4] as [number, number], buildCost: 25_000, monthlyCost: 6_000, capacity: 6 },
  factory: { label: "Factory", size: [6, 4] as [number, number], buildCost: 200_000, monthlyCost: 18_000, capacity: 100_000 },
  warehouse: { label: "Warehouse", size: [6, 4] as [number, number], buildCost: 70_000, monthlyCost: 8_000, capacity: 50_000 },
  outsourcing: { label: "Sourcing Office", size: [3, 2] as [number, number], buildCost: 40_000, monthlyCost: 7_000, capacity: 150_000 },
} as const;


export interface FacilityUpgradeQuote {
  currentLevel: number;
  nextLevel: number;
  maxLevel: number;
  cost: number;
  capacityGain: number;
  monthlyCostGain: number;
}

export function facilityUpgradeQuote(room: OperatingRoom): FacilityUpgradeQuote | null {
  const currentLevel = Math.max(1, Math.min(3, room.upgradeLevel ?? 1));
  if (currentLevel >= 3) return null;
  const def = OPERATING_ROOM_DEFS[room.kind];
  const capacityGain = room.id === "founder-office"
    ? 2
    : room.kind === "office"
      ? 3
      : room.kind === "warehouse"
        ? 25_000
        : room.kind === "factory"
          ? 50_000
          : 75_000;
  const cost = Math.round(def.buildCost * (currentLevel === 1 ? 0.60 : 0.90));
  const monthlyCostGain = Math.round(def.monthlyCost * 0.35);
  return { currentLevel, nextLevel: currentLevel + 1, maxLevel: 3, cost, capacityGain, monthlyCostGain };
}

export function departmentTierFromSeats(seats: number): DeptTier {
  return seats >= 5 ? 3 : seats >= 3 ? 2 : seats >= 1 ? 1 : 0;
}

export function assignedSeatCount(w: World, team: OperatingTeamKind): number {
  return w.player.operatingRooms
    .filter((r) => r.kind === "office" && r.team === team)
    .reduce((sum, r) => sum + r.assignedPersonnelIds.length, 0);
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
  if (team === "operations" || team === "sales") return role === "operations" || role === "strategy";
  return false;
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
      if (!validPersonnel.has(id) || !p || claimed.has(id) || !roleFitsTeam(p.role, room.team)) continue;
      if (assigned.length >= room.capacity) break;
      assigned.push(id);
      claimed.add(id);
    }
    return { ...baseRoom, assignedPersonnelIds: assigned };
  });
}

export function roomOperatingCostPerQuarter(w: World): number {
  return w.player.operatingRooms.reduce((sum, room) => sum + room.monthlyCost * 3, 0);
}
