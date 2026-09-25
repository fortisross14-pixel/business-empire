import type { IndustryConfig, ChannelDef, ChannelType, AxisKey } from "./types";
import { productTypesForIndustry } from "./productCatalog";

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const ease = (c: number, t: number, k: number) => c + (t - c) * k;
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export const round = (v: number, d = 0) => { const p = 10 ** d; return Math.round(v * p) / p; };

export const AXES: Record<AxisKey, string[]> = {
  gender: ["Female", "Male"],
  age: ["13-24", "25-39", "40-59", "60+"],
  class: ["Budget", "Middle", "Affluent"],
  leaning: ["Progressive", "Neutral", "Conservative"],
  geography: ["Urban", "Suburban", "Rural"],
  family: ["Single", "Couple", "Family"],
};
export const AXIS_KEYS = Object.keys(AXES) as AxisKey[];
export const axisPos = (axis: AxisKey, idx: number) => {
  const n = AXES[axis].length;
  return n === 1 ? 0.5 : idx / (n - 1);
};

export const POSITIONINGS = [
  { key: "mass", label: "Mass Market", blurb: "Wide, price-sensitive. Volume game." },
  { key: "premium", label: "Premium", blurb: "Quality-led, healthy margin." },
  { key: "luxury", label: "Luxury", blurb: "Exclusive, top quality demanded." },
];
export const BRAND_COLORS = ["#34c3ff", "#a78bfa", "#3fd07f", "#ffb340", "#ff5d6c", "#f472b6", "#22d3ee", "#facc15"];
export const INDUSTRY_ICONS: Record<string, string> = { skincare:"✨", toys:"🧸", food:"🍱", apparel:"👗", electronics:"🎧" };

// Channels carry payment delays now (Milestone 1: cash != profit)
export const CHANNEL_TYPES: Record<ChannelType, ChannelDef> = {
  retail:      { label: "Dept / Big-Box Retail", baseReach: 0.75, marginCut: 0.40, slotting: 60000, awarenessBoost: 0.5, online: 0.1, paymentDays: 90 },
  marketplace: { label: "Marketplace (Amazon)",   baseReach: 0.65, marginCut: 0.25, slotting: 15000, awarenessBoost: 0.35, online: 1.0, paymentDays: 14 },
  ownweb:      { label: "Own E-commerce",         baseReach: 0.25, marginCut: 0.05, slotting: 20000, awarenessBoost: 0.15, online: 1.0, paymentDays: 0 },
  flagship:    { label: "Flagship Store",         baseReach: 0.20, marginCut: 0.10, slotting: 120000, awarenessBoost: 1.0, online: 0.0, paymentDays: 2 },
};

export const METHODS = {
  outsource: { label: "Outsource", mult: 1.35, available: true, note: "Higher per-unit, no setup, ships now." },
  own:       { label: "Own Production", mult: 0.85, available: false, note: "Cheaper per unit — needs factory capacity (none yet)." },
};

export const INDUSTRIES: Record<string, IndustryConfig> = {
  skincare: {
    id: "skincare", label: "Skincare", currency: "$",
    axisWeight: { gender: 0.30, age: 1.0, class: 0.9, leaning: 0.12, geography: 0.25, family: 0.2 },
    spend: {
      class: { Budget: 90, Middle: 240, Affluent: 520 },
      gender: { Female: 1.0, Male: 0.45 },
      age: { "13-24": 0.8, "25-39": 1.3, "40-59": 1.1, "60+": 0.7 },
    },
    products: productTypesForIndustry("skincare"),
    competitors: [
      { name: "Lumière", target: { gender: 0.30, age: 0.70, class: 0.85, leaning: 0.5, geography: 0.5, family: 0.5 }, quality: 0.70, price: 46, priceSens: 0.9, strength: 0.8, personality: "premium", attributes: { luxury: 0.85, scientific: 0.5, natural: 0.3, sensitive: 0.3, value: 0.2 } },
      { name: "DermaPure", target: { gender: 0.30, age: 0.85, class: 0.80, leaning: 0.5, geography: 0.5, family: 0.5 }, quality: 0.80, price: 55, priceSens: 0.7, strength: 0.75, personality: "balanced", attributes: { luxury: 0.4, scientific: 0.9, natural: 0.2, sensitive: 0.6, value: 0.3 } },
    ],
    thirdAxisLabel: "Compact Pack",
    needs: [
      { key: "luxury", label: "Luxury", lean: { class: 0.7, age: 0.2 } },
      { key: "scientific", label: "Scientific", lean: { class: 0.4, age: 0.3 } },
      { key: "natural", label: "Natural", lean: { leaning: -0.4, age: -0.2 } },
      { key: "sensitive", label: "Sensitive Skin", lean: { age: 0.3 } },
      { key: "value", label: "Value", lean: { class: -0.8 } },
    ],
  },
  toys: {
    id: "toys", label: "Toys", currency: "$",
    axisWeight: { gender: 0.20, age: 1.2, class: 0.7, leaning: 0.10, geography: 0.15, family: 0.5 },
    spend: {
      class: { Budget: 120, Middle: 260, Affluent: 480 },
      gender: { Female: 0.9, Male: 1.0 },
      age: { "13-24": 0.7, "25-39": 1.4, "40-59": 1.0, "60+": 0.5 },
    },
    products: productTypesForIndustry("toys"),
    competitors: [
      { name: "FunForge", target: { gender: 0.5, age: 0.45, class: 0.5, leaning: 0.5, geography: 0.5, family: 0.5 }, quality: 0.72, price: 25, priceSens: 1.1, strength: 0.8, personality: "balanced", attributes: { educational: 0.6, creative: 0.6, licensed: 0.3, collectible: 0.3, social: 0.5 } },
      { name: "ToyWorks", target: { gender: 0.5, age: 0.55, class: 0.35, leaning: 0.5, geography: 0.5, family: 0.5 }, quality: 0.70, price: 20, priceSens: 1.3, strength: 0.7, personality: "discounter", attributes: { educational: 0.3, creative: 0.4, licensed: 0.7, collectible: 0.5, social: 0.4 } },
    ],
    thirdAxisLabel: "Brand/License",
    needs: [
      { key: "educational", label: "Educational", lean: { class: 0.5, age: 0.2 } },
      { key: "creative", label: "Creative", lean: { class: 0.3 } },
      { key: "licensed", label: "Licensed", lean: { class: -0.2, age: -0.3 } },
      { key: "collectible", label: "Collectible", lean: { age: -0.2 } },
      { key: "social", label: "Social", lean: { age: -0.1 } },
    ],
  },
  food: {
    id:"food", label:"Packaged Food", currency:"$",
    axisWeight:{gender:.08,age:.55,class:.8,leaning:.35,geography:.3,family:.85},
    spend:{class:{Budget:420,Middle:760,Affluent:1050},gender:{Female:1,Male:.96},age:{"13-24":.8,"25-39":1.2,"40-59":1.1,"60+":.85}},
    products:productTypesForIndustry("food"), competitors:[
      {name:"Harvest & Co",target:{gender:.5,age:.55,class:.65,leaning:.25,geography:.5,family:.65},quality:.76,price:8,priceSens:1.05,strength:.78,personality:"premium",attributes:{taste:.72,health:.72,convenience:.55,value:.42,natural:.8,licensed:.1}},
      {name:"DailyBite",target:{gender:.5,age:.4,class:.32,leaning:.55,geography:.5,family:.55},quality:.66,price:5,priceSens:1.45,strength:.84,personality:"discounter",attributes:{taste:.7,health:.3,convenience:.82,value:.9,natural:.25,licensed:.38}},
    ], thirdAxisLabel:"Pack & Portion", needs:[
      {key:"taste",label:"Taste",lean:{age:-.12}},{key:"health",label:"Health",lean:{class:.35,age:.25,leaning:-.25}},
      {key:"convenience",label:"Convenience",lean:{geography:.25,family:.2,age:-.15}},{key:"value",label:"Value",lean:{class:-.9}},
      {key:"natural",label:"Natural",lean:{class:.25,leaning:-.5}},{key:"licensed",label:"Licensed / IP",lean:{age:-.55,family:.35}},
    ],
  },
  apparel: {
    id:"apparel",label:"Apparel",currency:"$",axisWeight:{gender:.25,age:.75,class:1.05,leaning:.28,geography:.35,family:.25},
    spend:{class:{Budget:380,Middle:820,Affluent:1750},gender:{Female:1.12,Male:.9},age:{"13-24":1.18,"25-39":1.25,"40-59":.92,"60+":.62}},
    products:productTypesForIndustry("apparel"),competitors:[
      {name:"Northline",target:{gender:.5,age:.38,class:.55,leaning:.4,geography:.62,family:.4},quality:.73,price:65,priceSens:1.05,strength:.82,personality:"balanced",attributes:{style:.75,comfort:.72,durability:.7,value:.55,sustainability:.48,prestige:.48,licensed:.28}},
      {name:"Maison Vale",target:{gender:.35,age:.52,class:.88,leaning:.45,geography:.62,family:.35},quality:.84,price:185,priceSens:.7,strength:.7,personality:"premium",attributes:{style:.92,comfort:.58,durability:.72,value:.18,sustainability:.55,prestige:.94,licensed:.15}},
    ],thirdAxisLabel:"Collection Identity",needs:[
      {key:"style",label:"Style",lean:{age:-.35,class:.28,geography:.28}},{key:"comfort",label:"Comfort",lean:{age:.22,family:.18}},{key:"durability",label:"Durability",lean:{age:.2,family:.32}},
      {key:"value",label:"Value",lean:{class:-.88}},{key:"sustainability",label:"Sustainability",lean:{leaning:-.62,class:.2}},{key:"prestige",label:"Luxury / Prestige",lean:{class:.92}},{key:"licensed",label:"Licensed / IP",lean:{age:-.5}},
    ],
  },
  electronics: {
    id:"electronics",label:"Consumer Electronics",currency:"$",axisWeight:{gender:.16,age:.78,class:.95,leaning:.15,geography:.38,family:.4},
    spend:{class:{Budget:260,Middle:780,Affluent:1800},gender:{Female:.9,Male:1.08},age:{"13-24":1.05,"25-39":1.35,"40-59":1,"60+":.55}},
    products:productTypesForIndustry("electronics"),competitors:[
      {name:"Nexora",target:{gender:.5,age:.35,class:.72,leaning:.45,geography:.62,family:.4},quality:.82,price:190,priceSens:.8,strength:.88,personality:"premium",attributes:{performance:.86,reliability:.78,ease_of_use:.72,design:.88,ecosystem:.9,value:.3,privacy:.55}},
      {name:"Voltix",target:{gender:.55,age:.32,class:.4,leaning:.5,geography:.55,family:.42},quality:.7,price:95,priceSens:1.25,strength:.77,personality:"discounter",attributes:{performance:.7,reliability:.64,ease_of_use:.68,design:.55,ecosystem:.5,value:.86,privacy:.36}},
    ],thirdAxisLabel:"Platform / Ecosystem",needs:[
      {key:"performance",label:"Performance",lean:{age:-.28,class:.25}},{key:"reliability",label:"Reliability",lean:{age:.28,family:.25}},{key:"ease_of_use",label:"Ease of Use",lean:{age:.45}},
      {key:"design",label:"Design",lean:{age:-.22,class:.38}},{key:"ecosystem",label:"Ecosystem",lean:{class:.22,geography:.2}},{key:"value",label:"Value",lean:{class:-.88}},{key:"privacy",label:"Privacy",lean:{age:.2,family:.35,leaning:.2}},
    ],
  },
};

// Packaging presets (Release: per-product distribution). Each carries:
//  - needBias: which product NEED attributes it amplifies in the buyer's eyes
//  - ageLean: -1 (skews young) .. +1 (skews older) demographic resonance
//  - classLean: -1 (budget vibe) .. +1 (premium vibe)
export interface PackagingPreset {
  key: string; label: string;
  needBias: Record<string, number>; // partial; multiplies perceived need attributes
  ageLean: number; classLean: number;
}
export const PACKAGING: PackagingPreset[] = [
  { key: "bold",      label: "Bold & Graphic",     needBias: {}, ageLean: -0.6, classLean: -0.1 },
  { key: "colorful",  label: "Colorful & Playful",  needBias: {}, ageLean: -0.8, classLean: -0.3 },
  { key: "minimal",   label: "Minimal & Clean",     needBias: {}, ageLean: -0.1, classLean: 0.4 },
  { key: "serious",   label: "Serious & Clinical",  needBias: {}, ageLean: 0.5, classLean: 0.3 },
  { key: "premium",   label: "Premium & Luxe",      needBias: {}, ageLean: 0.3, classLean: 0.8 },
  { key: "natural",   label: "Natural & Earthy",    needBias: {}, ageLean: 0.0, classLean: 0.0 },
  { key: "retro",     label: "Retro & Nostalgic",   needBias: {}, ageLean: 0.4, classLean: -0.1 },
  { key: "techy",     label: "Sleek & High-Tech",   needBias: {}, ageLean: -0.2, classLean: 0.4 },
];
// Per-industry packaging resonance is content data, not a branch in the demand engine.
// Future industries add another map entry instead of new simulation logic.
export const INDUSTRY_PACKAGING_BIAS: Record<string, Record<string, Record<string, number>>> = {
  skincare: {
    serious: { scientific: 1.3 }, premium: { luxury: 1.4 }, natural: { natural: 1.4, sensitive: 1.1 },
    minimal: { luxury: 1.15, scientific: 1.1 }, techy: { scientific: 1.25 }, colorful: { value: 1.1 },
    bold: { value: 1.05 }, retro: { natural: 1.1 },
  },
  toys: {
    colorful: { creative: 1.3, social: 1.1 }, bold: { licensed: 1.2, collectible: 1.1 },
    serious: { educational: 1.3 }, minimal: { educational: 1.15 }, premium: { collectible: 1.3 },
    retro: { collectible: 1.25 }, techy: { educational: 1.15, licensed: 1.1 }, natural: { creative: 1.1 },
  },
  food: {
    bold:{taste:1.18,licensed:1.15},colorful:{taste:1.12,licensed:1.25},minimal:{health:1.15,natural:1.12},serious:{health:1.25},
    premium:{taste:1.18,natural:1.12},natural:{natural:1.4,health:1.18},retro:{taste:1.1,value:1.08},techy:{convenience:1.25},
  },
  apparel: {
    bold:{style:1.25,licensed:1.12},colorful:{style:1.2,licensed:1.2},minimal:{style:1.12,prestige:1.14},serious:{durability:1.15},
    premium:{prestige:1.38,style:1.15},natural:{sustainability:1.35,comfort:1.1},retro:{style:1.28},techy:{durability:1.12,style:1.12},
  },
  electronics: {
    bold:{performance:1.16},colorful:{design:1.18,value:1.08},minimal:{design:1.3,ease_of_use:1.12},serious:{reliability:1.25,privacy:1.15},
    premium:{design:1.22,performance:1.15},natural:{ease_of_use:1.08},retro:{design:1.15},techy:{performance:1.3,ecosystem:1.22},
  },
};
export function packagingNeedBias(industryId: string, key: string): Record<string, number> {
  return INDUSTRY_PACKAGING_BIAS[industryId]?.[key] ?? {};
}

// ============================================================================
// Universal IP & licensing now lives in engine/ip.ts.
// ============================================================================

// ============================================================================
// Named Distribution Partners — specific retailers the player can sign with.
// Each has a channel type, unique terms, and demographic reach profile.
// ============================================================================
export interface RetailPartner {
  id: string;
  name: string;
  channelType: ChannelType;
  category: "department" | "drugstore" | "specialty" | "online" | "flagship";
  marginCut: number;
  slotting: number;     // quarterly slotting fee
  paymentDays: number;  // how fast they pay you
  reachMult: number;    // how much shelf reach they provide (0..1)
  awarenessBoost: number; // brand visibility from being in this store
  // demographic skew — which segments shop here more
  skew: Partial<Record<AxisKey, number>>; // -1..1 leans
  desc: string;
  industries?: string[]; // if set, only available for these industries (e.g. Sephora for skincare)
}

export const RETAIL_PARTNERS: RetailPartner[] = [
  // Department Stores
  { id: "glamour_dept", name: "Glamour & Lane", channelType: "retail", category: "department",
    marginCut: 0.45, slotting: 15000, paymentDays: 90, reachMult: 0.7, awarenessBoost: 0.08,
    skew: { class: 0.5, age: 0.3 }, desc: "Upscale department store. High margin cut but affluent shoppers." },
  { id: "heritage_dept", name: "Heritage House", channelType: "retail", category: "department",
    marginCut: 0.42, slotting: 12000, paymentDays: 75, reachMult: 0.6, awarenessBoost: 0.06,
    skew: { class: 0.3, age: 0.4 }, desc: "Traditional department store. Broad middle-to-affluent reach." },
  { id: "value_dept", name: "ValueMart", channelType: "retail", category: "department",
    marginCut: 0.35, slotting: 8000, paymentDays: 60, reachMult: 0.8, awarenessBoost: 0.03,
    skew: { class: -0.4 }, desc: "Mass-market retailer. High reach, budget-skewing demographics." },

  // Drugstores / Mass Retail
  { id: "quickmart", name: "QuickMart", channelType: "retail", category: "drugstore",
    marginCut: 0.38, slotting: 10000, paymentDays: 45, reachMult: 0.75, awarenessBoost: 0.04,
    skew: { geography: -0.2 }, desc: "Nationwide drugstore chain. Fast payments, suburban reach." },
  { id: "corner_health", name: "Corner Health", channelType: "retail", category: "drugstore",
    marginCut: 0.40, slotting: 8000, paymentDays: 50, reachMult: 0.5, awarenessBoost: 0.03,
    skew: { age: 0.2 }, desc: "Pharmacy chain. Older demographic, health-conscious." },

  // Specialty Retailers (industry-specific)
  { id: "toy_kingdom", name: "Toy Kingdom", channelType: "retail", category: "specialty",
    marginCut: 0.40, slotting: 12000, paymentDays: 60, reachMult: 0.85, awarenessBoost: 0.10,
    skew: { age: -0.6, family: 0.5 }, desc: "The toy destination. Massive reach with families and kids.",
    industries: ["toys"] },
  { id: "beauty_luxe", name: "Beauty Luxe", channelType: "retail", category: "specialty",
    marginCut: 0.48, slotting: 18000, paymentDays: 60, reachMult: 0.6, awarenessBoost: 0.12,
    skew: { class: 0.6, gender: -0.3 }, desc: "Premium beauty retailer. Affluent women, high prestige.",
    industries: ["skincare"] },
  { id: "skin_science", name: "DermaCare Shops", channelType: "retail", category: "specialty",
    marginCut: 0.42, slotting: 10000, paymentDays: 45, reachMult: 0.45, awarenessBoost: 0.08,
    skew: { class: 0.3, age: 0.2 }, desc: "Dermatology-focused retail. Science-minded buyers.",
    industries: ["skincare"] },
  { id:"freshbasket",name:"FreshBasket",channelType:"retail",category:"specialty",marginCut:.37,slotting:11000,paymentDays:40,reachMult:.78,awarenessBoost:.06,skew:{family:.45,leaning:-.18},desc:"National grocer with strong family and wellness traffic.",industries:["food"] },
  { id:"snackstop",name:"SnackStop",channelType:"retail",category:"specialty",marginCut:.34,slotting:7000,paymentDays:28,reachMult:.62,awarenessBoost:.04,skew:{age:-.45,geography:.25},desc:"Convenience chain built for impulse and on-the-go occasions.",industries:["food"] },
  { id:"stylehouse",name:"StyleHouse",channelType:"retail",category:"specialty",marginCut:.44,slotting:15000,paymentDays:60,reachMult:.68,awarenessBoost:.1,skew:{age:-.2,class:.35,geography:.25},desc:"Fashion-led multi-brand retailer with strong merchandising influence.",industries:["apparel"] },
  { id:"sportcore",name:"SportCore",channelType:"retail",category:"specialty",marginCut:.4,slotting:12000,paymentDays:50,reachMult:.58,awarenessBoost:.07,skew:{age:-.18,class:.12},desc:"Performance and active-lifestyle specialist.",industries:["apparel"] },
  { id:"techworld",name:"TechWorld",channelType:"retail",category:"specialty",marginCut:.39,slotting:16000,paymentDays:45,reachMult:.8,awarenessBoost:.09,skew:{age:-.22,class:.25},desc:"National electronics authority with demonstration space and expert staff.",industries:["electronics"] },
  { id:"gamegrid",name:"GameGrid",channelType:"retail",category:"specialty",marginCut:.36,slotting:9000,paymentDays:35,reachMult:.52,awarenessBoost:.07,skew:{age:-.55,gender:.25},desc:"Enthusiast gaming retailer with a highly engaged audience.",industries:["electronics"] },
  { id:"hometech",name:"HomeTech",channelType:"retail",category:"specialty",marginCut:.38,slotting:10000,paymentDays:42,reachMult:.5,awarenessBoost:.06,skew:{family:.45,age:.15},desc:"Smart-home specialist trusted for installation-heavy products.",industries:["electronics"] },

  // Online Marketplaces
  { id: "megazon", name: "Megazon", channelType: "marketplace", category: "online",
    marginCut: 0.22, slotting: 5000, paymentDays: 14, reachMult: 0.9, awarenessBoost: 0.02,
    skew: { age: -0.2, geography: 0.2 }, desc: "Dominant online marketplace. Maximum reach, fast payment, low prestige." },
  { id: "niche_market", name: "CraftBay", channelType: "marketplace", category: "online",
    marginCut: 0.18, slotting: 2000, paymentDays: 7, reachMult: 0.3, awarenessBoost: 0.04,
    skew: { class: 0.2, leaning: -0.3 }, desc: "Artisan/indie marketplace. Small but premium, very fast payment." },

  // Direct / Own Web
  { id: "own_web", name: "Your Website", channelType: "ownweb", category: "online",
    marginCut: 0.05, slotting: 0, paymentDays: 0, reachMult: 0.15, awarenessBoost: 0.01,
    skew: {}, desc: "Direct to consumer. Best margins, lowest reach." },

  // Flagship
  { id: "flagship_store", name: "Flagship Store", channelType: "flagship", category: "flagship",
    marginCut: 0.08, slotting: 0, paymentDays: 2, reachMult: 0.1, awarenessBoost: 0.15,
    skew: { class: 0.6, geography: 0.5 }, desc: "Your own branded store. Builds prestige, low reach but high brand equity." },
];

// ============================================================================
// Marketing Agencies — external campaign partners.
// Each has a specialization, price tier, and a relationship that builds with use.
// Better relationship = better campaign effectiveness.
// ============================================================================
export interface MarketingAgency {
  id: string;
  name: string;
  specialization: string;  // what they're good at
  baseCostMult: number;    // multiplier on campaign budget (cheap=0.8, expensive=1.5)
  effectivenessMult: number; // how well they execute (0..1.5)
  // what segments they're best at reaching
  strengthSkew: Partial<Record<AxisKey, number>>;
  desc: string;
}

export const MARKETING_AGENCIES: MarketingAgency[] = [
  { id: "spark", name: "Spark Creative", specialization: "Youth & digital",
    baseCostMult: 0.9, effectivenessMult: 1.0,
    strengthSkew: { age: -0.5, geography: 0.3 },
    desc: "Young, scrappy agency. Strong with Gen Z and digital-first audiences. Affordable but chaotic." },
  { id: "heritage", name: "Heritage & Co", specialization: "Premium & legacy brands",
    baseCostMult: 1.5, effectivenessMult: 1.3,
    strengthSkew: { class: 0.5, age: 0.3 },
    desc: "Old-money agency. Expensive but their campaigns build real prestige. Best for affluent segments." },
  { id: "budgetblast", name: "BudgetBlast", specialization: "Mass market & value",
    baseCostMult: 0.7, effectivenessMult: 0.8,
    strengthSkew: { class: -0.4 },
    desc: "Volume play. Cheapest option, reaches the most people, but broad and unrefined." },
];
