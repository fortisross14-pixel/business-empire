import type { AxisKey, Cell, Contract, SKU, World } from "./types";
import { AXES, CHANNEL_TYPES, RETAIL_PARTNERS, clamp, sum } from "./industries";
import { contractAwarenessBoost, contractReach } from "./economics";
import { retailerAffinity } from "./productCatalog";

export interface DistributionMetrics {
  contracts: Contract[];
  reach: number;
  onlineCoverage: number;
  awarenessBoost: number;
  marginCut: number;
  paymentDays: number;
}

export function contractsForSku(w: World, sku: SKU): Contract[] {
  const ids = new Set(sku.assignedPartnerIds ?? []);
  return w.player.contracts.filter((c) => ids.has(c.partnerId));
}

export function distributionMetricsForSku(w: World, sku: SKU): DistributionMetrics {
  const contracts = contractsForSku(w, sku);
  if (!contracts.length) return { contracts, reach: 0, onlineCoverage: 0, awarenessBoost: 0, marginCut: 0, paymentDays: 0 };
  const reaches = contracts.map(contractReach);
  const reachSum = sum(reaches);
  const reach = clamp(reachSum / 1.35);
  const onlineCoverage = clamp(sum(contracts.map((c, i) => reaches[i] * CHANNEL_TYPES[c.type].online)));
  const awarenessBoost = sum(contracts.map((c, i) => contractAwarenessBoost(c) * reaches[i]));
  const marginCut = reachSum > 0 ? sum(contracts.map((c, i) => c.marginCut * reaches[i])) / reachSum : 0;
  const paymentDays = reachSum > 0 ? sum(contracts.map((c, i) => c.paymentDays * reaches[i])) / reachSum : 0;
  return { contracts, reach, onlineCoverage, awarenessBoost, marginCut, paymentDays };
}

// A named retailer is more than its channel type. Beauty Luxe should genuinely be better at
// reaching affluent beauty shoppers than ValueMart, while ValueMart over-indexes on budget buyers.
// The underlying 648-cell market remains intact; this turns partner demographic skew into gameplay.
export function partnerFitForCell(w: World, sku: SKU, cell: Cell): number {
  const contracts = contractsForSku(w, sku);
  if (!contracts.length) return 0;
  let best = 0;
  for (const contract of contracts) {
    const partner = RETAIL_PARTNERS.find((p) => p.id === contract.partnerId);
    let demographic = 1;
    if (partner) {
      for (const [axisRaw, skew] of Object.entries(partner.skew)) {
        const axis = axisRaw as AxisKey;
        const vals = AXES[axis];
        const idx = Math.max(0, vals.indexOf(cell.coord[axis]));
        const pos = vals.length <= 1 ? 0.5 : idx / (vals.length - 1);
        // Positive skew prefers the high end of an axis, negative the low end.
        demographic *= clamp(1 + Number(skew) * (pos - 0.5) * 0.8, 0.65, 1.35);
      }
    }
    const channelPreference = cell.channelPref[contract.type] ?? 0;
    const reachWeight = 0.75 + contractReach(contract) * 0.25;
    const productRetailFit = retailerAffinity(sku.productKey, contract.partnerId, partner?.category, contract.type);
    best = Math.max(best, channelPreference * demographic * reachWeight * productRetailFit);
  }
  const breadth = clamp(1 + (contracts.length - 1) * 0.05, 1, 1.18);
  return clamp(best * breadth, 0, 1);
}

export function deriveSkuChannels(w: World, sku: SKU) {
  sku.channels = Array.from(new Set(contractsForSku(w, sku).map((c) => c.type)));
}

export function hasCommercialCapability(w: World): boolean {
  const sourcing = w.player.operatingRooms.some((r) => r.kind === "outsourcing");
  if (sourcing) return true;
  const salesRooms = w.player.operatingRooms.filter((r) => r.kind === "office" && r.team === "sales");
  const seated = new Set(salesRooms.flatMap((r) => r.assignedPersonnelIds));
  return w.player.personnel.some((p) => (p.role === "operations" || p.role === "strategy") && seated.has(p.id));
}


export function partnerSupportsIndustry(partnerId: string, industryId: string): boolean {
  const partner = RETAIL_PARTNERS.find((p) => p.id === partnerId);
  return Boolean(partner && (!partner.industries || partner.industries.includes(industryId)));
}

export function canNegotiatePartner(w: World, partnerId: string): boolean {
  // A founder can always open a basic DTC site. External retailers require a commercial capability.
  return partnerId === "own_web" || hasCommercialCapability(w);
}
