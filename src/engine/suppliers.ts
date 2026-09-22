// ============================================================================
// Outsourced manufacturing partners.
// These are intentionally simple in the vertical slice: each supplier creates a
// visible cost / speed / quality / scale trade-off. Relationship depth can be
// layered on later without changing the SKU contract.
// ============================================================================

import { archetypeByKey } from "./productCatalog";

export interface SupplierDef {
  id: string;
  name: string;
  label: string;
  costMult: number;
  leadTimeMult: number;
  qualityAdj: number;
  monthlyCapacity: number;
  reliability: number; // 0..1, currently descriptive; future disruption hook
  manufacturingFamilies: string[];
  desc: string;
}

export const SUPPLIERS: SupplierDef[] = [
  {
    id: "flexform",
    name: "FlexForm Labs",
    label: "Balanced",
    costMult: 1.0,
    leadTimeMult: 1.0,
    qualityAdj: 0,
    monthlyCapacity: 90_000,
    reliability: 0.9,
    manufacturingFamilies: ["chemical_mixing", "filling_packaging"],
    desc: "Balanced contract manufacturer. Good default for a growing skincare brand.",
  },
  {
    id: "rapidblend",
    name: "RapidBlend Manufacturing",
    label: "Fast",
    costMult: 1.12,
    leadTimeMult: 0.68,
    qualityAdj: -0.015,
    monthlyCapacity: 120_000,
    reliability: 0.86,
    manufacturingFamilies: ["chemical_mixing", "filling_packaging"],
    desc: "Pays for speed and flexible capacity. Useful when stock-outs are more expensive than margin.",
  },
  {
    id: "dermalabs",
    name: "DermaLabs Contract Manufacturing",
    label: "Premium",
    costMult: 1.18,
    leadTimeMult: 1.08,
    qualityAdj: 0.055,
    monthlyCapacity: 65_000,
    reliability: 0.96,
    manufacturingFamilies: ["chemical_mixing", "filling_packaging"],
    desc: "Excellent process control and testing. Expensive and slower, but noticeably improves delivered quality.",
  },
  {
    id: "valueworks",
    name: "ValueWorks Consumer Labs",
    label: "Low cost",
    costMult: 0.88,
    leadTimeMult: 1.22,
    qualityAdj: -0.055,
    monthlyCapacity: 150_000,
    reliability: 0.82,
    manufacturingFamilies: ["chemical_mixing", "filling_packaging"],
    desc: "Low-cost high-volume partner. Great for value products, risky for demanding premium customers.",
  },
  {
    id: "moldworks",
    name: "MoldWorks Consumer Products",
    label: "Toy generalist",
    costMult: 1.02, leadTimeMult: 1.0, qualityAdj: 0.005, monthlyCapacity: 140_000, reliability: 0.9,
    manufacturingFamilies: ["plastic_molding", "assembly", "printing"],
    desc: "Flexible toy manufacturer covering molded goods, assembly and printed pack-outs.",
  },
  {
    id: "softcraft",
    name: "SoftCraft Manufacturing",
    label: "Soft goods",
    costMult: 1.04, leadTimeMult: 0.95, qualityAdj: 0.025, monthlyCapacity: 95_000, reliability: 0.93,
    manufacturingFamilies: ["textile", "assembly"],
    desc: "Specialist in plush, sewn components and mixed soft-goods assembly.",
  },
  {
    id: "playprint",
    name: "PlayPrint Industries",
    label: "Print & games",
    costMult: 0.96, leadTimeMult: 0.9, qualityAdj: 0.0, monthlyCapacity: 170_000, reliability: 0.9,
    manufacturingFamilies: ["printing", "assembly"],
    desc: "High-throughput printed components, boxes and final assembly for games and paper-led products.",
  },
  {
    id: "sparkassembly",
    name: "Spark Assembly Group",
    label: "Electronics",
    costMult: 1.15, leadTimeMult: 1.12, qualityAdj: 0.035, monthlyCapacity: 70_000, reliability: 0.95,
    manufacturingFamilies: ["electronics_assembly", "plastic_molding", "assembly"],
    desc: "Higher-cost integrated electronics partner with stronger process control and testing discipline.",
  },
];

export const DEFAULT_SUPPLIER_ID = "flexform";

export function supplierById(id?: string | null): SupplierDef {
  return SUPPLIERS.find((s) => s.id === id) ?? SUPPLIERS[0];
}


export function supplierSupportsProduct(supplier: SupplierDef, productKey: string): boolean {
  const p = archetypeByKey(productKey);
  if (!p) return true;
  return p.manufacturingFamilies.every((family) => supplier.manufacturingFamilies.includes(family));
}

export function suppliersForProduct(productKey: string): SupplierDef[] {
  return SUPPLIERS.filter((supplier) => supplierSupportsProduct(supplier, productKey));
}
