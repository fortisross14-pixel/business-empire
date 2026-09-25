import type { AxisKey, CampaignAction, CampaignRuntime, DecisionEvent, GameEffect, OperatingRoom, Personnel, ProductProjectTier, World } from "./types";
import { AXIS_KEYS, INDUSTRIES, RETAIL_PARTNERS, clamp } from "./industries";
import { initWorld, buildSku } from "./world";
import { defaultBrandVisual } from "./brands";
import { ensureIndustryMarket } from "./markets";
import { deriveSkuChannels } from "./distribution";
import { syncDerivedDepartments } from "./infrastructure";
import { defaultFactoryFamiliesForIndustry } from "./productCatalog";

export const CAMPAIGN_PROFILE_KEY = "market-sim:campaign-profile-v1";
export const SCENARIOS_UNLOCK_STARS = 3;
export const SANDBOX_UNLOCK_STARS = 5;

export interface CampaignProfile {
  bestStarsByCase: Record<string, number>;
  totalStars: number;
  completedCases: number;
}

export type CampaignMetric =
  | "monthly_revenue" | "quarterly_profit" | "cash" | "debt" | "market_share" | "market_rank"
  | "inventory_reduction" | "inventory_units" | "active_products" | "released_products" | "new_released_products"
  | "archived_products" | "contracts" | "owned_ip_products" | "max_review" | "businesses" | "decisions" | "elapsed_days"
  | "flagship_monthly_revenue";

export interface CampaignRequirement {
  metric: CampaignMetric;
  operator: ">=" | "<=" | "=";
  target: number;
  label: string;
  scope?: string;
  format?: "money" | "percent" | "number" | "days" | "rank";
}

export interface CampaignStarTier {
  stars: 1 | 2 | 3;
  title: string;
  requirements: CampaignRequirement[];
}

export interface CampaignConstraints {
  forbid?: CampaignAction[];
  maxNewFacilities?: number;
  maxActiveProducts?: number;
  maxBrands?: number;
  notes?: string[];
}

export interface CampaignEventDefinition {
  id: string;
  day: number;
  icon: string;
  title: string;
  description: string;
  context: string;
  choices: { id: string; label: string; summary: string; immediateText: string; immediate: GameEffect; delayedText?: string; delayed?: { days: number; effects: GameEffect } }[];
}

export interface CampaignCaseDefinition {
  id: string;
  order: number;
  icon: string;
  name: string;
  subtitle: string;
  brief: string;
  lesson: string;
  industryId: string;
  company: string;
  unlockStars: number;
  durationDays: number;
  difficulty: "Intro" | "Intermediate" | "Advanced" | "Capstone";
  seed: "flagship" | "warehouse" | "legacy" | "challenger" | "niche" | "luxury" | "coldchain" | "licensing" | "portfolio" | "supply" | "debt" | "board";
  constraints: CampaignConstraints;
  stars: CampaignStarTier[];
  events: CampaignEventDefinition[];
}

const req = (metric: CampaignMetric, operator: CampaignRequirement["operator"], target: number, label: string, format: CampaignRequirement["format"] = "number", scope?: string): CampaignRequirement => ({ metric, operator, target, label, format, scope });
const tier = (stars: 1 | 2 | 3, title: string, requirements: CampaignRequirement[]): CampaignStarTier => ({ stars, title, requirements });
const decision = (id: string, day: number, icon: string, title: string, description: string, context: string, choices: CampaignEventDefinition["choices"]): CampaignEventDefinition => ({ id, day, icon, title, description, context, choices });

export const CAMPAIGN_CASES: CampaignCaseDefinition[] = [
  {
    id:"success_story",order:1,icon:"🚀",name:"Success Story",subtitle:"A brilliant design needs a market",industryId:"toys",company:"Northstar Play",unlockStars:0,durationDays:360,difficulty:"Intro",seed:"flagship",
    brief:"Northstar owns a 4.6★ toy design, a factory and plenty of cash—but the product is still sitting on a prototype table. Choose a segment, manufacturing plan, channels and launch support that can turn quality into revenue.",
    lesson:"Product quality creates potential. Targeting, route to market and pricing convert that potential into a business.",constraints:{ notes:["The flagship design is ready for manufacture.","The company has enough capital to test more than one commercial approach."] },
    stars:[
      tier(1,"Prove demand",[req("flagship_monthly_revenue",">=",75_000,"Flagship monthly revenue","money","case_flagship")]),
      tier(2,"Build a growth engine",[req("flagship_monthly_revenue",">=",175_000,"Flagship monthly revenue","money","case_flagship"),req("market_share",">=",.025,"Company market share","percent")]),
      tier(3,"Create a breakout",[req("flagship_monthly_revenue",">=",300_000,"Flagship monthly revenue","money","case_flagship"),req("quarterly_profit",">=",100_000,"Quarterly profit","money"),req("elapsed_days","<=",270,"Finish within 9 months","days")]),
    ],
    events:[decision("unexpected_fans",70,"🎯","An unexpected fan base","Early orders show the product is resonating with collectors, not the broad family audience in the original plan.","The product can stay broad, pivot toward the smaller high-margin group, or fund a quick study before committing.",[
      {id:"pivot",label:"Lean into collectors",summary:"Trade volume for pricing power.",immediateText:"The flagship pivots to an affluent, younger audience; momentum rises.",immediate:{targetSkuId:"case_flagship",retargetTo:{gender:.5,age:.15,class:.9,leaning:.5,geography:.65,family:.25},targetLabel:"Urban collectors",momentumDelta:.14}},
      {id:"broad",label:"Stay with families",summary:"Keep the larger market and broad channels.",immediateText:"The team holds the family strategy and increases awareness.",immediate:{targetSkuId:"case_flagship",awarenessDelta:.035}},
      {id:"research",label:"Validate first",summary:"Spend cash to reduce the guesswork.",immediateText:"A rapid research sprint clarifies the audience and protects momentum.",immediate:{cash:-60_000,targetSkuId:"case_flagship",momentumDelta:.06}},
    ])],
  },
  {
    id:"full_warehouse",order:2,icon:"📦",name:"The Full Warehouse",subtitle:"Cash is trapped in a confused portfolio",industryId:"food",company:"Daily Table Foods",unlockStars:0,durationDays:300,difficulty:"Intro",seed:"warehouse",
    brief:"Six products, too much inventory and no leadership position. Archive the distractions, use discounts or better targeting to move stock, and leave the company with a focused three-product business.",
    lesson:"Portfolio strategy is the choice of what not to support. Inventory is cash wearing a cardboard box.",constraints:{ maxActiveProducts:3, notes:["Finish with no more than three active products.","Archived products keep their commercial history."] },
    stars:[
      tier(1,"Stop the pile-up",[req("inventory_reduction",">=",.4,"Reduce opening inventory","percent"),req("active_products","<=",3,"Active products","number")]),
      tier(2,"Recover the cash",[req("inventory_reduction",">=",.68,"Reduce opening inventory","percent"),req("active_products","<=",3,"Active products","number"),req("quarterly_profit",">=",0,"Return to break-even","money")]),
      tier(3,"Build a focused winner",[req("inventory_reduction",">=",.88,"Reduce opening inventory","percent"),req("active_products","<=",3,"Active products","number"),req("monthly_revenue",">=",220_000,"Focused monthly revenue","money")]),
    ],
    events:[decision("clearance_offer",35,"🏷️","National clearance offer","ValueMart will take a large mixed shipment, but only at a painful discount.","The deal can free cash and space immediately, while a slower selective sell-down may preserve margin.",[
      {id:"clear",label:"Take the clearance deal",summary:"Move inventory now, lose margin.",immediateText:"Opening inventory falls sharply and cash is released.",immediate:{inventoryPct:-.3,cash:180_000,pricePct:-.08,momentumDelta:-.04}},
      {id:"selective",label:"Discount weak lines only",summary:"A smaller, more controlled clean-up.",immediateText:"Inventory falls modestly while the core portfolio keeps its positioning.",immediate:{inventoryPct:-.16,cash:95_000}},
      {id:"hold",label:"Protect price",summary:"Keep margin and sell through normally.",immediateText:"The company declines the deal and keeps the original price architecture.",immediate:{investorConfidenceDelta:-.04}},
    ])],
  },
  {
    id:"old_brand_new_customer",order:3,icon:"🧭",name:"Old Brand, New Customer",subtitle:"Restructure without buying a new organization",industryId:"apparel",company:"Heritage Thread",unlockStars:0,durationDays:420,difficulty:"Intro",seed:"legacy",
    brief:"Heritage Thread has deep equity with an ageing customer group, strong supplier contracts and a capable team. Growth must come from a new audience using the people, channels and campus already in place.",
    lesson:"A turnaround is a constrained reallocation problem: decide which assets transfer, which assumptions do not, and where the brand can credibly stretch.",constraints:{forbid:["hire","recruit","sign_contract","remove_contract","raise_capital"],maxNewFacilities:1,maxBrands:1,notes:["No hiring or new channel contracts.","You may build at most one facility.","Use the existing brand and team."]},
    stars:[
      tier(1,"Find a new customer",[req("new_released_products",">=",1,"Release a new product","number"),req("monthly_revenue",">=",70_000,"Company monthly revenue","money")]),
      tier(2,"Make the pivot viable",[req("new_released_products",">=",1,"Release a new product","number"),req("monthly_revenue",">=",160_000,"Company monthly revenue","money"),req("quarterly_profit",">=",0,"Quarterly profit","money")]),
      tier(3,"Renew the franchise",[req("new_released_products",">=",2,"Release two new products","number"),req("monthly_revenue",">=",280_000,"Company monthly revenue","money"),req("max_review",">=",3.4,"Best live review score","number")]),
    ],
    events:[decision("legacy_account",90,"🏬","A legacy account pushes back","Heritage House says a younger assortment may confuse the customers who built the brand.","The team can preserve a heritage capsule, commit fully to the new audience, or create clearer merchandising inside the same account.",[
      {id:"capsule",label:"Protect a heritage capsule",summary:"Keep older buyers reassured.",immediateText:"Customer satisfaction rises, but the pivot loses some momentum.",immediate:{customerSatisfactionDelta:.04,momentumDelta:-.03}},
      {id:"commit",label:"Commit to the pivot",summary:"Accept short-term friction for a clearer strategy.",immediateText:"The new direction gains momentum while legacy trust softens.",immediate:{momentumDelta:.11,customerSatisfactionDelta:-.025}},
      {id:"merchandise",label:"Split the presentation",summary:"Pay for distinct in-store stories.",immediateText:"Cash funds clearer merchandising and protects both audiences.",immediate:{cash:-85_000,awarenessDelta:.025}},
    ])],
  },
  {
    id:"snack_wars",order:4,icon:"🥤",name:"Snack Wars",subtitle:"Overtake the category leader",industryId:"food",company:"BrightFizz Foods",unlockStars:3,durationDays:720,difficulty:"Intermediate",seed:"challenger",
    brief:"You are the well-funded number-two player in a concentrated snack market. Use an advanced campus, aggressive channel strategy and brand investment to take the lead before the two-year clock expires.",lesson:"Share leadership can be bought briefly, but profitable leadership requires a system competitors cannot easily copy.",constraints:{notes:["A large campus and experienced team are already operating.","The rival will answer visible moves through the normal competitive engine."]},
    stars:[tier(1,"Take the lead",[req("market_rank","<=",1,"Market rank","rank")]),tier(2,"Win decisively",[req("market_rank","<=",1,"Market rank","rank"),req("market_share",">=",.16,"Market share","percent"),req("quarterly_profit",">=",0,"Quarterly profit","money")]),tier(3,"Win fast",[req("market_rank","<=",1,"Market rank","rank"),req("market_share",">=",.2,"Market share","percent"),req("elapsed_days","<=",540,"Finish within 18 months","days")])],events:[decision("price_war",120,"⚔️","The leader cuts price","The category leader responds to your momentum with a national price cut.","Match it, differentiate harder, or protect margin and wait.",[{id:"match",label:"Match the cut",summary:"Defend volume.",immediateText:"Prices fall and awareness rises.",immediate:{pricePct:-.09,awarenessDelta:.035}},{id:"brand",label:"Differentiate",summary:"Spend on brand and product meaning.",immediateText:"The company invests to protect pricing power.",immediate:{cash:-180_000,momentumDelta:.12}},{id:"hold",label:"Hold price",summary:"Protect margin and accept pressure.",immediateText:"Margin is protected but momentum softens.",immediate:{momentumDelta:-.07}}])],
  },
  {
    id:"quiet_hit",order:5,icon:"🎯",name:"The Quiet Hit",subtitle:"Scale a beloved niche without breaking it",industryId:"skincare",company:"Stillwater Labs",unlockStars:4,durationDays:450,difficulty:"Intermediate",seed:"niche",brief:"A small audience loves one specialist product, but broad retail expansion could dilute the proposition. Grow revenue while protecting review quality and margin.",lesson:"A small market can be a great business when willingness to pay, loyalty and cost-to-serve align.",constraints:{maxActiveProducts:2,notes:["Keep the portfolio intentionally small."]},stars:[tier(1,"Protect the niche",[req("monthly_revenue",">=",100_000,"Monthly revenue","money"),req("max_review",">=",3.5,"Best review","number")]),tier(2,"Scale carefully",[req("monthly_revenue",">=",210_000,"Monthly revenue","money"),req("quarterly_profit",">=",80_000,"Quarterly profit","money")]),tier(3,"Create a category icon",[req("monthly_revenue",">=",340_000,"Monthly revenue","money"),req("market_share",">=",.08,"Market share","percent"),req("active_products","<=",2,"Active products","number")])],events:[decision("mass_retail_call",80,"📞","Mass retail comes calling","ValueMart offers national reach, but the account expects lower prices and promotional volume.","Choose whether the niche should become a mass product.",[{id:"accept",label:"Accept national reach",summary:"Trade margin for scale.",immediateText:"Awareness jumps, prices and momentum soften.",immediate:{awarenessDelta:.06,pricePct:-.08,momentumDelta:-.03}},{id:"decline",label:"Stay selective",summary:"Protect focus and prestige.",immediateText:"The brand keeps its focus and gains prestige momentum.",immediate:{momentumDelta:.08}},{id:"pilot",label:"Run a limited pilot",summary:"Pay to test before scaling.",immediateText:"A controlled test lifts awareness without a full repositioning.",immediate:{cash:-70_000,awarenessDelta:.025}}])],
  },
  {
    id:"luxury_trap",order:6,icon:"💎",name:"The Luxury Trap",subtitle:"High prices, weak economics",industryId:"apparel",company:"Maison Arden",unlockStars:5,durationDays:420,difficulty:"Intermediate",seed:"luxury",brief:"A prestigious label gets attention but destroys cash through expensive materials, weak sell-through and undisciplined assortment. Restore luxury economics without turning the brand into a discount line.",lesson:"Price is not positioning. Luxury requires scarcity, meaning, exceptional execution and cost discipline.",constraints:{forbid:["borrow"],maxActiveProducts:3,notes:["No new debt.","Protect a focused luxury assortment."]},stars:[tier(1,"Stop the burn",[req("quarterly_profit",">=",0,"Quarterly profit","money")]),tier(2,"Restore pricing power",[req("quarterly_profit",">=",180_000,"Quarterly profit","money"),req("max_review",">=",3.8,"Best review","number")]),tier(3,"Build disciplined luxury",[req("quarterly_profit",">=",320_000,"Quarterly profit","money"),req("inventory_reduction",">=",.65,"Reduce opening inventory","percent"),req("active_products","<=",3,"Active products","number")])],events:[decision("celebrity_request",60,"✨","A celebrity requests a capsule","The partnership could create heat, but requires a large guarantee and risks overexposure.","Luxury attention is valuable only when the economics and audience fit.",[{id:"full",label:"Fund the capsule",summary:"Take the big cultural bet.",immediateText:"Cash falls while momentum and awareness jump.",immediate:{cash:-250_000,momentumDelta:.18,awarenessDelta:.05}},{id:"limited",label:"Create a limited drop",summary:"Constrain supply and spend.",immediateText:"A small investment creates measured momentum.",immediate:{cash:-90_000,momentumDelta:.09}},{id:"pass",label:"Protect the house",summary:"Keep focus on product craft.",immediateText:"The company passes and protects cash.",immediate:{investorConfidenceDelta:-.02}}])],
  },
  {
    id:"forty_five_days_cold",order:7,icon:"❄️",name:"Forty-Five Days Cold",subtitle:"A logistics disruption threatens launch",industryId:"food",company:"Arctic Spoon",unlockStars:6,durationDays:270,difficulty:"Advanced",seed:"coldchain",brief:"A frozen launch is ready, but the cold-chain partner has failed. Reconfigure capacity and protect retailer service before a seasonal window closes.",lesson:"Operations strategy is customer strategy when availability, quality and time are linked.",constraints:{forbid:["raise_capital"],notes:["The seasonal launch window is short.","Equity funding is unavailable during the crisis."]},stars:[tier(1,"Save the launch",[req("new_released_products",">=",1,"Release the delayed product","number")]),tier(2,"Recover service",[req("monthly_revenue",">=",180_000,"Monthly revenue","money"),req("inventory_units",">=",1_000,"Maintain sellable inventory","number")]),tier(3,"Turn crisis into capability",[req("monthly_revenue",">=",300_000,"Monthly revenue","money"),req("quarterly_profit",">=",70_000,"Quarterly profit","money"),req("elapsed_days","<=",210,"Finish within 7 months","days")])],events:[decision("port_delay",20,"🚢","The backup route slips again","The only available refrigerated route adds three weeks unless the team pays for emergency air freight.","Speed protects the launch window; resilience protects the next one.",[{id:"air",label:"Use emergency freight",summary:"Pay heavily to preserve timing.",immediateText:"Cash falls and manufacturing timing improves.",immediate:{cash:-180_000,manufacturingDaysPct:-.35}},{id:"wait",label:"Wait for sea freight",summary:"Protect cash, lose time.",immediateText:"Inbound manufacturing is delayed.",immediate:{manufacturingDaysPct:.45}},{id:"local",label:"Qualify a local backup",summary:"Invest now for a more resilient system.",immediateText:"Cash falls; the current delay is smaller and future material costs improve.",immediate:{cash:-120_000,manufacturingDaysPct:.12,materialCostPct:-.04}}])],
  },
  {
    id:"licensing_bet",order:8,icon:"🎬",name:"The Licensing Bet",subtitle:"Turn borrowed attention into owned value",industryId:"toys",company:"Orbit Toyworks",unlockStars:8,durationDays:540,difficulty:"Advanced",seed:"licensing",brief:"A major licensed toy can open doors, but royalties and fatigue can leave the company with nothing durable. Use the launch to create cash and an owned follow-up franchise.",lesson:"Licensing rents demand. Strategy decides whether rented attention becomes an owned capability or permanent dependence.",constraints:{notes:["The opening licensed product has a limited commercial window."]},stars:[tier(1,"Make the license pay",[req("monthly_revenue",">=",190_000,"Monthly revenue","money")]),tier(2,"Create an owned successor",[req("owned_ip_products",">=",1,"Released owned-IP products","number"),req("quarterly_profit",">=",0,"Quarterly profit","money")]),tier(3,"Own the sequel",[req("owned_ip_products",">=",1,"Released owned-IP products","number"),req("monthly_revenue",">=",380_000,"Monthly revenue","money"),req("max_review",">=",4,"Best review","number")])],events:[decision("license_extension",150,"📜","The licensor offers an extension","The price of certainty is a higher royalty and a large guarantee.","Extend the hit, build your own universe, or run both paths.",[{id:"extend",label:"Extend the license",summary:"Protect near-term sales.",immediateText:"Cash falls and the licensed portfolio gains momentum.",immediate:{cash:-220_000,momentumDelta:.12}},{id:"owned",label:"Fund owned IP",summary:"Accept a slower, more durable path.",immediateText:"The team protects cash for owned development and gains investor confidence.",immediate:{investorConfidenceDelta:.06}},{id:"both",label:"Run both bets",summary:"Spend heavily for option value.",immediateText:"Cash falls sharply; awareness and momentum rise.",immediate:{cash:-360_000,awarenessDelta:.04,momentumDelta:.08}}])],
  },
  {
    id:"two_brands_one_campus",order:9,icon:"🏷️",name:"Two Brands, One Campus",subtitle:"Share capabilities without blurring strategy",industryId:"skincare",company:"Morrow Consumer",unlockStars:10,durationDays:600,difficulty:"Advanced",seed:"portfolio",brief:"A mass brand and a premium brand share one campus, one leadership team and too many overlapping products. Clarify roles and make both businesses economically coherent.",lesson:"Synergy is valuable only when shared assets do not erase brand meaning.",constraints:{maxBrands:2,maxNewFacilities:2,notes:["Keep the existing two-brand architecture.","Build at most two additional facilities."]},stars:[tier(1,"Clarify the portfolio",[req("archived_products",">=",2,"Archive overlapping products","number"),req("quarterly_profit",">=",0,"Quarterly profit","money")]),tier(2,"Make both brands productive",[req("monthly_revenue",">=",300_000,"Monthly revenue","money"),req("active_products","<=",4,"Active products","number")]),tier(3,"Create a portfolio advantage",[req("monthly_revenue",">=",520_000,"Monthly revenue","money"),req("quarterly_profit",">=",220_000,"Quarterly profit","money"),req("max_review",">=",4,"Best review","number")])],events:[decision("shared_launch",110,"🧪","One formula, two brands","The R&D team proposes adapting one formula for both labels to save time and cost.","The move creates efficiency but may make the premium promise feel artificial.",[{id:"share",label:"Share the platform",summary:"Take the synergy.",immediateText:"Cash is saved, but portfolio momentum softens.",immediate:{cash:110_000,momentumDelta:-.035}},{id:"separate",label:"Keep distinct formulas",summary:"Protect strategic clarity.",immediateText:"Cash funds distinct development and momentum improves.",immediate:{cash:-120_000,momentumDelta:.08}},{id:"mass_only",label:"Use it only for mass",summary:"Keep premium differentiation.",immediateText:"The company captures part of the saving without full dilution.",immediate:{cash:55_000}}])],
  },
  {
    id:"silicon_supply",order:10,icon:"⚡",name:"Silicon Supply",subtitle:"Choose which customers receive scarce units",industryId:"electronics",company:"Vector Home",unlockStars:12,durationDays:450,difficulty:"Advanced",seed:"supply",brief:"A component shortage cuts available supply just as two electronics products gain traction. Allocate production, protect the right channels and avoid turning a shortage into customer defection.",lesson:"Scarcity reveals strategy: every unit sent to one customer is a unit withheld from another.",constraints:{forbid:["enter_industry"],maxActiveProducts:3,notes:["No industry expansion during the supply crisis."]},stars:[tier(1,"Stay solvent",[req("cash",">=",0,"Cash balance","money"),req("quarterly_profit",">=",0,"Quarterly profit","money")]),tier(2,"Protect the franchise",[req("monthly_revenue",">=",260_000,"Monthly revenue","money"),req("max_review",">=",3.7,"Best review","number")]),tier(3,"Win through scarcity",[req("monthly_revenue",">=",450_000,"Monthly revenue","money"),req("market_share",">=",.1,"Market share","percent"),req("inventory_units",">=",500,"Inventory buffer","number")])],events:[decision("chip_allocation",45,"🔌","A supplier offers priority allocation","Priority components are available at a steep premium and require a six-month commitment.","Pay for certainty, redesign around a weaker part, or focus supply on the flagship.",[{id:"priority",label:"Buy priority allocation",summary:"Protect volume at a high cost.",immediateText:"Cash falls; manufacturing accelerates.",immediate:{cash:-260_000,manufacturingDaysPct:-.28}},{id:"redesign",label:"Qualify a substitute",summary:"Accept quality risk to protect supply.",immediateText:"Manufacturing improves while product quality softens.",immediate:{cash:-90_000,manufacturingDaysPct:-.12,qualityDelta:-.04}},{id:"flagship",label:"Protect the flagship",summary:"Concentrate scarce supply.",immediateText:"Portfolio momentum concentrates around the best products.",immediate:{momentumDelta:.07,inventoryPct:-.12}}])],
  },
  {
    id:"debt_covenant",order:11,icon:"🏦",name:"The Debt Covenant",subtitle:"Grow without breaching the agreement",industryId:"food",company:"Common Ground Foods",unlockStars:14,durationDays:540,difficulty:"Capstone",seed:"debt",brief:"A leveraged acquisition is profitable on paper but close to its debt covenant. Improve cash generation, reduce leverage and preserve enough growth to keep the board supportive.",lesson:"Accounting profit, operating cash flow and financing capacity are different constraints.",constraints:{forbid:["borrow","raise_capital"],maxNewFacilities:1,notes:["No additional debt or equity.","Build at most one new facility."]},stars:[tier(1,"Avoid default",[req("cash",">=",0,"Cash balance","money"),req("quarterly_profit",">=",0,"Quarterly profit","money")]),tier(2,"Restore headroom",[req("debt","<=",1_000_000,"Debt","money"),req("quarterly_profit",">=",180_000,"Quarterly profit","money")]),tier(3,"Earn strategic freedom",[req("debt","<=",500_000,"Debt","money"),req("monthly_revenue",">=",420_000,"Monthly revenue","money"),req("quarterly_profit",">=",300_000,"Quarterly profit","money")])],events:[decision("covenant_review",90,"📋","The lender schedules a covenant review","The bank wants evidence of action before the next quarter closes.","Cut growth spend, sell inventory aggressively, or ask suppliers for longer terms.",[{id:"cut",label:"Cut growth spend",summary:"Protect cash immediately.",immediateText:"Cash is preserved but awareness falls.",immediate:{cash:120_000,awarenessDelta:-.025}},{id:"inventory",label:"Liquidate inventory",summary:"Convert stock to cash.",immediateText:"Inventory falls and cash rises while prices soften.",immediate:{inventoryPct:-.22,cash:190_000,pricePct:-.06}},{id:"terms",label:"Renegotiate terms",summary:"Pay a fee for working-capital relief.",immediateText:"Cash buys a material-cost improvement and confidence.",immediate:{cash:-70_000,materialCostPct:-.06,investorConfidenceDelta:.04}}])],
  },
  {
    id:"boards_portfolio",order:12,icon:"🏛️",name:"The Board’s Portfolio",subtitle:"Allocate capital across three businesses",industryId:"electronics",company:"Arclight Group",unlockStars:16,durationDays:720,difficulty:"Capstone",seed:"board",brief:"A diversified group owns healthy, weak and promising businesses. The board expects a coherent allocation of capital—not equal attention for every division.",lesson:"Corporate strategy is resource allocation under uncertainty. A portfolio creates value only when the parent makes better choices than independent owners would.",constraints:{maxNewFacilities:3,notes:["Three businesses are active from day one.","Build at most three additional facilities."]},stars:[tier(1,"Stabilize the group",[req("quarterly_profit",">=",0,"Group quarterly profit","money"),req("businesses",">=",3,"Active businesses","number")]),tier(2,"Create portfolio value",[req("monthly_revenue",">=",650_000,"Group monthly revenue","money"),req("quarterly_profit",">=",300_000,"Group quarterly profit","money")]),tier(3,"Build an enduring group",[req("monthly_revenue",">=",1_000_000,"Group monthly revenue","money"),req("quarterly_profit",">=",650_000,"Group quarterly profit","money"),req("market_share",">=",.12,"Primary market share","percent")])],events:[decision("board_review",180,"🗳️","The board demands a capital choice","Directors will fund one major priority: defend the cash cow, accelerate the growth business, or repair the weakest division.","The decision will shape the next year of the portfolio.",[{id:"defend",label:"Defend the cash cow",summary:"Prioritize reliable earnings.",immediateText:"Cash and confidence improve, but growth momentum cools.",immediate:{cash:180_000,investorConfidenceDelta:.05,momentumDelta:-.025}},{id:"grow",label:"Back the growth business",summary:"Trade cash for momentum.",immediateText:"The group funds acceleration across active products.",immediate:{cash:-250_000,momentumDelta:.15,awarenessDelta:.03}},{id:"repair",label:"Fix the weak division",summary:"Invest in operations and quality.",immediateText:"Cash funds quality improvements across the portfolio.",immediate:{cash:-180_000,qualityDelta:.045,materialCostPct:-.03}}])],
  },
];

export const CAMPAIGN_CASE_BY_ID = Object.fromEntries(CAMPAIGN_CASES.map((item) => [item.id, item])) as Record<string, CampaignCaseDefinition>;

export function loadCampaignProfile(): CampaignProfile {
  const empty: CampaignProfile = { bestStarsByCase:{}, totalStars:0, completedCases:0 };
  if (typeof localStorage === "undefined") return empty;
  try {
    const parsed = JSON.parse(localStorage.getItem(CAMPAIGN_PROFILE_KEY) ?? "null") as Partial<CampaignProfile> | null;
    const bestStarsByCase = parsed?.bestStarsByCase ?? {};
    return { bestStarsByCase, totalStars:Object.values(bestStarsByCase).reduce((sum, value) => sum + clamp(Number(value) || 0, 0, 3), 0), completedCases:Object.values(bestStarsByCase).filter((value) => Number(value) > 0).length };
  } catch { return empty; }
}

export function saveCampaignProfile(profile: CampaignProfile) {
  if (typeof localStorage !== "undefined") localStorage.setItem(CAMPAIGN_PROFILE_KEY, JSON.stringify(profile));
}

export function awardCampaignStars(caseId: string, stars: number): CampaignProfile {
  const profile = loadCampaignProfile();
  profile.bestStarsByCase[caseId] = Math.max(profile.bestStarsByCase[caseId] ?? 0, clamp(Math.floor(stars), 0, 3));
  profile.totalStars = Object.values(profile.bestStarsByCase).reduce((sum, value) => sum + value, 0);
  profile.completedCases = Object.values(profile.bestStarsByCase).filter((value) => value > 0).length;
  saveCampaignProfile(profile);
  return profile;
}

export function isCampaignCaseUnlocked(def: CampaignCaseDefinition, profile: CampaignProfile) { return profile.totalStars >= def.unlockStars; }

const axis = (partial: Partial<Record<AxisKey, number>> = {}) => Object.fromEntries(AXIS_KEYS.map((key) => [key, partial[key] ?? .5])) as Record<AxisKey, number>;
const inventoryTotal = (w: World) => w.player.skus.reduce((sum, sku) => sum + Math.max(0, sku.inventory), 0);

function seededPerson(id: string, name: string, role: Personnel["role"], title: string, level: Personnel["level"], skill: number, specialty: string | null): Personnel {
  return { id,name,role,title,level,skill,specialty,age:28+level*5,hiredTick:0,lastPromotionTick:0,rarity:level>=4?"legendary":level>=3?"epic":level>=2?"rare":"uncommon",salary:5_000+level*2_000,potential:clamp(skill+.12),performance:.72,morale:.76,attributes:{expertise:skill,execution:clamp(skill+.02),creativity:clamp(skill+.04),leadership:clamp(skill-.03),commercial:clamp(skill-.02)},traits:["Case-tested"],careerEvents:[{tick:0,kind:"hire",text:`Joined the case company as ${title}.`}] };
}

function room(id: string, name: string, facilityType: OperatingRoom["facilityType"], x: number, y: number, w: number, h: number, team: OperatingRoom["team"], capacity: number, staff: string[] = []): OperatingRoom {
  const kind: OperatingRoom["kind"] = facilityType === "factory" ? "factory" : facilityType === "warehouse" || facilityType === "cold_storage" || facilityType === "distribution_hub" ? "warehouse" : facilityType === "outsourcing" ? "outsourcing" : "office";
  return {id,name,facilityType,kind,x,y,w,h,team,capacity,assignedPersonnelIds:staff,productKey:null,skuId:null,buildCost:100_000,monthlyCost:12_000,upgradeLevel:id==="founder-office"?2:1,manufacturingFamilies:facilityType==="factory"?[]:undefined,storageProfiles:kind==="warehouse"?["standard"]:undefined};
}

const specialtyPartner: Record<string,string> = {skincare:"beauty_luxe",toys:"toy_kingdom",food:"freshbasket",apparel:"stylehouse",electronics:"techworld"};

function addContract(w: World, partnerId: string) {
  const partner = RETAIL_PARTNERS.find((item) => item.id === partnerId);
  if (!partner || w.player.contracts.some((item) => item.partnerId === partnerId)) return;
  w.player.contracts.push({type:partner.channelType,marginCut:partner.marginCut,partnerId:partner.id,partnerName:partner.name,slotting:partner.slotting,paymentDays:partner.paymentDays});
}

function seedLiveCompany(w: World, def: CampaignCaseDefinition) {
  const cfg = INDUSTRIES[def.industryId];
  const productKeys = cfg.products.map((product) => product.key);
  const allCategories = [...productKeys];
  w.player.unlockedCategories = allCategories;
  w.player.businesses[def.industryId]!.unlockedCategories = allCategories;
  w.player.research.completed = ["advanced_product_development","flagship_product_development","professional_recruiting","supplier_management","owned_manufacturing","organizational_scaling","market_intelligence","specialized_storage"];
  const brand = {id:"case_brand",name:def.company.split(" ")[0],color:def.seed==="luxury"?"#6d28d9":def.seed==="challenger"?"#ef4444":"#168de2",positioning:def.seed==="luxury"?"luxury":def.seed==="warehouse"?"mass":"premium",createdTick:0,industryId:def.industryId,visual:defaultBrandVisual(def.company,"#168de2")};
  w.brands=[brand]; w.primaryBrandId=brand.id; w.brandEquity[brand.id]={}; ensureIndustryMarket(w,def.industryId).brandEquity[brand.id]={};

  const people: Personnel[] = [
    seededPerson("case_pm","Maya Chen","product_manager",def.seed==="flagship"?"VP Product":"Senior Product Lead",3,.82,productKeys[0]??null),
    seededPerson("case_designer","Luca Reed","product_manager","Product Designer",2,.69,productKeys[1]??productKeys[0]??null),
    seededPerson("case_ops","Nora Patel","operations","Operations Director",3,.77,null),
    seededPerson("case_marketing","Eli Brooks","marketing","Marketing Director",3,.76,productKeys[0]??null),
    seededPerson("case_strategy","Sam Okafor","strategy","Strategy Manager",2,.68,null),
    seededPerson("case_finance","Ana Silva","finance","Finance Manager",2,.7,null),
  ];
  w.player.personnel=people;
  const centerType = def.industryId==="skincare"?"beauty_center":def.industryId==="toys"?"toy_center":def.industryId==="food"?"food_center":def.industryId==="apparel"?"fashion_atelier":"electronics_lab";
  w.player.operatingRooms=[
    room("founder-office","Company HQ","office",5,40,3,3,"unassigned",8,["case_strategy","case_finance"]),
    room("case_center",cfg.label+" Product Center",centerType,10,40,3,3,"product",4,["case_pm","case_designer"]),
    room("case_marketing_office","Marketing Office","marketing_office",14,40,3,3,"marketing",4,["case_marketing"]),
    room("case_logistics","Logistics Office","logistics_office",18,40,3,3,"operations",3,["case_ops"]),
    room("case_warehouse","Warehouse","warehouse",23,40,3,3,"operations",100_000),
    room("case_factory","Factory","factory",28,39,6,4,"operations",180_000),
  ];
  w.player.operatingRooms.find((item)=>item.id==="case_factory")!.manufacturingFamilies=defaultFactoryFamiliesForIndustry(def.industryId);
  if (def.seed==="coldchain") { const wh=w.player.operatingRooms.find((item)=>item.id==="case_warehouse")!; wh.facilityType="cold_storage"; wh.name="Cold Storage"; wh.storageProfiles=["standard","frozen","refrigerated"]; }
  w.player.campusPaths=[]; for(let x=2;x<=38;x++){w.player.campusPaths.push({x,y:44});w.player.campusPaths.push({x,y:43});}
  syncDerivedDepartments(w);
  addContract(w,"own_web"); addContract(w,"megazon"); addContract(w,specialtyPartner[def.industryId]);

  const needs = cfg.needs.map((need) => need.key);
  const makeProduct = (id:string,index:number,opts:{tier?:ProductProjectTier;review?:number;inventory?:number;active?:boolean;priceMult?:number;momentum?:number;brandId?:string;ipId?:string|null}={}) => {
    const product = cfg.products[index % cfg.products.length];
    const attrs = Object.fromEntries(needs.map((key,needIndex)=>[key,clamp(.35+((index+needIndex*2)%5)*.12)]));
    const referencePrice=(product.priceBand[0]+product.priceBand[1])/2;
    const sku=buildSku(w,{name:`${brand.name} ${product.label} ${index+1}`,productKey:product.key,brandId:opts.brandId??brand.id,method:"own",manufacturingStars:opts.tier==="AAA"?5:opts.tier==="AA"?4:3,listPrice:Math.max(4,referencePrice*(opts.priceMult??1)),target:axis(index%2?{age:.28,class:.42,family:.68}:{age:.55,class:.7,geography:.6}),targetLabel:index%2?"Young families":"Affluent urban adults",positioning:def.seed==="luxury"?"luxury":index%2?"value":"premium",attributes:attrs,packaging:index%2?"bold":"minimal",pmSkill:.82,pmId:"case_pm",pmName:"Maya Chen",projectTier:opts.tier??"A",designerIds:opts.tier==="AAA"?["case_designer","case_strategy","case_marketing"]:opts.tier==="AA"?["case_designer"]:[],ipId:opts.ipId??null},id,0,2);
    sku.designDaysLeft=0; sku.reviewScore=opts.review??(opts.tier==="AAA"?4.5:opts.tier==="AA"?3.6:2.4); sku.perceivedQuality=clamp((sku.reviewScore-1)/4); sku.marketMomentum=opts.momentum??1; sku.peakMomentum=sku.marketMomentum;
    if(opts.active!==false){sku.status="active";sku.releasedToMarket=true;sku.launchTick=0;sku.inventory=opts.inventory??8_000;sku.inventoryLots=[{id:`${id}_lot`,units:sku.inventory,receivedTick:0,unitCost:sku.unitCost}];sku.assignedPartnerIds=w.player.contracts.slice(0,index%2?2:3).map((contract)=>contract.partnerId);deriveSkuChannels(w,sku);} else {sku.status="designed";sku.releasedToMarket=false;sku.inventory=0;sku.inventoryLots=[];sku.assignedPartnerIds=[];}
    w.player.skus.push(sku); for(const cell of w.cube) cell.awareness[sku.id]=opts.active===false ? .03 : .2;
    return sku;
  };

  if(def.seed==="flagship") { makeProduct("case_flagship",0,{tier:"AAA",review:4.6,active:false}); w.player.cash=7_500_000; }
  else if(def.seed==="warehouse") { for(let i=0;i<6;i++) makeProduct(`case_stock_${i}`,i,{review:1.8+i*.24,inventory:18_000+i*5_000,priceMult:.82+i*.05,momentum:.72+i*.05}); w.player.cash=650_000; }
  else if(def.seed==="legacy") { makeProduct("case_legacy",0,{tier:"AA",review:3.7,inventory:22_000,momentum:.62,priceMult:1.15}); w.player.cash=1_400_000; }
  else if(def.seed==="challenger") { makeProduct("case_challenger_1",0,{tier:"AA",review:3.8,inventory:50_000,momentum:1.2}); makeProduct("case_challenger_2",1,{tier:"AA",review:3.5,inventory:38_000,momentum:1.05}); w.player.cash=9_000_000; }
  else if(def.seed==="niche") { makeProduct("case_niche",0,{tier:"AA",review:4.1,inventory:8_000,momentum:1.12,priceMult:1.35}); w.player.cash=1_200_000; }
  else if(def.seed==="luxury") { for(let i=0;i<4;i++) makeProduct(`case_luxury_${i}`,i,{tier:i===0?"AAA":"AA",review:3.3+i*.15,inventory:14_000+i*4_000,priceMult:2.1,momentum:.78}); w.player.cash=480_000; }
  else if(def.seed==="coldchain") { makeProduct("case_frozen_launch",0,{tier:"AA",review:3.8,active:false}); makeProduct("case_cold_core",1,{review:2.8,inventory:12_000,momentum:.9}); w.player.cash=1_100_000; }
  else if(def.seed==="licensing") { const ip=w.ipAssets.find((item)=>item.ownerType==="external"&&item.compatibleProductFamilies.includes(productKeys[0])); makeProduct("case_licensed",0,{tier:"AA",review:3.9,inventory:28_000,momentum:1.35,ipId:ip?.id??null}); w.player.cash=1_800_000; }
  else if(def.seed==="portfolio") { const second={...brand,id:"case_brand_2",name:"Morrow Essential",color:"#10b981",positioning:"mass",visual:defaultBrandVisual("Morrow Essential","#10b981")}; w.brands.push(second); w.brandEquity[second.id]={}; ensureIndustryMarket(w,def.industryId).brandEquity[second.id]={}; for(let i=0;i<6;i++) makeProduct(`case_portfolio_${i}`,i,{brandId:i%2?second.id:brand.id,tier:i<2?"AA":"A",review:2.5+i*.22,inventory:12_000+i*2_000,momentum:.86}); w.player.cash=2_300_000; }
  else if(def.seed==="supply") { makeProduct("case_supply_flagship",0,{tier:"AAA",review:4.2,inventory:3_500,momentum:1.35}); makeProduct("case_supply_value",1,{tier:"AA",review:3.6,inventory:4_500,momentum:1.12}); w.player.cash=1_500_000; }
  else if(def.seed==="debt") { for(let i=0;i<4;i++) makeProduct(`case_debt_${i}`,i,{tier:i<2?"AA":"A",review:2.8+i*.2,inventory:20_000+i*3_000,momentum:.9}); w.player.cash=320_000; w.player.debt=2_200_000; }
  else if(def.seed==="board") {
    makeProduct("case_group_primary",0,{tier:"AAA",review:4.1,inventory:18_000,momentum:1.2});
    for(const industryId of ["food","apparel"]){ const industry=INDUSTRIES[industryId]; w.player.businesses[industryId]={industryId,status:"active",enteredTick:0,unlockedCategories:industry.products.map((p)=>p.key),categoryExpansionProjects:[],capabilities:{}}; ensureIndustryMarket(w,industryId); }
    w.player.cash=6_000_000;
  }
  else { makeProduct("case_core",0,{tier:"AA",review:3.6,inventory:18_000}); w.player.cash=1_800_000; }
  w.fitCacheDirty=true; for(const market of Object.values(w.industryMarkets)) if(market) market.fitCacheDirty=true;
}

export function createCampaignWorld(caseId: string): World {
  const def=CAMPAIGN_CASE_BY_ID[caseId]; if(!def) throw new Error(`Unknown campaign case: ${caseId}`);
  const w=initWorld(def.industryId,def.company,null,"standard","bootstrap_brand");
  w.mode="campaign"; seedLiveCompany(w,def); w.gameplay.nextDecisionTick=Number.MAX_SAFE_INTEGER;
  const runtime: CampaignRuntime={caseId:def.id,startTick:w.tick,deadlineTick:w.tick+def.durationDays,initialInventory:inventoryTotal(w),initialProductIds:w.player.skus.map((sku)=>sku.id),initialContractIds:w.player.contracts.map((contract)=>contract.partnerId),initialFacilityIds:w.player.operatingRooms.map((item)=>item.id),scriptedEventsSeen:[],awardedStars:0,completed:false};
  w.campaign=runtime;
  w.events.push({tick:w.tick,kind:"campaign",text:`${def.icon} Case opened: ${def.name}. ${def.brief}`});
  return w;
}

export function campaignMetricValue(w: World, requirement: CampaignRequirement): number {
  const runtime=w.campaign; const active=w.player.skus.filter((sku)=>sku.releasedToMarket&&!sku.archived); const elapsed=runtime?Math.max(0,w.tick-runtime.startTick):w.tick;
  const map: Record<CampaignMetric,()=>number> = {
    monthly_revenue:()=>Math.max(0,w.live?.income.netRevenue??0)/3,
    quarterly_profit:()=>w.live?.income.profit??0,
    cash:()=>w.player.cash,debt:()=>w.player.debt,market_share:()=>w.live?.shareMonth??w.live?.overallShare??0,
    market_rank:()=>w.competitiveReviews.at(-1)?.playerRank??(w.live?.overallShare&&w.live.overallShare>.18?1:99),
    inventory_reduction:()=>runtime?.initialInventory?clamp(1-inventoryTotal(w)/runtime.initialInventory,0,1):0,
    inventory_units:()=>inventoryTotal(w),active_products:()=>active.length,released_products:()=>w.player.skus.filter((sku)=>sku.releasedToMarket).length,
    new_released_products:()=>w.player.skus.filter((sku)=>sku.releasedToMarket&&!runtime?.initialProductIds.includes(sku.id)).length,
    archived_products:()=>w.player.skus.filter((sku)=>sku.archived).length,contracts:()=>w.player.contracts.length,
    owned_ip_products:()=>active.filter((sku)=>w.ipAssets.some((ip)=>ip.id===sku.ipId&&ip.ownerType==="player")).length,
    max_review:()=>Math.max(0,...active.map((sku)=>sku.reviewScore??0)),businesses:()=>Object.values(w.player.businesses).filter((item)=>item?.status==="active").length,
    decisions:()=>w.gameplay.decisionHistory.length,elapsed_days:()=>elapsed,
    flagship_monthly_revenue:()=>{const index=w.player.skus.findIndex((sku)=>sku.id===requirement.scope);return index>=0?Math.max(0,w.live?.skuResults?.[index]?.revenue??0)/3:0;},
  };
  return map[requirement.metric]();
}

export function campaignRequirementMet(w: World, requirement: CampaignRequirement) {
  const value=campaignMetricValue(w,requirement); return requirement.operator===">="?value>=requirement.target:requirement.operator==="<="?value<=requirement.target:Math.abs(value-requirement.target)<.0001;
}

export function campaignStars(w: World): number {
  if(!w.campaign) return 0; const def=CAMPAIGN_CASE_BY_ID[w.campaign.caseId]; if(!def) return 0; let stars=0;
  for(const star of def.stars) if(star.requirements.every((requirement)=>campaignRequirementMet(w,requirement))) stars=star.stars;
  return stars;
}

export function completeCampaignCase(w: World) {
  if(!w.campaign) return {stars:0,profile:loadCampaignProfile()};
  const stars=campaignStars(w); w.campaign.completed=true; w.campaign.awardedStars=Math.max(w.campaign.awardedStars,stars); const profile=awardCampaignStars(w.campaign.caseId,stars);
  const def=CAMPAIGN_CASE_BY_ID[w.campaign.caseId]; w.events.push({tick:w.tick,kind:"campaign",text:`${stars?"⭐".repeat(stars):"📚"} Case submitted: ${def?.name??w.campaign.caseId} — ${stars}/3 stars.`});
  return {stars,profile};
}

function makeScriptedEvent(w: World, event: CampaignEventDefinition): DecisionEvent {
  return {id:`campaign_${event.id}_${w.tick}`,templateId:`campaign:${event.id}`,category:"Campaign case",icon:event.icon,title:event.title,description:event.description,context:event.context,triggeredTick:w.tick,choices:event.choices};
}

export function updateCampaign(w: World) {
  const runtime=w.campaign; if(w.mode!=="campaign"||!runtime||runtime.completed) return;
  const def=CAMPAIGN_CASE_BY_ID[runtime.caseId]; if(!def) return;
  const elapsed=w.tick-runtime.startTick;
  const due=def.events.find((event)=>elapsed>=event.day&&!runtime.scriptedEventsSeen.includes(event.id));
  if(due&&!w.gameplay.pendingDecision){w.gameplay.pendingDecision=makeScriptedEvent(w,due);runtime.scriptedEventsSeen.push(due.id);w.events.push({tick:w.tick,kind:"campaign",text:`${due.icon} Case event: ${due.title}`});}
  if(w.tick>=runtime.deadlineTick&&!runtime.completed) completeCampaignCase(w);
}

export function campaignConstraintReason(w: World, action: CampaignAction): string | null {
  if(w.mode!=="campaign"||!w.campaign||w.campaign.completed) return null;
  const def=CAMPAIGN_CASE_BY_ID[w.campaign.caseId]; if(!def) return null; const constraints=def.constraints;
  if(constraints.forbid?.includes(action)) return `${def.name} constraint: ${action.replaceAll("_"," ")} is not allowed in this case.`;
  if(action==="build_facility"&&constraints.maxNewFacilities!=null){const added=w.player.operatingRooms.filter((item)=>!w.campaign!.initialFacilityIds.includes(item.id)).length;if(added>=constraints.maxNewFacilities)return `${def.name} allows at most ${constraints.maxNewFacilities} new facilit${constraints.maxNewFacilities===1?"y":"ies"}.`;}
  if(action==="create_brand"&&constraints.maxBrands!=null&&w.brands.length>=constraints.maxBrands)return `${def.name} requires you to work within the existing brand architecture.`;
  if(action==="activate_product"&&constraints.maxActiveProducts!=null){const active=w.player.skus.filter((sku)=>sku.releasedToMarket&&!sku.archived).length;if(active>=constraints.maxActiveProducts)return `${def.name} allows at most ${constraints.maxActiveProducts} active products. Archive another product before activating this one.`;}
  return null;
}

export function campaignDaysRemaining(w: World) { return w.campaign?Math.max(0,w.campaign.deadlineTick-w.tick):0; }

export function formatCampaignValue(requirement: CampaignRequirement, value: number) {
  if(requirement.format==="money") return `$${Math.round(value).toLocaleString()}`;
  if(requirement.format==="percent") return `${(value*100).toFixed(1)}%`;
  if(requirement.format==="days") return `${Math.round(value)}d`;
  if(requirement.format==="rank") return value>=90?"Unranked":`#${Math.round(value)}`;
  return Math.round(value*10)/10+"";
}
