import type { World } from "./types";
import { productionCapacity } from "./capacity";
import { distributionMetricsForSku } from "./distribution";

export interface FounderStep {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  topTab: "mgmt" | "ops" | "mkt" | "fin";
  subTab: string;
}

export function founderJourney(w: World): FounderStep[] {
  const pms = w.player.personnel.filter((p) => p.role === "product_manager");
  const productRooms = w.player.operatingRooms.filter((r) => r.kind === "office" && r.team === "product");
  const seated = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
  const seatedPm = pms.some((p) => seated.has(p.id));
  const first = w.player.skus[0];
  const productionReady = first ? productionCapacity(w, first.method, first.supplierId) > 0 : w.player.operatingRooms.some((r) => r.kind === "factory" || r.kind === "outsourcing");
  const distributed = first ? distributionMetricsForSku(w, first).contracts.length > 0 : w.player.contracts.length > 0;
  const firstBatch = Boolean(first && (first.status === "manufacturing" || first.status === "active" || first.inventory > 0 || first.unitsSoldTotal > 0));
  const units = w.player.skus.reduce((a, s) => a + (s.unitsSoldTotal ?? 0), 0);

  const released = Boolean(first?.releasedToMarket);
  const launchReady = Boolean(first && first.inventory > 0 && first.listPrice > 0 && distributionMetricsForSku(w, first).contracts.length > 0);

  return [
    { id: "hire-pm", label: "Hire a Product Manager", detail: "Brief a recruiting agency and choose the person who will lead your first product.", done: pms.length > 0, topTab: "mgmt", subTab: "personnel" },
    { id: "seat-pm", label: "Seat the PM in Product", detail: "Click the Founder office on the campus and assign your PM to the product-team seat.", done: seatedPm, topTab: "mgmt", subTab: "hq" },
    { id: "design", label: "Design the first product", detail: "Create the product brief: category, audience, positioning, priorities, packaging and development depth.", done: Boolean(first), topTab: "ops", subTab: "products" },
    { id: "capacity", label: "Secure production capacity", detail: "Use a manufacturing partner through Sourcing, or build and configure your own factory.", done: productionReady, topTab: "mgmt", subTab: "hq" },
    { id: "batch", label: "Manufacture the first batch", detail: "After design completes, choose the manufacturer, production standard and first batch.", done: firstBatch, topTab: "ops", subTab: "products" },
    { id: "launch-plan", label: "Build the launch plan", detail: "With inventory ready, set price, target audience and retail channels.", done: launchReady, topTab: "ops", subTab: "products" },
    { id: "release", label: "Release the product", detail: "Launch when the commercial setup makes sense. Marketing can amplify fit; it cannot repair a bad one.", done: released, topTab: "ops", subTab: "products" },
    { id: "sale", label: "Win the first customers", detail: "Watch the launch convert into real sales, then diagnose what worked and what did not.", done: units > 0, topTab: "ops", subTab: "products" },
    { id: "traction", label: "Reach 10,000 lifetime units", detail: "Replenish, reprice, retarget and iterate until the business has real traction.", done: units >= 10_000, topTab: "ops", subTab: "products" },
  ];
}
