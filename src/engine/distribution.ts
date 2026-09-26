import type { AxisKey, Cell, ChannelType, Contract, SKU, World } from "./types";
import { AXES, CHANNEL_TYPES, RETAIL_PARTNERS, clamp, sum } from "./industries";
import { contractAwarenessBoost, contractReach } from "./economics";
import { retailerAffinity } from "./productCatalog";
import { teamEffectiveness } from "./people";

export interface DistributionMetrics {
  contracts: Contract[];
  reach: number;
  onlineCoverage: number;
  awarenessBoost: number;
  marginCut: number;
  paymentDays: number;
}

export interface SkuChannelMixEntry {
  partnerId: string;
  partnerName: string;
  channelType: ChannelType;
  share: number;
  reach: number;
  productAffinity: number;
  marginCut: number;
  paymentDays: number;
  slotting: number;
  grossRevenuePerUnit: number;
  netRevenuePerUnit: number;
  contributionPerUnit: number;
}

export function contractsForSku(w: World, sku: SKU): Contract[] {
  const ids = new Set(sku.assignedPartnerIds ?? []);
  return w.player.contracts.filter((c) => ids.has(c.partnerId));
}

// Deterministic partner mix for both simulation attribution and product-page run-rate estimates.
// Shopper volume follows partner reach and product/retailer affinity; each resulting row retains
// that contract's own economics so the UI can estimate units, revenue and contribution by channel.
export function channelMixForSku(w: World, sku: SKU): SkuChannelMixEntry[] {
  const rows = contractsForSku(w, sku)
    .map((contract) => {
      const partner = RETAIL_PARTNERS.find((candidate) => candidate.id === contract.partnerId);
      const reach = contractReach(contract);
      const productAffinity = Math.max(0, retailerAffinity(sku.productKey, contract.partnerId, partner?.category, contract.type));
      return { contract, reach, productAffinity, weight: reach * productAffinity };
    })
    // Stable ordering makes rounding/remainders deterministic regardless of contract insertion order.
    .sort((a, b) => a.contract.partnerId.localeCompare(b.contract.partnerId));

  if (!rows.length) return [];
  const totalWeight = sum(rows.map((row) => row.weight));
  const fallbackShare = 1 / rows.length;
  return rows.map(({ contract, reach, productAffinity, weight }) => {
    const share = totalWeight > 0 ? weight / totalWeight : fallbackShare;
    const grossRevenuePerUnit = Math.max(0, sku.listPrice);
    const netRevenuePerUnit = grossRevenuePerUnit * (1 - contract.marginCut);
    return {
      partnerId: contract.partnerId,
      partnerName: contract.partnerName,
      channelType: contract.type,
      share,
      reach,
      productAffinity,
      marginCut: contract.marginCut,
      paymentDays: contract.paymentDays,
      slotting: contract.slotting,
      grossRevenuePerUnit,
      netRevenuePerUnit,
      contributionPerUnit: netRevenuePerUnit - sku.unitCost,
    };
  });
}

export function distributionMetricsForSku(w: World, sku: SKU): DistributionMetrics {
  const contracts = contractsForSku(w, sku);
  if (!contracts.length) return { contracts, reach: 0, onlineCoverage: 0, awarenessBoost: 0, marginCut: 0, paymentDays: 0 };
  const reaches = contracts.map(contractReach);
  const reachSum = sum(reaches);
  const reach = clamp(reachSum / 1.35);
  const onlineCoverage = clamp(sum(contracts.map((c, i) => reaches[i] * CHANNEL_TYPES[c.type].online)));
  const awarenessBoost = sum(contracts.map((c, i) => contractAwarenessBoost(c) * reaches[i]));
  const channelMix = channelMixForSku(w, sku);
  const marginCut = sum(channelMix.map((row) => row.marginCut * row.share));
  const paymentDays = sum(channelMix.map((row) => row.paymentDays * row.share));
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
  // Buildings add capacity, but relationships are still run by people.
  return teamEffectiveness(w, "operations") > 0 || teamEffectiveness(w, "strategy") > 0;
}


export function partnerSupportsIndustry(partnerId: string, industryId: string): boolean {
  const partner = RETAIL_PARTNERS.find((p) => p.id === partnerId);
  return Boolean(partner && (!partner.industries || partner.industries.includes(industryId)));
}

export function canNegotiatePartner(w: World, partnerId: string): boolean {
  // A founder can always open a basic DTC site. External retailers require a commercial capability.
  return partnerId === "own_web" || hasCommercialCapability(w);
}
