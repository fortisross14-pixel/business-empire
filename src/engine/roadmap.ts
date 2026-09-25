import type { SKU, World } from "./types";
import { productProjectTierAccess } from "./capacity";
import { distributionMetricsForSku } from "./distribution";
import { hasResearch } from "./research";
import { teamEffectiveness } from "./people";
import { archetypeByKey } from "./productCatalog";

export interface GameRoute { top: string; sub: string; }

export interface RoadmapRequirement extends GameRoute {
  id: string;
  label: string;
  detail: string;
  done: boolean;
}

export interface RoadmapMilestone {
  id: string;
  kicker: string;
  title: string;
  outcome: string;
  complete: boolean;
  requirements: RoadmapRequirement[];
}

export interface LaunchReadiness {
  score: number;
  label: "Not ready" | "Needs attention" | "Credible launch" | "Strong launch";
  detail: string;
  firstLaunch: boolean;
  next: string;
  checks: { label: string; done: boolean; detail: string }[];
}

const route = (top: string, sub: string): GameRoute => ({ top, sub });

export function launchReadiness(world: World, sku: SKU, launchBudget = 0): LaunchReadiness {
  const archetype = archetypeByKey(sku.productKey);
  const priceBand = archetype?.priceBand ?? [1, 500];
  const distribution = distributionMetricsForSku(world, sku);
  const marketingReady = teamEffectiveness(world, "marketing") > 0;
  const firstLaunch = !world.player.skus.some((other) => other.id !== sku.id && other.releasedToMarket);
  const priceHealthy = sku.listPrice >= priceBand[0] && sku.listPrice <= priceBand[1];
  const checks = [
    { label: "Inventory", done: sku.inventory > 0, detail: sku.inventory > 0 ? `${Math.round(sku.inventory).toLocaleString()} units ready` : "First batch has not arrived" },
    { label: "Sales channel", done: distribution.contracts.length > 0, detail: distribution.contracts.length ? `${distribution.contracts.length} route${distribution.contracts.length > 1 ? "s" : ""} selected` : "Choose a signed retailer or your website" },
    { label: "Marketing owner", done: marketingReady, detail: marketingReady ? "A seated marketer can run the launch" : "Hire and seat a Marketing Specialist" },
    { label: "Price", done: priceHealthy, detail: priceHealthy ? `Inside the typical ${archetype?.label ?? "category"} price band` : `Typical band: $${priceBand[0]}–$${priceBand[1]}` },
  ];
  const score = Math.round(Math.min(100,
    (sku.inventory > 0 ? 28 : 0) +
    (distribution.contracts.length ? 18 + distribution.reach * 26 : 0) +
    (marketingReady ? 16 : 0) +
    (priceHealthy ? 12 : 0) +
    Math.min(10, launchBudget / 25_000 * 5) +
    sku.quality * 8,
  ));
  const label = score >= 80 ? "Strong launch" : score >= 60 ? "Credible launch" : score >= 35 ? "Needs attention" : "Not ready";
  const missing = checks.find((check) => !check.done);
  const detail = firstLaunch
    ? "Your first launch receives a small founder-led discovery push so a good, available product can begin earning without a hidden awareness dead zone."
    : "A launch needs availability, a route to market and a commercial owner. Advertising amplifies this setup; it does not replace it.";
  return { score, label, detail, firstLaunch, next: missing ? missing.detail : "The commercial plan is ready. Launch when you are comfortable with the first batch commitment.", checks };
}

function req(id: string, label: string, detail: string, done: boolean, target: GameRoute): RoadmapRequirement {
  return { id, label, detail, done, ...target };
}

export function companyRoadmap(world: World): RoadmapMilestone[] {
  const founderOffice = world.player.operatingRooms.find((room) => room.id === "founder-office");
  const researchCenter = world.player.operatingRooms.find((room) => room.facilityType === "research_center");
  const productPeople = world.player.personnel.filter((person) => person.role === "product_manager").length;
  const operationsPeople = world.player.personnel.filter((person) => person.role === "operations").length;
  const innovationPeople = world.player.personnel.filter((person) => person.role === "innovation").length;
  const firstSku = world.player.skus[0];
  const firstRevenue = (firstSku?.unitsSoldTotal ?? 0) > 0;
  const aaAccess = productProjectTierAccess(world, "AA", firstSku?.productKey);
  const aaaAccess = productProjectTierAccess(world, "AAA", firstSku?.productKey);

  return [
    {
      id: "first-revenue", kicker: "THE FIRST WIN", title: "Build a revenue engine", outcome: "A live product with its first customers proves the company can convert an idea into cash.", complete: firstRevenue,
      requirements: [
        req("first-product", "Create a product", "Turn one category into a real product project.", world.player.skus.length > 0, route("ops", "products")),
        req("first-batch", "Receive a first batch", "Fund a manageable inventory commitment and wait for it to arrive.", Boolean(firstSku && firstSku.inventory > 0), route("ops", "products")),
        req("first-launch", "Launch commercially", "Give the product a channel, price and marketing owner.", Boolean(firstSku?.releasedToMarket), route("ops", "products")),
        req("first-sale", "Win first customers", "Let the commercial loop run and use the product screen to learn from it.", firstRevenue, route("ops", "products")),
      ],
    },
    {
      id: "research-base", kicker: "ORGANIZE TO GROW", title: "Establish company development", outcome: "A Research Center and CIO make future growth choices explicit rather than cash-only gates.", complete: Boolean(researchCenter && innovationPeople > 0 && world.player.research.completed.length > 0),
      requirements: [
        req("grow-office", "Make room for growth", "Expand the Founder Office or add a compatible office before specialist facilities.", Boolean((founderOffice?.capacity ?? 0) >= 8), route("mgmt", "hq")),
        req("research-center", "Build a Research Center", "Give capability development a physical home on the campus.", Boolean(researchCenter), route("mgmt", "hq")),
        req("cio", "Hire a Chief Innovation Officer", "A CIO seated in the center owns company-development work.", innovationPeople > 0, route("mgmt", "personnel")),
        req("first-capability", "Complete a first capability", "Choose the unlock that best supports the next company bet.", world.player.research.completed.length > 0, route("mgmt", "research")),
      ],
    },
    {
      id: "aa-program", kicker: "PRODUCT SCALE", title: "Run an AA product program", outcome: "A Product Lead and Designer can build stronger, more differentiated products.", complete: aaAccess.ok && productPeople >= 2,
      requirements: [
        req("aa-research", "Research Advanced Product Development", "Unlock the coordination practices for an AA program.", hasResearch(world, "advanced_product_development"), route("mgmt", "research")),
        req("aa-office", "Create an 8-seat product workspace", "AA programs need a larger product-capable office or design center.", Math.max(0, ...world.player.operatingRooms.filter((room) => room.kind === "office").map((room) => room.capacity)) >= 8, route("mgmt", "hq")),
        req("aa-team", "Assemble a two-person product team", "An AA program needs an eligible Product Lead and Designer.", productPeople >= 2, route("mgmt", "personnel")),
      ],
    },
    {
      id: "talent-engine", kicker: "ORGANIZATION", title: "Build a talent engine", outcome: "Online and executive search let you deliberately shape a stronger company instead of waiting for the starter candidate pool.", complete: hasResearch(world, "executive_search"),
      requirements: [
        req("hr-foundations", "Research People & HR Foundations", "Unlock online recruiting searches.", hasResearch(world, "professional_recruiting"), route("mgmt", "research")),
        req("executive-search", "Research Executive Search", "Unlock deep searches for scarce senior talent.", hasResearch(world, "executive_search"), route("mgmt", "research")),
      ],
    },
    {
      id: "operations-scale", kicker: "OPERATIONS", title: "Own the supply chain", outcome: "Dedicated sourcing and factories improve capacity, cost control and resilience.", complete: hasResearch(world, "owned_manufacturing") && world.player.operatingRooms.some((room) => room.kind === "factory") && operationsPeople > 0,
      requirements: [
        req("supplier-management", "Research Supplier Management", "Unlock a dedicated sourcing function.", hasResearch(world, "supplier_management"), route("mgmt", "research")),
        req("owned-manufacturing", "Research Owned Manufacturing", "Learn the process and QA controls needed for a factory.", hasResearch(world, "owned_manufacturing"), route("mgmt", "research")),
        req("factory", "Build and staff a factory", "A factory still needs Operations ownership and compatible production lines.", world.player.operatingRooms.some((room) => room.kind === "factory") && operationsPeople > 0, route("mgmt", "hq")),
      ],
    },
    {
      id: "flagship", kicker: "FLAGSHIP AMBITION", title: "Earn the right to make AAA", outcome: "A mature innovation, product and organizational system can support a four-person flagship program.", complete: aaaAccess.ok && productPeople >= 4,
      requirements: [
        req("organization-scaling", "Research Organizational Scaling", "Prepare the company for a larger operating structure.", hasResearch(world, "organizational_scaling"), route("mgmt", "research")),
        req("flagship-research", "Research Flagship Product Development", "Unlock AAA product programs.", hasResearch(world, "flagship_product_development"), route("mgmt", "research")),
        req("aaa-workspace", "Build the flagship workspace", "AAA needs Research Center II plus the appropriate large product workspace.", aaaAccess.ok, route("mgmt", "hq")),
        req("aaa-team", "Assemble four product people", "A Product Lead plus three Designers run the flagship program.", productPeople >= 4, route("mgmt", "personnel")),
      ],
    },
  ];
}

export function nextRoadmapAction(world: World): RoadmapRequirement | null {
  return companyRoadmap(world).flatMap((milestone) => milestone.requirements).find((requirement) => !requirement.done) ?? null;
}
