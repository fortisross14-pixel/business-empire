// ============================================================================
// Domain types. Money is in whole currency units (dollars). Units are item counts.
// One TICK = one day. Months are 30 days, quarters 90, years 360 (clean calendar).
// "PerQuarter" quantities are run-rates; the loop slices them by TICKS_PER_QUARTER.
// ============================================================================

export const TICKS_PER_DAY = 1;
export const DAYS_PER_MONTH = 30;
export const TICKS_PER_MONTH = 30;
export const TICKS_PER_QUARTER = 90;
export const TICKS_PER_YEAR = 360;
// Per-tick easing rates were tuned at 24 ticks/quarter. With 90 now, scale them so the
// per-quarter behaviour (how fast awareness/equity/customers move) stays balanced.
export const TICK_RATE_SCALE = 24 / TICKS_PER_QUARTER;

export type AxisKey = "gender" | "age" | "class" | "leaning" | "geography" | "family";

export type DifficultyId = "entrepreneur" | "standard" | "bootstrap";

export type TalentSearchMode = "quick" | "online" | "deep";

export interface TalentSearch {
  id: string;
  role: PersonnelRole;
  industryId: string;
  mode: TalentSearchMode;
  startedTick: number;
  daysLeft: number;
  totalDays: number;
  cost: number;
}


export interface Coord {
  gender: string;
  age: string;
  class: string;
  leaning: string;
  geography: string;
  family: string;
}

export interface Cell {
  coord: Coord;
  head: number; // people
  baseHead: number;
  spend: number; // avg annual spend in this industry, $/person/yr
  awareness: Record<string, number>; // productId -> 0..1
  needPref: Record<string, number>; // need key -> 0..1 preference weight (sums ~1)
  // rich frozen attributes (set at start, re-rolled only at year-end / events)
  qualitySens: number; // 0..1: how much this segment rewards quality
  priceSens: number;   // 0..2: how much a high price repels this segment
  categoryPref: Record<string, number>; // productType key -> 0..1 affinity (e.g. boys love action figures)
  channelPref: Record<string, number>; // ChannelType -> 0..1 how much this segment shops there
  equityPref: Record<string, number>; // brand metric (trust/prestige/value/innovation) -> 0..1 how much this segment cares
}

export interface NeedAxis {
  key: string;
  label: string;
  // how this need correlates with demographic axes (used to seed cell preferences)
  // e.g. Luxury correlates positively with class; Value negatively.
  lean: Partial<Record<AxisKey, number>>; // -1..1 per demographic axis
}

export interface IndustryConfig {
  id: string;
  label: string;
  currency: string;
  axisWeight: Record<AxisKey, number>;
  spend: {
    class: Record<string, number>;
    gender: Record<string, number>;
    age: Record<string, number>;
  };
  products: ProductType[];
  competitors: CompetitorSeed[];
  thirdAxisLabel: string;
  needs: NeedAxis[];
}

export interface ProductType {
  key: string;
  label: string;
  baseCost: number;
  priceBand: [number, number];
  // natural demographic lean of this product type (cube coords 0..1), optional.
  // If present, fit blends the player's chosen target with the type's lean.
  naturalLean?: Partial<Record<AxisKey, number>>;
  // default need-attribute vector for this product type (0..1 per need key)
  defaultAttributes?: Record<string, number>;
  // who is naturally inclined to this CATEGORY (affinity lean per demographic axis, -1..1).
  // e.g. action figures: young + male; anti-aging: older. Drives categoryPref per segment.
  categoryLean?: Partial<Record<AxisKey, number>>;
  lifetimeDays: number; // how long novelty lasts (360=1yr, 3600=10yr, 36000=100yr like Coke)
}

export interface CompetitorSeed {
  name: string;
  target: Record<AxisKey, number>;
  quality: number;
  price: number;
  priceSens: number;
  strength: number;
  personality?: CompetitorPersonality;
  attributes: Record<string, number>; // need vector
}

export type CompetitorPersonality = "discounter" | "premium" | "balanced";

export interface CompetitorProduct {
  target: Record<AxisKey, number>;
  quality: number;
  price: number;
  basePrice: number;
  priceSens: number;
  awarenessKey: string; // unique id used in cell.awareness map
  attributes: Record<string, number>; // need vector
  productKey: string; // category
}

export type RivalActionKind = "launch" | "defend" | "retreat" | "price";

export interface RivalActionRecord {
  tick: number;
  kind: RivalActionKind;
  headline: string;
  detail: string;
  segmentLabel?: string;
  productKey?: string;
}

export interface Competitor {
  id: string;
  name: string;
  // primary product kept at top level for back-compat with price-reaction code
  target: Record<AxisKey, number>;
  quality: number;
  price: number;
  basePrice: number;
  priceSens: number;
  strength: number;
  isComp: true;
  personality: CompetitorPersonality;
  // M2 additions
  products: CompetitorProduct[];
  marketing: number;       // their per-quarter marketing spend
  marketingFocus: string;  // age band they emphasize, or "all"
  cash: number;
  lastAction?: string;
  exitedCells: string[];   // coord keys they've abandoned
  actionCooldown: number;  // ticks until next strategic action allowed
  threatMemory: Record<string, number>; // coordKey -> consecutive quarters player has dominated
  actionHistory?: RivalActionRecord[]; // durable rival memory; market news itself remains rolling
  shareHistory?: { tick: number; share: number }[];
}

export type ProductMethod = "outsource" | "own";

export type ProductRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const PRODUCT_RARITY_DEFS: Record<ProductRarity, { label: string; color: string; minScore: number }> = {
  common:    { label: "Common",    color: "#9ca3af", minScore: 0 },
  uncommon:  { label: "Uncommon",  color: "#34d399", minScore: 0.25 },
  rare:      { label: "Rare",      color: "#38bdf8", minScore: 0.45 },
  epic:      { label: "Epic",      color: "#c084fc", minScore: 0.65 },
  legendary: { label: "Legendary", color: "#fbbf24", minScore: 0.82 },
};

export function computeProductRarity(score: number): ProductRarity {
  if (score >= 0.82) return "legendary";
  if (score >= 0.65) return "epic";
  if (score >= 0.45) return "rare";
  if (score >= 0.25) return "uncommon";
  return "common";
}

export type ProductStatus = "designing" | "designed" | "manufacturing" | "active";
export type DesignDepth = "quick" | "standard" | "advanced" | "breakthrough";

export const DESIGN_DEPTHS: Record<DesignDepth, { label: string; days: number; qualityMult: number; desc: string }> = {
  quick:        { label: "Quick",        days: 14,  qualityMult: 0.72, desc: "Fast follower. Cheap and quick, but less differentiation." },
  standard:     { label: "Standard",     days: 45,  qualityMult: 1.00, desc: "Balanced development for a normal commercial launch." },
  advanced:     { label: "Advanced",     days: 90,  qualityMult: 1.22, desc: "More research, testing and refinement." },
  breakthrough: { label: "Breakthrough", days: 150, qualityMult: 1.42, desc: "Long, expensive-to-wait development aimed at standout products." },
};


export type ProductProjectTier = "A" | "AA" | "AAA";

export const PRODUCT_PROJECT_TIERS: Record<ProductProjectTier, {
  label: string;
  baseDays: number;
  designerSlots: number;
  leadRequired: boolean;
  designQualityCap: number;
  priorityPoints: number;
  description: string;
}> = {
  A: { label: "A", baseDays: 35, designerSlots: 1, leadRequired: false, designQualityCap: .64, priorityPoints: 13, description: "Focused startup project. One Product Designer; typical reviews begin around 1.5–2.5★ and the class ceiling is 2.9★." },
  AA: { label: "AA", baseDays: 80, designerSlots: 1, leadRequired: true, designQualityCap: .84, priorityPoints: 18, description: "Advanced project. One Product Lead plus one Product Designer; strong teams can reach 3–4★, with 4.1★ reserved for the best AA work." },
  AAA: { label: "AAA", baseDays: 150, designerSlots: 3, leadRequired: true, designQualityCap: 1, priorityPoints: 23, description: "Flagship program. One Product Lead plus three Product Designers; 4.8–4.9★ requires top execution and a perfect 5.0★ is exceptional." },
};

export type ProductTestingLevel = "standard" | "enhanced" | "rigorous";

export interface InventoryLot {
  id: string;
  units: number;
  receivedTick: number;
  unitCost: number;
}

// Product telemetry is intentionally stored on the SKU so product pages can show useful
// history without reconstructing it from the company-wide P&L. Both fields on SKU are optional
// so saves created before telemetry was introduced remain valid without an eager migration.
export interface SkuDailySalesPoint {
  tick: number;
  units: number;
  netRevenue: number;
  contribution: number;
  inventory: number;
}

export interface SkuChannelSalesAttribution {
  partnerId: string;
  partnerName: string;
  channelType: ChannelType;
  units: number;
  grossRevenue: number;
  netRevenue: number;
  contribution: number;
  lastSaleTick: number;
}

export interface SKU {
  id: string;
  name: string;
  productKey: string;
  brandId: string;
  industryId: string;
  method: ProductMethod;
  supplierId?: string | null; // outsourced manufacturing partner; null for owned production
  testingLevel?: ProductTestingLevel; // universal safety/regulatory testing choice
  safetyScore?: number; // 0..1 derived from testing + development + manufacturing quality
  recallCount?: number;
  marketMomentum?: number; // 0.35..3.0 universal buzz / hit multiplier
  peakMomentum?: number;
  breakout?: boolean;
  lastMomentumEventTick?: number;
  target: Record<AxisKey, number>;
  designFacets?: Record<string, string>; // generic data-driven product choices (age group, play fantasy, etc.)
  // lifecycle status
  status: ProductStatus;
  archived?: boolean; // hidden from the active portfolio without erasing commercial history
  archivedTick?: number;
  archivedWasReleased?: boolean;
  marketStudyCount?: number;
  reviewScore?: number; // frozen 1.0–5.0 product review revealed when design completes; not a sales score
  marketStudy?: ProductMarketStudyReport; // latest retained diagnosis for this exact SKU
  assignedPmId: string | null;
  assignedPmName?: string; // current/last lead name survives employee departures
  leadHistory?: { personId: string; personName: string; fromTick: number; toTick?: number }[];
  designDepth: DesignDepth;
  projectTier?: ProductProjectTier;
  assignedDesignerIds?: string[]; // non-lead product team members; A stores its sole designer here too for explicit team accounting
  positioning?: string;       // player-facing product strategy intent
  targetLabel?: string;       // human-readable target used at design time
  manufacturingStars?: number; // 1..5 player-facing manufacturing standard
  designDaysLeft: number;    // counts down during "designing"
  mfgDaysLeft: number;       // counts down during "manufacturing"
  mfgBatchSize: number;      // units being manufactured in current batch
  // quality
  quality: number;          // manufacturing quality (materials + production)
  designQuality: number;   // from design decisions + PM skill + depth
  perceivedQuality: number; // what the market believes
  novelty: number;         // 0..1, starts high, decays over product lifetime
  fame: number;            // 0..1, grows with sales + marketing + satisfaction
  rarity: ProductRarity;   // derived from quality + design + novelty + fame + expertise
  lifetimeDays: number;    // how long until novelty fully decays
  launchTick: number;      // when the product actually entered the market
  releasedToMarket?: boolean; // first batch may exist before commercial release
  launchWeekReported?: boolean; // avoids repeating the first-week commercial review event
  version?: number;
  parentSkuId?: string | null;
  // economics
  unitCost: number;
  listPrice: number;
  priceSens: number;
  inventory: number;
  inventoryLots?: InventoryLot[]; // FIFO lots power ageing / expiry / obsolescence without changing product definitions
  lastInventoryAgeAlertTick?: number;
  online: number;
  attributes: Record<string, number>;
  packaging: string;
  channels: ChannelType[];
  assignedPartnerIds: string[]; // which retail partners carry this product
  ipId: string | null;      // universal IP attached to this product; brand identity remains separate
  license?: string | null; // legacy v0.96 field, migrated into ipId in save schema v10
  unitsSoldTotal: number;
  unitsLostTotal: number;
  lastStockoutAlertTick?: number;
  lastLowStockAlertTick?: number;
  contributionTotal: number;
  salesHistory?: SkuDailySalesPoint[]; // rolling daily actuals, capped at one in-game year (360 points)
  channelSalesByPartner?: Record<string, SkuChannelSalesAttribution>; // lifetime actuals by contracted retail partner
}

export type MarketLessonKind = "priority" | "ip" | "quality" | "price" | "channel" | "audience" | "awareness" | "operations" | "margin";

export interface MarketLesson {
  id: string;
  kind: MarketLessonKind;
  title: string;
  finding: string;
  action: string;
  priorityKey?: string;
  currentStars?: number;
  recommendedStars?: number;
}

export interface ProductMarketStudyReport {
  skuId: string;
  completedTick: number;
  targetLabel: string;
  headline: string;
  summary: string;
  targetMarketShare: number;
  preferences: { key: string; label: string; importance: number; recommendedStars: number; currentStars: number }[];
  quality: { reviewScore: number; importance: number; diagnosis: string[] };
  bestChannel: { type: ChannelType; label: string; importance: number };
  lessons: MarketLesson[];
}

export type ChannelType = "retail" | "marketplace" | "ownweb" | "flagship";

export interface ChannelDef {
  label: string;
  baseReach: number;
  marginCut: number; // retailer's cut of gross
  slotting: number; // $/quarter fixed
  awarenessBoost: number;
  online: number;
  paymentDays: number; // how long until you get paid through this channel
}

export interface Contract {
  type: ChannelType;
  marginCut: number; // negotiated
  partnerId: string;  // RETAIL_PARTNERS[].id
  partnerName: string;
  slotting: number;   // quarterly slotting from partner terms
  paymentDays: number;
}

// ---- Finance (Milestone 1) ----
export interface CellFinance {
  coord: Coord;
  revenue: number; // net of channel cut, $/quarter
  units: number; // $/quarter rate
  grossMargin: number; // revenue - COGS
  marketingAllocated: number; // CAC allocated to this cell
  contribution: number; // grossMargin - marketingAllocated
}

export interface IncomeStatement {
  grossRevenue: number;
  channelCut: number;
  netRevenue: number;
  cogs: number;
  contribution: number;
  marketing: number;
  brandMarketing: number;
  slotting: number;
  backOffice: number;
  deptOverhead: number;
  licensingCost: number;
  locationCost: number;
  personnelCost: number;
  ebitda: number;
  interest: number;
  profit: number;
}

export interface CashFlow {
  cash: number;
  inventoryValue: number; // cash tied up in unsold stock
  receivables: number; // cash owed to us, in transit through payment delays
  cashCycleDays: number;
  operatingCashFlow: number; // per quarter
  debt: number;
}

export interface Receivable {
  amount: number;
  dueTick: number;
}

export interface SkuResult {
  units: number; // actual units sold, quarterly run-rate
  demandUnits: number; // unconstrained demand, quarterly run-rate
  lostUnits: number; // demand lost to stock-out, quarterly run-rate
  revenue: number; // net after channel cut
  gross: number;
  margin: number;
  inventory: number;
  daysCover: number;
  channelCutPct: number;
  paymentDays: number;
}

export interface Study {
  type: string;
  ticksLeft: number;
  done: boolean;
  skuId?: string;
}

export interface MarketEvent {
  tick: number;
  kind: string;
  text: string;
  code?: "rival_launch" | "rival_defense" | "rival_retreat" | "quarterly_market_review" | "decision_required" | "decision_resolved" | "decision_consequence" | "achievement_unlocked" | "outcome_unlocked" | "capital_action";
  entityId?: string;
  data?: Record<string, string | number | boolean>;
}

// ---- Capital, scenarios and the event-driven game layer ----
export type InvestorType = "venture" | "family_office" | "strategic";

export interface InvestorRelationship {
  id: string;
  name: string;
  type: InvestorType;
  relationship: number;
  connectedTick: number;
}

export interface CapitalRound {
  id: string;
  tick: number;
  kind: "growth_loan" | "equity";
  amount: number;
  dilutionPct: number;
  counterparty: string;
}

export interface CapitalState {
  dilutionPct: number;
  relationships: InvestorRelationship[];
  rounds: CapitalRound[];
  lastRaiseTick: number;
}

export type ScenarioId = "bootstrap_brand" | "premium_challenger" | "turnaround" | "retailer_growth" | "ip_breakout";

export type GameMode = "campaign" | "scenario" | "sandbox";
export type CampaignAction = "hire" | "recruit" | "sign_contract" | "remove_contract" | "build_facility" | "demolish_facility" | "borrow" | "raise_capital" | "enter_industry" | "create_brand" | "activate_product";

export interface CampaignRuntime {
  caseId: string;
  startTick: number;
  deadlineTick: number;
  initialInventory: number;
  initialProductIds: string[];
  initialContractIds: string[];
  initialFacilityIds: string[];
  scriptedEventsSeen: string[];
  awardedStars: number;
  completed: boolean;
}

export interface GameEffect {
  cash?: number;
  debt?: number;
  inventoryPct?: number;
  qualityDelta?: number;
  momentumDelta?: number;
  awarenessDelta?: number;
  investorConfidenceDelta?: number;
  materialCostPct?: number;
  retailerMarginDelta?: number;
  salaryPct?: number;
  pricePct?: number;
  customerSatisfactionDelta?: number;
  competitorStrengthPct?: number;
  targetSkuId?: string;
  retargetTo?: Record<AxisKey, number>;
  targetLabel?: string;
  manufacturingDaysPct?: number;
}

export interface DecisionChoice {
  id: string;
  label: string;
  summary: string;
  immediateText: string;
  immediate: GameEffect;
  delayedText?: string;
  delayed?: { days: number; effects: GameEffect };
}

export interface DecisionEvent {
  id: string;
  templateId: string;
  category: string;
  icon: string;
  title: string;
  description: string;
  context: string;
  triggeredTick: number;
  choices: DecisionChoice[];
}

export interface DecisionHistoryEntry {
  eventId: string;
  templateId: string;
  title: string;
  choiceId: string;
  choiceLabel: string;
  resolvedTick: number;
  immediateText: string;
  delayedText?: string;
}

export interface DelayedConsequence {
  id: string;
  dueTick: number;
  sourceTitle: string;
  choiceLabel: string;
  text: string;
  effects: GameEffect;
}

export interface AchievementUnlock { id: string; tick: number }
export interface OutcomeUnlock { id: string; tick: number }

export interface GameplayState {
  scenarioId: ScenarioId;
  runSeed: number;
  pendingDecision: DecisionEvent | null;
  decisionHistory: DecisionHistoryEntry[];
  delayedConsequences: DelayedConsequence[];
  seenTemplates: string[];
  nextDecisionTick: number;
  achievements: AchievementUnlock[];
  outcomes: OutcomeUnlock[];
}

export interface CompetitiveQuarterReview {
  tick: number;
  quarter: number;
  playerShare: number;
  playerRank: number;
  previousPlayerShare: number | null;
  leaderName: string;
  leaderShare: number;
  topMoverName: string;
  topMoverDelta: number;
  headline: string;
}


export type BrandLogoShape = "square" | "circle" | "diamond" | "triangle" | "shield" | "capsule" | "hex";
export type BrandLogoMotif = "stripe" | "star" | "bolt" | "orbit" | "crown" | "leaf" | "spark";
export type BrandLogoLayout = "monogram" | "stacked" | "wide";

export interface BrandVisualRecipe {
  shape: BrandLogoShape;
  accentColor: string;
  motif: BrandLogoMotif;
  textLayout: BrandLogoLayout;
}

export interface Brand {
  id: string;
  name: string;
  color: string;
  positioning: string;
  createdTick: number;
  industryId: string; // owning business; prepares brands for multi-industry portfolios
  visual?: BrandVisualRecipe;
}

// ---- Universal IP & Licensing ----
export type IPOwnerType = "player" | "external";

export interface IPMarketTerms {
  royaltyRate: number;        // share of net licensed-product revenue, e.g. .08 = 8%
  minimumGuarantee: number;   // cash paid when the contract is signed
  durationsYears: number[];   // simple marketplace choices; no bespoke negotiation engine yet
}

export interface IPAsset {
  id: string;
  name: string;
  ownerType: IPOwnerType;
  ownerName: string;
  createdTick: number;
  awareness: number;          // 0..1 cultural recognition
  momentum: number;           // ~0.6..2.2 current heat / velocity
  prestige: number;           // 0..1 long-run status
  fatigue: number;            // 0..1 overexposure
  audience: Record<AxisKey, number>;
  audienceLabel: string;
  compatibleProductFamilies: string[]; // archetype keys; may include future registry keys
  marketTerms?: IPMarketTerms;
  lifetimeProductRevenue: number;
  lifetimeUnits: number;
  peakAwareness: number;
  peakMomentum: number;
}

export interface IPLicenseContract {
  id: string;
  ipId: string;
  licensorName: string;
  signedTick: number;
  expiresTick: number;
  durationYears: number;
  royaltyRate: number;
  minimumGuarantee: number;
  status: "active" | "expired";
  royaltiesPaid: number;
}

export interface CategoryExpansionProject {
  productKey: string;
  startedTick: number;
  daysLeft: number;
  totalDays: number;
  investment: number;
}

// ---- Vision ----
export type VisionGoal = "quality" | "sales" | "recognition";
export interface Vision {
  goal: VisionGoal;           // best / most sold / most valued
  scope: string;              // industry id OR product key
  audience: string;           // "anyone" or a saved segment id
  audienceLabel: string;      // display name
  setTick: number;            // when this vision was set
  quartersPassed: number;     // how many full quarters since setTick (max 4)
}

export const VISION_GOALS: Record<VisionGoal, { label: string; adjective: string; bonusType: string; bonusMaxIndustry: number; bonusMaxProduct: number; desc: string }> = {
  quality:     { label: "Quality",     adjective: "best",       bonusType: "quality",     bonusMaxIndustry: 0.10, bonusMaxProduct: 0.20, desc: "design quality" },
  sales:       { label: "Sales",       adjective: "most sold",  bonusType: "sales",       bonusMaxIndustry: 0.10, bonusMaxProduct: 0.20, desc: "demand" },
  recognition: { label: "Recognition", adjective: "most valued", bonusType: "recognition", bonusMaxIndustry: 0.10, bonusMaxProduct: 0.20, desc: "brand equity gain" },
};

export type DeptTier = 0 | 1 | 2 | 3; // 0=none, 1=small, 2=medium, 3=large

// ---- Personnel ----
export type PersonnelRole = "product_manager" | "finance" | "marketing" | "strategy" | "operations" | "innovation";
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface PersonnelAttributes {
  expertise: number;
  execution: number;
  creativity: number;
  leadership: number;
  commercial: number;
}

export interface CareerEvent {
  tick: number;
  kind: "hire" | "promotion" | "milestone" | "departure";
  text: string;
}

export interface Personnel {
  id: string;
  name: string;
  role: PersonnelRole;
  rarity: Rarity; // legacy/internal candidate band; no longer the primary player-facing identity
  salary: number; // monthly
  skill: number;  // 0..1 overall effectiveness, derived alongside richer attributes
  age: number;
  hiredTick: number;
  level: 1 | 2 | 3 | 4;
  title: string;
  potential: number;
  performance: number;
  morale: number;
  attributes: PersonnelAttributes;
  specialty: string | null;
  traits: string[];
  careerEvents: CareerEvent[];
  lastPromotionTick: number;
}

export interface FormerPersonnel extends Personnel {
  leftTick: number;
  leftReason: string;
}

export interface TalentCandidate {
  id: string;
  name: string;
  role: PersonnelRole;
  age: number;
  level: 1 | 2 | 3 | 4;
  title: string;
  salaryAsk: number;
  skill: number;
  rarity: Rarity;
  potential: number;
  attributes: PersonnelAttributes;
  specialty: string | null;
  traits: string[];
}

export const RARITY_DEFS: Record<Rarity, { label: string; color: string; salaryMult: number; skillRange: [number, number] }> = {
  common:    { label: "Common",    color: "#9ca3af", salaryMult: 1.0, skillRange: [0.15, 0.35] },
  uncommon:  { label: "Uncommon",  color: "#34d399", salaryMult: 1.6, skillRange: [0.30, 0.50] },
  rare:      { label: "Rare",      color: "#38bdf8", salaryMult: 2.5, skillRange: [0.45, 0.65] },
  epic:      { label: "Epic",      color: "#c084fc", salaryMult: 4.0, skillRange: [0.60, 0.80] },
  legendary: { label: "Legendary", color: "#fbbf24", salaryMult: 7.0, skillRange: [0.80, 0.95] },
};

export const BASE_SALARIES: Record<PersonnelRole, number> = {
  product_manager: 6_000, finance: 4_500, marketing: 5_000, strategy: 5_500, operations: 4_000, innovation: 8_500,
};

// ---- Expertise ----
// per industry + per product category, 0..5 stars, earned from cumulative sales
export interface Expertise {
  industry: Record<string, number>; // industry id -> 0..5
  category: Record<string, number>; // product key -> 0..5
}


export interface CampusPathTile { x: number; y: number; }

export type OperatingRoomKind = "office" | "factory" | "warehouse" | "outsourcing";
export type FacilityTypeId = "office" | "design_studio" | "beauty_center" | "toy_center" | "food_center" | "fashion_atelier" | "electronics_lab" | "research_center" | "training_center" | "brand_studio" | "hr_office" | "marketing_office" | "logistics_office" | "consumer_insights" | "warehouse" | "cold_storage" | "distribution_hub" | "factory" | "outsourcing" | "executive_wing";
export type OperatingTeamKind = "unassigned" | "product" | "marketing" | "finance" | "sales" | "operations" | "strategy" | "innovation";
export interface OperatingRoom {
  id: string;
  kind: OperatingRoomKind;
  x: number; y: number; w: number; h: number;
  name: string;
  team: OperatingTeamKind;
  productKey: string | null;
  skuId: string | null;
  assignedPersonnelIds: string[];
  buildCost: number;
  monthlyCost: number;
  capacity: number; // factory units/month; warehouse standard-space units; office seats; outsourcing supplier capacity
  upgradeLevel?: number; // facility-specific level; Founder Office uses I–IV.
  facilityType?: FacilityTypeId; // visual/gameplay specialization while kind keeps legacy capacity semantics.
  manufacturingFamilies?: string[]; // factories only; Product Engine line compatibility
  storageProfiles?: string[]; // warehouses only; foundation for cold/secure storage modules
}


export type IndustryBusinessStatus = "active" | "entering";

export interface IndustryBusiness {
  industryId: string;
  status: IndustryBusinessStatus;
  enteredTick: number;
  unlockedCategories: string[];
  categoryExpansionProjects: CategoryExpansionProject[];
  capabilities: Record<string, number>; // 0..5 stars; industry-specific capability layer
}

export interface IndustryEntryProject {
  industryId: string;
  route: "organic";
  startedTick: number;
  daysLeft: number;
  totalDays: number;
  investment: number;
}

export interface CorporateCapabilities {
  finance: number;
  strategy: number;
  marketing: number;
  operations: number;
  retail: number;
  people: number;
}

export type ResearchNodeId =
  | "advanced_product_development"
  | "flagship_product_development"
  | "professional_recruiting"
  | "executive_search"
  | "supplier_management"
  | "owned_manufacturing"
  | "organizational_scaling"
  | "corporate_hq"
  | "vertical_expansion"
  | "market_intelligence"
  | "specialized_storage";

export interface ResearchProject {
  nodeId: ResearchNodeId;
  startedTick: number;
  progress: number;
  requiredPoints: number;
  cashCommitted: number;
}

export interface ResearchState {
  completed: ResearchNodeId[];
  active: ResearchProject | null;
  lifetimePoints: number;
}

export interface TrainingProgram {
  id: string;
  personnelId: string;
  facilityRoomId: string;
  startedTick: number;
  daysLeft: number;
  totalDays: number;
  cost: number;
}

export interface PlayerState {
  skus: SKU[];
  contracts: Contract[];
  marketing: number;
  marketingTarget: number;
  marketingFocus: string;
  brandMarketing: number;
  brandMarketingTarget: number;
  backOffice: number;
  backOfficeTarget: number;
  cash: number;
  debt: number;
  lostSales: number;
  receivables: Receivable[];
  financeDept: DeptTier;
  intelDept: DeptTier;
  // organizational infrastructure: operatingRooms is the single physical source of truth
  personnel: Personnel[];
  formerPersonnel: FormerPersonnel[];
  talentMarket: TalentCandidate[];
  talentMarketRefreshTick: number;
  talentSearch?: TalentSearch | null;
  trainingPrograms: TrainingProgram[];
  expertise: Expertise;
  productLearning: Record<string, number>; // 0..1 research coverage for achievements/UI; never a hidden product-stat bonus
  vision: Vision | null;
  operatingRooms: OperatingRoom[];
  campusPaths: CampusPathTile[]; // walkable campus paths. Buildings must connect to the entrance network.
  unlockedCategories: string[];
  categoryExpansionProjects: CategoryExpansionProject[];
  businesses: Record<string, IndustryBusiness | undefined>;
  industryEntryProjects: IndustryEntryProject[];
  corporateCapabilities: CorporateCapabilities;
  research: ResearchState;
}

export const DEPT_TIERS: { tier: DeptTier; label: string; cost: number; detail: string }[] = [
  { tier: 0, label: "None", cost: 0, detail: "Cash balance + quarterly totals only." },
  { tier: 1, label: "Small team", cost: 0, detail: "1–2 staffed seats. Monthly high-level summaries (revenue, costs, share)." },
  { tier: 2, label: "Department", cost: 0, detail: "3–4 staffed seats. Detailed by-SKU and by-segment breakdowns, weekly." },
  { tier: 3, label: "Full department", cost: 0, detail: "5+ staffed seats. Everything, all charts, near-real-time (daily)." },
];

export interface LiveSnapshot {
  income: IncomeStatement;
  cashflow: CashFlow;
  cellFinance: CellFinance[];
  skuResults: SkuResult[];
  totalUnits: number;
  overallShare: number;       // instantaneous (this-tick run-rate) share
  shareMonth: number;         // share over the trailing 30 days (actual units / actual market)
  shareYear: number;          // share over the trailing 360 days
  totalMarket: number;
  totalReach: number;
  onlineCoverage: number;
  avgMarginCut: number;
}

export interface HistoryPoint {
  tick: number;
  quarter: number;
  revenue: number;
  profit: number;
  share: number;
  cash: number;
  operatingCashFlow: number;
}

export interface Campaign {
  id: string;
  name: string;
  segmentId: string;     // saved segment id to target
  agencyId: string;      // which agency runs it
  scope: "company" | "brand" | string; // company/brand or a concrete SKU id
  budget: number;        // total spend
  daysRemaining: number; // ticks left
  totalDays: number;     // original duration
  effectivenessMult: number; // from agency
}


// ---- Company Chronicle ----
export type ChronicleKind = "founding" | "product" | "people" | "operations" | "finance" | "market" | "milestone" | "annual";
export type ChronicleImportance = 1 | 2 | 3;

export interface ChronicleEntry {
  id: string;
  tick: number;
  year: number;
  kind: ChronicleKind;
  importance: ChronicleImportance; // 1=notable, 2=major, 3=iconic
  title: string;
  text: string;
  icon: string;
  entityType?: "company" | "product" | "person" | "building" | "market" | "ip";
  entityId?: string;
  tags?: string[];
  metricValue?: number;
}

export interface ChronicleYearAccumulator {
  year: number;
  revenue: number;
  profit: number;
  units: number;
  startCash: number;
  minCash: number;
  maxCash: number;
  peakShare: number;
  startEmployees: number;
}

export interface AnnualReview {
  year: number;
  revenue: number;
  profit: number;
  units: number;
  startCash: number;
  endCash: number;
  peakShare: number;
  yearEndShare: number;
  productsLaunched: string[];
  hires: number;
  promotions: number;
  departures: number;
  endingEmployees: number;
  headline: string;
  highlightEntryIds: string[];
}

export interface ChronicleState {
  entries: ChronicleEntry[];
  annualReviews: AnnualReview[];
  unlockedMilestones: string[];
  lifetimeRevenue: number;
  lifetimeProfit: number;
  yearAccumulator: ChronicleYearAccumulator;
}

export interface IndustryMarketState {
  industryId: string;
  cube: Cell[];
  comps: Competitor[];
  customers: Record<number, { count: number; satisfaction: number }>;
  brandEquity: Record<string, Record<string, Record<number, { trust: number; prestige: number; value: number; innovation: number }>>>;
  fitCache: Record<string, number[]>;
  fitCacheDirty: boolean;
  unitsTickHistory: number[];
  marketTickHistory: number[];
}

export interface World {
  mode?: GameMode;
  campaign?: CampaignRuntime | null;
  difficulty: DifficultyId;
  investorConfidence: number; // 0..1; only meaningful on difficulties with expectations
  expectationStrikes: number;
  industryId: string;
  cfg: IndustryConfig;
  tick: number;
  company: string;
  brands: Brand[];
  primaryBrandId: string;
  cube: Cell[];
  comps: Competitor[];
  player: PlayerState;
  studies: Study[];
  revealed: Record<string, any>;
  history: HistoryPoint[];
  events: MarketEvent[];
  competitiveReviews: CompetitiveQuarterReview[];
  capital: CapitalState;
  gameplay: GameplayState;
  chronicle: ChronicleState;
  ipAssets: IPAsset[];
  ipLicenses: IPLicenseContract[];
  pendingShockTick: number;
  shock: { type: string; dir?: string; ticksLeft: number } | null;
  live: LiveSnapshot | null;
  selectedCell: Coord | null;
  selectedInfo: any;
  // perf: cached static appeal factor (demoFit × needMatch × categoryPref) per "skuId|cellIndex".
  // recomputed only when products change or segments re-roll, NOT every tick.
  fitCache: Record<string, number[]>;
  fitCacheDirty: boolean;
  savedSegments: import("./segments").SavedSegment[];
  // brand equity is distinct per BRAND and CATEGORY: brandEquity[brandId][productKey][cellIndex].
  // A luxury brand and a value brand inside the same company can therefore develop different reputations.
  brandEquity: Record<string, Record<string, Record<number, { trust: number; prestige: number; value: number; innovation: number }>>>;
  // customer base per cell index: how many people in that segment are "ours", and how satisfied.
  // Sparse — only cells we've acquired customers in. customers ≤ cell.head.
  customers: Record<number, { count: number; satisfaction: number }>;
  // rolling per-tick actual units sold and market consumed, for day/month/year share windows.
  // active one-off marketing campaigns (time-limited, segment-targeted awareness boosts)
  activeCampaigns: Campaign[];
  agencyRelationships: Record<string, number>; // agency id -> campaigns completed (builds trust)
  materialPriceIndex: Record<string, number>; // material id -> price multiplier, 1.0 baseline; Product Engine foundation
  industryMarkets: Record<string, IndustryMarketState | undefined>; // generic per-industry market runtimes; primary fields below remain compatibility aliases
  unitsTickHistory: number[];
  marketTickHistory: number[];
}
