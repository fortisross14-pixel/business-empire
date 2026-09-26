import React, { useEffect, useMemo, useRef, useState } from "react";
import type { World, FacilityTypeId, OperatingRoom, OperatingTeamKind, Personnel, SKU, IndustryBusiness } from "../../engine/types";
import type { StorageProfileId } from "../../engine/productCatalog";
import { PRODUCT_PROJECT_TIERS } from "../../engine/types";
import { C, ctrlBtn, bigBtn, fmtMoney, fmtNum } from "../theme";
import { BUILDABLE_FACILITY_IDS, CAMPUS_ENTRANCE, CAMPUS_MAP_SIZE, CAMPUS_PATH_COST, FACILITY_DEFS, adjacentTiles, campusPathConnectedSet, facilityBuildRequirement, facilityDefForRoom, facilityDemolitionRefund, facilityFootprintForLevel, facilityMoveCost, facilityUpgradeQuote, facilityUpgradeRequirement, officeStageForLevel, roleFitsRoom, roomFacilityType, roomTouchesConnectedPath, storageModuleRequirement, WAREHOUSE_MODULE_COST } from "../../engine/infrastructure";
import { brandById, primaryBrand } from "../../engine/brands";
import { archetypeByKey, defaultFactoryFamiliesForIndustry, MANUFACTURING_FAMILIES, STORAGE_PROFILES } from "../../engine/productCatalog";
import { canCreateProduct, canDemolishFacility, inventoryUsed, productionLeadDays } from "../../engine/capacity";
import { INDUSTRIES } from "../../engine/industries";
import { campusAssetImage, CAMPUS_ASSETS, roomCampusAsset } from "../campus/assetRegistry";
import { teamEffectiveness } from "../../engine/people";
import { researchDef } from "../../engine/research";

const MAP = 48;
const TW = 54;
const TH = 27;

type BuildTool = FacilityTypeId | "path";
type TeamKind = OperatingTeamKind;
type Room = OperatingRoom;
type NavTarget = { top: string; sub: string; label: string };

const TEAM_LABEL: Record<TeamKind, string> = {
  unassigned: "Unassigned",
  product: "Product Management",
  marketing: "Marketing",
  finance: "Finance & FP&A",
  sales: "Sales & Distribution",
  operations: "Operations",
  strategy: "Corporate Strategy",
  innovation: "Innovation / R&D",
};

function iso(x: number, y: number, ox: number, oy: number, zoom: number) {
  return { x: (x - y) * (TW / 2) * zoom + ox, y: (x + y) * (TH / 2) * zoom + oy };
}

function screenToTile(sx: number, sy: number, ox: number, oy: number, zoom: number) {
  const x = (sx - ox) / zoom;
  const y = (sy - oy) / zoom;
  return {
    x: Math.floor((y / (TH / 2) + x / (TW / 2)) / 2),
    y: Math.floor((y / (TH / 2) - x / (TW / 2)) / 2),
  };
}

function fittedCampusCamera(width: number, height: number, rooms: Room[], compact: boolean) {
  const bounds = rooms.reduce((box, room) => ({
    minX: Math.min(box.minX, room.x), minY: Math.min(box.minY, room.y),
    maxX: Math.max(box.maxX, room.x + room.w), maxY: Math.max(box.maxY, room.y + room.h),
  }), { minX: CAMPUS_ENTRANCE.x, minY: CAMPUS_ENTRANCE.y, maxX: CAMPUS_ENTRANCE.x + 1, maxY: CAMPUS_ENTRANCE.y + 1 });
  // Keep the active campus large on phones instead of zooming to the entire 48x48 lot.
  // A small company should feel like a place, not a postage stamp in an empty field.
  const margin = compact ? 2.6 : 3.5;
  const minX = Math.max(0, bounds.minX - margin), minY = Math.max(0, bounds.minY - margin);
  const maxX = Math.min(MAP, bounds.maxX + margin), maxY = Math.min(MAP, bounds.maxY + margin);
  const span = Math.max(4, (maxX - minX) + (maxY - minY));
  const fitX = (width * (compact ? .82 : .74)) / (span * (TW / 2));
  const fitY = (height * (compact ? .56 : .62)) / (span * (TH / 2));
  const minZoom = compact ? .48 : .44;
  const maxZoom = compact ? .78 : .88;
  const zoom = Math.max(minZoom, Math.min(maxZoom, fitX, fitY));
  const gx = (minX + maxX) / 2, gy = (minY + maxY) / 2;
  const targetX = width * (compact ? .50 : .53);
  const targetY = height * (compact ? .62 : .58);
  return { x: targetX - (gx - gy) * (TW / 2) * zoom, y: targetY - (gx + gy) * (TH / 2) * zoom, zoom };
}

function overlaps(a: Pick<Room, "x" | "y" | "w" | "h">, b: Pick<Room, "x" | "y" | "w" | "h">) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function hashText(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function productColor(sku: SKU, fallback: string) {
  const hue = hashText(sku.name) % 360;
  return sku.name ? `hsl(${hue} 62% 57%)` : fallback;
}

function shade(hex: string, amt: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return hex;
  const n = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function roomNavigation(room: Room): NavTarget {
  if (room.id === "founder-office") return { top: "mgmt", sub: "company", label: "Enter Company HQ" };
  if (room.kind === "factory") return { top: "ops", sub: "products", label: "Open production" };
  if (room.kind === "warehouse") return { top: "ops", sub: "inventory", label: "Open inventory" };
  if (room.kind === "outsourcing") return { top: "ops", sub: "products", label: "Open sourcing / products" };
  if (room.team === "product") return { top: "ops", sub: "products", label: "Open products" };
  if (room.team === "marketing") return { top: "mkt", sub: "campaigns", label: "Open marketing" };
  if (room.team === "finance") return { top: "fin", sub: "overview", label: "Open finance" };
  if (room.team === "sales") return { top: "ops", sub: "distribution", label: "Open distribution" };
  if (room.team === "strategy") return { top: "mgmt", sub: "strategy", label: "Open strategy" };
  if (room.team === "innovation") return { top: "mgmt", sub: "research", label: "Open research" };
  return { top: "mgmt", sub: "personnel", label: "Open personnel" };
}

function roomHeight(room: Room) {
  if (room.kind === "office") return room.id === "founder-office" ? 44 : 52;
  if (room.kind === "factory") return 38;
  if (room.kind === "warehouse") return 30;
  return 36;
}

export function CompanyMapView({ world, openCreator, updateRooms, buildRoom, buildPath, buildPathLine, moveRoom, demolishRoom, upgradeRoom, retoolFactory, installWarehouseModule, onNavigate }: {
  world: World;
  openCreator: () => void;
  updateRooms: (rooms: OperatingRoom[]) => void;
  buildRoom: (room: OperatingRoom) => boolean;
  buildPath: (x: number, y: number) => { ok: boolean; reason?: string };
  buildPathLine: (tiles: { x: number; y: number }[]) => { ok: boolean; reason?: string; built: number };
  moveRoom: (roomId: string, placement: { x: number; y: number; w: number; h: number }) => { ok: boolean; reason?: string };
  demolishRoom: (roomId: string) => { ok: boolean; reason?: string };
  upgradeRoom: (roomId: string, placement?: { x: number; y: number; w: number; h: number }) => { ok: boolean; reason?: string };
  retoolFactory: (roomId: string, productKey: string) => boolean;
  installWarehouseModule: (roomId: string, profile: StorageProfileId) => { ok: boolean; reason?: string };
  onNavigate: (top: string, sub: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rooms = world.player.operatingRooms;
  const paths = world.player.campusPaths ?? [];
  const companyBrand = primaryBrand(world);
  const setRooms = (next: Room[] | ((prev: Room[]) => Room[])) => updateRooms(typeof next === "function" ? next(rooms) : next);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expansionTargetId, setExpansionTargetId] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [confirmDemolishId, setConfirmDemolishId] = useState<string | null>(null);
  const [tool, setTool] = useState<BuildTool | "select" | "navigate">("select");
  const [hover, setHover] = useState({ x: 0, y: 0 });
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0 });
  const [pressedRoomId, setPressedRoomId] = useState<string | null>(null);
  const [camera, setCamera] = useState({ x: 480, y: 28, zoom: 0.72 });
  const [message, setMessage] = useState("Start from the entrance: build a path, then place your first office beside it.");
  const [visualClock, setVisualClock] = useState(Date.now());
  const [buildFx, setBuildFx] = useState<{ id: string; until: number } | null>(null);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [pathDraft, setPathDraft] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [compact, setCompact] = useState(false);
  const drag = useRef<{ active: boolean; moved: boolean; x: number; y: number; originX: number; originY: number; threshold: number }>({ active: false, moved: false, x: 0, y: 0, originX: 0, originY: 0, threshold: 7 });
  const pathStart = useRef<{ x: number; y: number } | null>(null);
  const roomsCountRef = useRef(rooms.length);
  const roomsRef = useRef(rooms);
  useEffect(() => { roomsCountRef.current = rooms.length; roomsRef.current = rooms; }, [rooms]);

  useEffect(() => {
    const id = window.setInterval(() => setVisualClock(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const apply = () => {
      const width = wrapRef.current?.clientWidth || window.innerWidth;
      const height = wrapRef.current?.clientHeight || Math.max(320, window.innerHeight - 92);
      const isCompact = width < 980;
      setCompact(isCompact);
      setCamera(fittedCampusCamera(width, height, roomsRef.current, isCompact));
    };
    apply(); window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [rooms.length]);

  const selected = rooms.find((r) => r.id === selectedId) ?? null;
  const expansionRoom = expansionTargetId ? rooms.find((r) => r.id === expansionTargetId) ?? null : null;
  const expansionQuote = expansionRoom ? facilityUpgradeQuote(expansionRoom) : null;
  const expansionSize = expansionRoom && expansionQuote ? facilityFootprintForLevel(roomFacilityType(expansionRoom), expansionQuote.nextLevel, expansionRoom) : null;
  const movingRoom = moveTargetId ? rooms.find((r) => r.id === moveTargetId) ?? null : null;
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (buildMenuOpen) { setBuildMenuOpen(false); return; }
      if (pulseOpen) { setPulseOpen(false); return; }
      if (expansionTargetId) { setSelectedId(expansionTargetId); setExpansionTargetId(null); setMessage("Expansion cancelled."); return; }
      if (moveTargetId) { setSelectedId(moveTargetId); setMoveTargetId(null); setMessage("Move cancelled."); return; }
      if (selectedId) setSelectedId(null);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [buildMenuOpen, pulseOpen, expansionTargetId, moveTargetId, selectedId]);
  const productRooms = rooms.filter((r) => r.kind === "office" && (r.team === "product" || r.id === "founder-office") && r.productKey);
  const hasFactory = rooms.some((r) => r.kind === "factory");
  const hasWarehouse = rooms.some((r) => r.kind === "warehouse");
  const hasSourcing = rooms.some((r) => r.kind === "outsourcing") || Boolean(rooms.find((r) => r.id === "founder-office")?.assignedPersonnelIds.some((id) => world.player.personnel.find((p) => p.id === id)?.role === "operations"));
  const totalBuildCost = rooms.reduce((sum, r) => sum + r.buildCost, 0);
  const monthlyRoomCost = rooms.reduce((sum, r) => sum + r.monthlyCost, 0);
  const warehouseUnits = rooms.filter((r) => r.kind === "warehouse").reduce((a, r) => a + r.capacity, 0);
  const inventoryOnHand = world.player.skus.reduce((a, s) => a + s.inventory, 0);
  const inventoryInbound = world.player.skus.reduce((a, s) => a + (s.mfgBatchSize ?? 0), 0);
  const inventoryUnits = inventoryOnHand + inventoryInbound;
  const warehouseUsed = inventoryUsed(world);
  const warehouseUtil = warehouseUnits > 0 ? Math.min(1, warehouseUsed / warehouseUnits) : 0;
  const factoryUnits = rooms.filter((r) => r.kind === "factory").reduce((a, r) => a + r.capacity, 0);
  const supplierUnits = rooms.filter((r) => r.kind === "outsourcing").reduce((a, r) => a + r.capacity, 0);
  const ownBatches = world.player.skus.filter((s) => s.method === "own" && (s.mfgBatchSize ?? 0) > 0);
  const outsourceBatches = world.player.skus.filter((s) => s.method === "outsource" && (s.mfgBatchSize ?? 0) > 0);
  const activeSkus = world.player.skus.filter((s) => !s.archived && s.status === "active");
  const staffedSeats = rooms.filter((r) => r.kind === "office").reduce((n, r) => n + r.assignedPersonnelIds.length + (r.id === "founder-office" ? 1 : 0), 0);
  const totalSeats = rooms.filter((r) => r.kind === "office").reduce((n, r) => n + r.capacity, 0);
  const salesPulse = world.live?.totalUnits ?? 0;
  const activeBusinesses = Object.values(world.player.businesses ?? {}).filter((b): b is IndustryBusiness => Boolean(b && b.status === "active"));
  const activeProductTypes = [...new Map(activeBusinesses.flatMap((b) => b.unlockedCategories).map((key) => [key, archetypeByKey(key)] as const)).values()].filter((p): p is NonNullable<typeof p> => Boolean(p));

  const flow = useMemo(() => productRooms.map((r) => {
    const sku = world.player.skus.find((s) => !s.archived && s.id === r.skuId) ?? world.player.skus.find((s) => !s.archived && s.productKey === r.productKey);
    const productionReady = sku?.method === "own" ? hasFactory : hasSourcing;
    return {
      room: r,
      label: archetypeByKey(r.productKey ?? "")?.label ?? "New Product",
      sku,
      productionReady,
      inventoryReady: hasWarehouse,
      routeReady: Boolean(sku?.assignedPartnerIds?.length) || world.player.contracts.length > 0,
    };
  }), [productRooms, world, hasFactory, hasWarehouse, hasSourcing]);

  const roomStatus = (room: Room) => {
    const facilityType = roomFacilityType(room);
    const occupiedSeats = room.assignedPersonnelIds.length + (room.id === "founder-office" ? 1 : 0);
    const occupancy = room.capacity ? occupiedSeats / room.capacity : 0;
    if (facilityType === "training_center") {
      const active = (world.player.trainingPrograms ?? []).filter((program) => program.facilityRoomId === room.id);
      const progress = room.capacity ? active.length / room.capacity : 0;
      return { label: active.length ? `${active.length}/${room.capacity} training` : "Training ready", progress, tone: active.length ? "active" : "neutral" };
    }
    if (room.kind === "warehouse") {
      const tone = warehouseUtil > .9 ? "critical" : warehouseUtil > .72 ? "warn" : "ok";
      return { label: `${Math.round(warehouseUtil * 100)}% full`, progress: warehouseUtil, tone };
    }
    if (room.kind === "factory") {
      const load = factoryUnits ? Math.min(1, ownBatches.reduce((n, s) => n + (s.mfgBatchSize ?? 0), 0) / Math.max(factoryUnits, 1)) : 0;
      if (teamEffectiveness(world, "operations") <= 0) return { label: "Blocked · needs Operations", progress: 0, tone: "blocked" };
      return { label: ownBatches.length ? `${ownBatches.length} batch${ownBatches.length > 1 ? "es" : ""} running` : "Idle capacity", progress: load, tone: ownBatches.length ? "active" : "idle" };
    }
    if (room.kind === "outsourcing") {
      const load = supplierUnits ? Math.min(1, outsourceBatches.reduce((n, s) => n + (s.mfgBatchSize ?? 0), 0) / Math.max(supplierUnits, 1)) : 0;
      if (teamEffectiveness(world, "operations") <= 0) return { label: "Blocked · needs Operations", progress: 0, tone: "blocked" };
      return { label: outsourceBatches.length ? `${outsourceBatches.length} supplier batch${outsourceBatches.length > 1 ? "es" : ""}` : "Partners ready", progress: load, tone: outsourceBatches.length ? "active" : "idle" };
    }
    if (facilityType === "research_center") {
      const project = world.player.research?.active;
      if (project && room.assignedPersonnelIds.length === 0) return { label: "Blocked · research unstaffed", progress: project.progress / project.requiredPoints, tone: "blocked" };
      if (project) return { label: `${researchDef(project.nodeId).title} · ${Math.round(project.progress / project.requiredPoints * 100)}%`, progress: project.progress / project.requiredPoints, tone: "active" };
      return { label: room.assignedPersonnelIds.length ? "Research team ready" : "Idle · no research team", progress: occupancy, tone: room.assignedPersonnelIds.length ? "ok" : "idle" };
    }
    if (facilityType === "marketing_office") {
      const campaigns = world.activeCampaigns.length;
      const spending = world.player.marketingTarget > 0 || world.player.brandMarketingTarget > 0;
      if ((campaigns || spending) && room.assignedPersonnelIds.length === 0) return { label: "Blocked · marketing unstaffed", progress: 0, tone: "blocked" };
      if (campaigns) return { label: `${campaigns} campaign${campaigns === 1 ? "" : "s"} live`, progress: Math.min(1, campaigns / Math.max(1, room.capacity)), tone: "active" };
      return { label: spending ? "Always-on marketing" : "Campaign team ready", progress: spending ? .55 : occupancy, tone: spending ? "active" : "idle" };
    }
    if (facilityType === "brand_studio") {
      const active = world.player.brandMarketingTarget > 0;
      return { label: active ? "Brand building live" : "Brand studio ready", progress: active ? Math.min(1, world.player.brandMarketingTarget / 300_000) : occupancy, tone: active ? "active" : "idle" };
    }
    if (facilityType === "consumer_insights") {
      const studies = world.studies.filter((study) => !study.done).length;
      return { label: studies ? `${studies} market stud${studies === 1 ? "y" : "ies"} running` : "Insights team ready", progress: studies ? Math.min(1, studies / 3) : occupancy, tone: studies ? "active" : "idle" };
    }
    if (facilityType === "hr_office") {
      return world.player.talentSearch ? { label: `Talent search · ${Math.ceil(world.player.talentSearch.daysLeft)}d`, progress: 1 - world.player.talentSearch.daysLeft / world.player.talentSearch.totalDays, tone: "active" } : { label: "Talent team ready", progress: occupancy, tone: "idle" };
    }
    const linkedSku = room.skuId ? world.player.skus.find((s) => s.id === room.skuId) : null;
    const productSku = linkedSku ?? (room.team === "product" && room.productKey ? world.player.skus.find((s) => s.productKey === room.productKey && s.status === "designing") : null);
    if (productSku?.status === "designing") {
      const tier = productSku.projectTier ?? (productSku.designDepth === "breakthrough" ? "AAA" : productSku.designDepth === "advanced" ? "AA" : "A");
      const total = PRODUCT_PROJECT_TIERS[tier].baseDays;
      return { label: `${productSku.name} · ${Math.max(0, productSku.designDaysLeft)}d`, progress: Math.max(0, Math.min(1, 1 - productSku.designDaysLeft / total)), tone: "active" };
    }
    return { label: `${occupiedSeats}/${room.capacity} positions`, progress: occupancy, tone: room.id === "founder-office" ? "ok" : room.team === "unassigned" ? "attention" : occupiedSeats ? "ok" : "idle" };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ratio = window.devicePixelRatio || 1;
    const width = wrap.clientWidth;
    const height = compact
      ? Math.max(260, wrap.clientHeight || window.innerHeight - 96)
      : Math.max(470, Math.min(900, wrap.clientHeight || window.innerHeight - 92));
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#eef3f2");
    bg.addColorStop(.58, "#e5eceb");
    bg.addColorStop(1, "#d9e3e2");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const drawDiamond = (x: number, y: number, fill: string, stroke: string, alpha = 1) => {
      const p = iso(x, y, camera.x, camera.y, camera.zoom);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + TW / 2 * camera.zoom, p.y + TH / 2 * camera.zoom);
      ctx.lineTo(p.x, p.y + TH * camera.zoom);
      ctx.lineTo(p.x - TW / 2 * camera.zoom, p.y + TH / 2 * camera.zoom);
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = stroke; ctx.lineWidth = 0.55; ctx.stroke();
      ctx.globalAlpha = 1;
    };

    // Empty grass parcel. Paths are player-built from the fixed entrance.
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
      drawDiamond(x, y, (x + y) % 2 ? "#e8efed" : "#e3ebe8", "#ccd9d5", 0.9);
    }
    for (const path of paths) drawDiamond(path.x, path.y, (path.x + path.y) % 2 ? "#cbd5dc" : "#bfcbd3", "#8797a2", 1);
    ctx.save();
    const lot = [iso(0, 0, camera.x, camera.y, camera.zoom), iso(MAP, 0, camera.x, camera.y, camera.zoom), iso(MAP, MAP, camera.x, camera.y, camera.zoom), iso(0, MAP, camera.x, camera.y, camera.zoom)];
    ctx.beginPath(); lot.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.closePath();
    ctx.strokeStyle = "rgba(45,65,78,.48)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    // Campus entrance is the one piece of infrastructure present on day one.
    const entrance = iso(CAMPUS_ENTRANCE.x + .5, CAMPUS_ENTRANCE.y + .5, camera.x, camera.y, camera.zoom);
    ctx.save();
    const entranceLabelW = Math.max(128, 112 * camera.zoom);
    const entranceLabelX = Math.max(entranceLabelW / 2 + 8, Math.min(width - entranceLabelW / 2 - 8, entrance.x));
    ctx.fillStyle = "rgba(17,42,67,.94)"; roundedRect(ctx, entranceLabelX - entranceLabelW / 2, entrance.y - 38 * camera.zoom, entranceLabelW, 25 * camera.zoom, 6 * camera.zoom); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.max(9, 10 * camera.zoom)}px system-ui`; ctx.textAlign = "center"; ctx.fillText("CAMPUS ENTRANCE", entranceLabelX, entrance.y - 21 * camera.zoom);
    ctx.restore();

    // Concrete apron around every facility makes the campus read as a place, not loose boxes.
    for (const room of rooms) {
      for (let yy = room.y - 1; yy <= room.y + room.h; yy++) {
        for (let xx = room.x - 1; xx <= room.x + room.w; xx++) {
          if (xx >= 0 && yy >= 0 && xx < MAP && yy < MAP) drawDiamond(xx, yy, "#e9eeee", "#c8d1d1", .94);
        }
      }
    }

    // Art-pack decor is intentionally data-driven and non-simulated. It can be moved/replaced later
    // without changing the room/save schema.
    const drawCampusSprite = (assetId: keyof typeof CAMPUS_ASSETS, tileX: number, tileY: number, tileW?: number, tileH?: number, opacity = 1) => {
      const asset = CAMPUS_ASSETS[assetId];
      const img = campusAssetImage(asset, () => setVisualClock(Date.now()));
      if (!img || !img.complete || !img.naturalWidth) return;
      const w = tileW ?? asset.footprint.w, h = tileH ?? asset.footprint.h;
      const base = iso(tileX + w / 2, tileY + h, camera.x, camera.y, camera.zoom);
      const projectedWidth = (w + h) * (TW / 2) * camera.zoom;
      const drawW = Math.max(72, projectedWidth * asset.scale);
      const drawH = drawW * (img.naturalHeight / img.naturalWidth);
      ctx.save(); ctx.globalAlpha = opacity;
      ctx.drawImage(img, base.x - drawW * asset.anchor.x, base.y - drawH * asset.anchor.y, drawW, drawH);
      ctx.restore();
    };

    const drawFacilityPreview = (facilityType: FacilityTypeId, tileX: number, tileY: number, tileW: number, tileH: number, valid: boolean) => {
      const meta = FACILITY_DEFS[facilityType];
      const previewRoom: Room = { id: "preview", kind: meta.kind, facilityType, x: tileX, y: tileY, w: tileW, h: tileH, name: meta.label, team: meta.team, productKey: null, skuId: null, assignedPersonnelIds: [], buildCost: meta.buildCost, monthlyCost: meta.monthlyCost, capacity: meta.capacity, upgradeLevel: 1 };
      const asset = roomCampusAsset(world, previewRoom);
      const image = campusAssetImage(asset, () => setVisualClock(Date.now()));
      if (!image?.complete || !image.naturalWidth) return;
      const base = iso(tileX + tileW / 2, tileY + tileH, camera.x, camera.y, camera.zoom);
      const projectedWidth = (tileW + tileH) * (TW / 2) * camera.zoom;
      const drawW = Math.max(105, projectedWidth * asset.scale);
      const drawH = drawW * image.naturalHeight / image.naturalWidth;
      ctx.save(); ctx.globalAlpha = .52; ctx.filter = valid ? "saturate(.95)" : "grayscale(.7) sepia(.25) hue-rotate(310deg)";
      ctx.drawImage(image, base.x - drawW * asset.anchor.x, base.y - drawH * asset.anchor.y, drawW, drawH);
      ctx.restore();
    };

    // Small environmental anchors keep the campus from feeling empty while staying outside simulation state.
    const decorSlots = [
      { id: "landscaping" as const, x: 5, y: 32, w: 4, h: 4, opacity: .9 },
      { id: "parking_signage" as const, x: 23, y: 33, w: 4, h: 3, opacity: .86 },
    ];
    if (rooms.length >= 2) {
      for (const slot of decorSlots) {
        if (!rooms.some((room) => overlaps({ x: slot.x, y: slot.y, w: slot.w, h: slot.h }, room)))
          drawCampusSprite(slot.id, slot.x, slot.y, slot.w, slot.h, slot.opacity);
      }
    }

    const drawTruck = (room: Room, idx: number, activity: number) => {
      if (activity <= 0) return;
      const center = iso(room.x + room.w / 2, room.y + room.h + .75, camera.x, camera.y, camera.zoom);
      const t = ((visualClock / 1400 + idx * 1.7) % 1);
      const dx = (t - .5) * 88 * camera.zoom;
      const x = center.x + dx, y = center.y + 10 + Math.abs(t - .5) * 10;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = "rgba(30,41,59,.18)"; ctx.beginPath(); ctx.ellipse(0, 8, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = companyBrand.color; ctx.fillRect(-11, -5, 16, 10);
      ctx.fillStyle = shade(companyBrand.color, -28); ctx.fillRect(5, -2, 8, 7);
      ctx.fillStyle = "#1f2937"; ctx.beginPath(); ctx.arc(-6, 6, 2.5, 0, Math.PI * 2); ctx.arc(8, 6, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawPerson = (room: Room, person: Personnel, idx: number) => {
      const center = iso(room.x + room.w / 2, room.y + room.h + .2, camera.x, camera.y, camera.zoom);
      const seed = hashText(person.id) % 1000;
      const phase = visualClock / 1100 + seed / 93;
      const radius = (14 + (seed % 20)) * camera.zoom;
      const x = center.x + Math.cos(phase + idx) * radius;
      const y = center.y + 5 + Math.sin(phase * .7 + idx) * radius * .33;
      ctx.fillStyle = "rgba(31,41,55,.18)"; ctx.beginPath(); ctx.ellipse(x, y + 4, 3.2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = idx % 3 === 0 ? companyBrand.color : idx % 3 === 1 ? "#334155" : "#64748b";
      ctx.fillRect(x - 1.8, y - 1, 3.6, 6);
      ctx.fillStyle = "#f2c9a5"; ctx.beginPath(); ctx.arc(x, y - 2.8, 2.2, 0, Math.PI * 2); ctx.fill();
    };

    const drawPackageStack = (room: Room) => {
      const top = world.player.skus.filter((s) => s.inventory + (s.mfgBatchSize ?? 0) > 0).sort((a, b) => (b.inventory + (b.mfgBatchSize ?? 0)) - (a.inventory + (a.mfgBatchSize ?? 0))).slice(0, 3);
      if (!top.length) return;
      const p = iso(room.x + room.w - .5, room.y + room.h - .15, camera.x, camera.y, camera.zoom);
      top.forEach((sku, i) => {
        const x = p.x + (i - 1) * 9 * camera.zoom;
        const y = p.y - i * 2;
        ctx.fillStyle = brandById(world, sku.brandId).color;
        ctx.fillRect(x - 4, y - 7, 8, 7);
        ctx.strokeStyle = "rgba(30,41,59,.35)"; ctx.strokeRect(x - 4, y - 7, 8, 7);
      });
    };

    const drawBuilding = (room: Room) => {
      const selectedNow = room.id === selectedId;
      const hoveredNow = room.id === hoveredRoomId && (tool === "select" || tool === "navigate") && !drag.current.moved;
      const pressedNow = room.id === pressedRoomId;
      const status = roomStatus(room);
      const rawH = roomHeight(room) * camera.zoom;
      const p0 = iso(room.x, room.y, camera.x, camera.y, camera.zoom);
      const p1 = iso(room.x + room.w, room.y, camera.x, camera.y, camera.zoom);
      const p2 = iso(room.x + room.w, room.y + room.h, camera.x, camera.y, camera.zoom);
      const p3 = iso(room.x, room.y + room.h, camera.x, camera.y, camera.zoom);
      const t0 = { x: p0.x, y: p0.y - rawH }, t1 = { x: p1.x, y: p1.y - rawH }, t2 = { x: p2.x, y: p2.y - rawH }, t3 = { x: p3.x, y: p3.y - rawH };
      const center = iso(room.x + room.w / 2, room.y + room.h / 2, camera.x, camera.y, camera.zoom);
      const asset = roomCampusAsset(world, room);
      const assetImg = campusAssetImage(asset, () => setVisualClock(Date.now()));
      const hasAsset = Boolean(assetImg?.complete && assetImg.naturalWidth);
      let assetTopY: number | null = null;

      ctx.save();
      const foundation = iso(room.x + room.w / 2, room.y + room.h, camera.x, camera.y, camera.zoom);
      if (selectedNow || hoveredNow || pressedNow) {
        const glowColor = selectedNow ? "rgba(124,58,237,.22)" : pressedNow ? "rgba(14,165,233,.32)" : "rgba(14,165,233,.22)";
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.ellipse(foundation.x, foundation.y + 3 * camera.zoom, Math.max(30, (room.w + room.h) * 10.5 * camera.zoom), Math.max(10, (room.w + room.h) * 3.2 * camera.zoom), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = selectedNow ? "rgba(83,103,201,.18)" : hoveredNow ? "rgba(14,165,233,.18)" : "rgba(47,63,71,.11)";
      ctx.beginPath();
      ctx.ellipse(foundation.x, foundation.y + 4 * camera.zoom, Math.max(22, (room.w + room.h) * 8 * camera.zoom), Math.max(7, (room.w + room.h) * 2.2 * camera.zoom), 0, 0, Math.PI * 2);
      ctx.fill();
      if (hasAsset && assetImg) {
        const base = iso(room.x + room.w / 2, room.y + room.h, camera.x, camera.y, camera.zoom);
        const projectedWidth = (room.w + room.h) * (TW / 2) * camera.zoom;
        const drawW = Math.max(105, projectedWidth * asset.scale);
        const drawH = drawW * (assetImg.naturalHeight / assetImg.naturalWidth);
        const dx = base.x - drawW * asset.anchor.x;
        const dy = base.y - drawH * asset.anchor.y;
        assetTopY = dy + drawH * .12;
        ctx.shadowColor = selectedNow ? "rgba(124,58,237,.42)" : hoveredNow || pressedNow ? "rgba(14,165,233,.48)" : "rgba(30,41,59,.14)";
        ctx.shadowBlur = selectedNow ? 20 : hoveredNow || pressedNow ? 18 : 6; ctx.shadowOffsetY = pressedNow ? 2 : 5;
        ctx.filter = pressedNow ? "brightness(1.14) saturate(1.18)" : hoveredNow ? "brightness(1.08) saturate(1.16)" : "none";
        const reveal = buildFx?.id === room.id && buildFx.until > visualClock ? Math.max(.08, Math.min(1, 1 - (buildFx.until - visualClock) / 4200)) : 1;
        if (reveal < 1) {
          ctx.save(); ctx.globalAlpha = .25 + reveal * .75;
          ctx.beginPath(); ctx.rect(dx - 8, dy + drawH * (1 - reveal) - 8, drawW + 16, drawH * reveal + 16); ctx.clip();
          ctx.drawImage(assetImg, dx, dy, drawW, drawH); ctx.restore();
        } else ctx.drawImage(assetImg, dx, dy, drawW, drawH);
        ctx.shadowColor = "transparent"; ctx.filter = "none";
        if (selectedNow || hoveredNow || pressedNow) {
          ctx.strokeStyle = selectedNow ? C.violet : "#0ea5e9"; ctx.lineWidth = pressedNow ? 4 : selectedNow ? 3 : 2.5;
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath(); ctx.stroke();
          ctx.fillStyle = selectedNow ? "rgba(83,103,201,.10)" : "rgba(14,165,233,.11)"; ctx.fill();
        }
      } else {
        // Never flash a procedural block while authored art is loading. A quiet
        // footprint placeholder keeps placement legible without bringing back
        // the generic geometry that the finished campus art replaces.
        ctx.fillStyle = selectedNow ? "rgba(83,103,201,.12)" : hoveredNow ? "rgba(14,165,233,.14)" : "rgba(148,163,184,.10)";
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = selectedNow ? C.violet : hoveredNow ? "#0ea5e9" : "rgba(100,116,139,.28)"; ctx.lineWidth = selectedNow || hoveredNow ? 2.5 : 1; ctx.stroke();
        assetTopY = Math.min(t0.y, t1.y, t2.y, t3.y);

      }
      const roofY = assetTopY ?? (center.y - rawH);

      // Short cosmetic construction flourish for newly placed facilities.
      if (buildFx?.id === room.id && buildFx.until > visualClock) {
        const pulse = .35 + .25 * Math.sin(visualClock / 120);
        ctx.globalAlpha = .7;
        ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath(); ctx.moveTo(center.x - 54 + i * 14, roofY - 20); ctx.lineTo(center.x - 20 + i * 14, center.y + 18); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(245,158,11,${pulse})`; ctx.fillRect(center.x - 3, roofY - 24, 6, 6);
      }

      // Nameplate + live status, not decorative labels.
      const labelW = Math.min(194, Math.max(118, room.name.length * 6.4 + 46));
      roundedRect(ctx, center.x - labelW / 2, roofY - 54, labelW, 44, 10);
      ctx.fillStyle = selectedNow ? "rgba(255,255,255,.99)" : hoveredNow ? "rgba(240,249,255,.98)" : "rgba(255,255,255,.91)"; ctx.fill();
      ctx.strokeStyle = selectedNow ? C.violet : hoveredNow ? "#0ea5e9" : "rgba(100,116,139,.22)"; ctx.lineWidth = selectedNow || hoveredNow ? 1.8 : 1; ctx.stroke();
      ctx.textAlign = "center"; ctx.fillStyle = "#1f2937"; ctx.font = `800 ${Math.max(9, 11.5 * camera.zoom)}px system-ui`;
      ctx.fillText(`${facilityDefForRoom(room).icon} ${room.name}`, center.x - 5, roofY - 38);
      const statusColor = status.tone === "critical" || status.tone === "blocked" ? "#dc2626" : status.tone === "warn" || status.tone === "attention" ? "#b45309" : status.tone === "active" ? "#4f46e5" : status.tone === "idle" ? "#64748b" : "#15803d";
      ctx.font = `${Math.max(8, 9.5 * camera.zoom)}px system-ui`; ctx.fillStyle = statusColor;
      ctx.fillText(status.label, center.x - 5, roofY - 24);
      const progress = Math.max(.03, Math.min(1, status.progress));
      const barW = labelW - 20; roundedRect(ctx, center.x - barW / 2, roofY - 19, barW, 5, 3); ctx.fillStyle = "rgba(148,163,184,.24)"; ctx.fill();
      const barGradient = ctx.createLinearGradient(center.x - barW / 2, 0, center.x + barW / 2, 0); barGradient.addColorStop(0, statusColor); barGradient.addColorStop(1, status.tone === "active" ? "#22d3ee" : statusColor);
      roundedRect(ctx, center.x - barW / 2, roofY - 19, barW * progress, 5, 3); ctx.fillStyle = barGradient; ctx.fill();
      if (status.tone === "active") { const shimmer = (visualClock / 18) % Math.max(1, barW * progress); ctx.fillStyle = "rgba(255,255,255,.58)"; ctx.fillRect(center.x - barW / 2 + shimmer - 5, roofY - 19, 7, 5); }
      const ringX = center.x + labelW / 2 - 13, ringY = roofY - 37;
      ctx.beginPath(); ctx.arc(ringX, ringY, 8, 0, Math.PI * 2); ctx.strokeStyle = "rgba(148,163,184,.24)"; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(ringX, ringY, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.strokeStyle = statusColor; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke(); ctx.lineCap = "butt";
      if (status.tone === "blocked" || status.tone === "critical" || status.tone === "attention") {
        const pulse = 5 + Math.sin(visualClock / 180) * 2;
        ctx.beginPath(); ctx.arc(ringX, ringY, pulse, 0, Math.PI * 2); ctx.fillStyle = statusColor; ctx.fill();
        ctx.fillStyle = "white"; ctx.font = `900 ${Math.max(7, 8 * camera.zoom)}px system-ui`; ctx.fillText("!", ringX, ringY + 3);
      } else if (status.tone === "active") {
        const pulse = .45 + .35 * Math.sin(visualClock / 210);
        ctx.beginPath(); ctx.arc(ringX, ringY, 2.5 + pulse, 0, Math.PI * 2); ctx.fillStyle = `rgba(79,70,229,${pulse})`; ctx.fill();
      }
      if (selectedNow) {
        const markerY = roofY - 66 - Math.sin(visualClock / 180) * 3;
        ctx.fillStyle = C.violet;
        ctx.beginPath(); ctx.arc(center.x, markerY, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.font = "900 11px system-ui"; ctx.fillText("✓", center.x, markerY + 4);
      }
      ctx.restore();

      if (room.kind === "office") {
        room.assignedPersonnelIds.slice(0, 6).forEach((id, i) => {
          const p = world.player.personnel.find((person) => person.id === id);
          if (p) drawPerson(room, p, i);
        });
      }
    };

    const ordered = [...rooms].sort((a, b) => (a.x + a.y + a.w + a.h) - (b.x + b.y + b.w + b.h));
    ordered.forEach(drawBuilding);

    // Logistics movement. Activity comes from real inventory/manufacturing/sales state.
    let truckIndex = 0;
    for (const room of ordered) {
      if (room.kind === "factory") drawTruck(room, truckIndex++, ownBatches.length);
      if (room.kind === "outsourcing") drawTruck(room, truckIndex++, outsourceBatches.length);
      if (room.kind === "warehouse") drawTruck(room, truckIndex++, inventoryInbound > 0 || salesPulse > 0 ? 1 : 0);
    }

    if ((expansionRoom && expansionQuote && expansionSize) || movingRoom) {
      const previewRoom = movingRoom ?? expansionRoom!;
      const [w, h] = movingRoom ? [movingRoom.w, movingRoom.h] : expansionSize!;
      const candidate = { x: hover.x, y: hover.y, w, h };
      const coversPath = paths.some((p) => p.x >= hover.x && p.x < hover.x + w && p.y >= hover.y && p.y < hover.y + h);
      const differentParcel = !movingRoom || hover.x !== movingRoom.x || hover.y !== movingRoom.y;
      const valid = differentParcel && hover.x >= 0 && hover.y >= 0 && hover.x + w <= MAP && hover.y + h <= MAP && !rooms.some((r) => r.id !== previewRoom.id && overlaps(candidate, r)) && !coversPath && roomTouchesConnectedPath(world, candidate);
      for (let yy = hover.y; yy < hover.y + h; yy++) for (let xx = hover.x; xx < hover.x + w; xx++) if (xx >= 0 && yy >= 0 && xx < MAP && yy < MAP) drawDiamond(xx, yy, valid ? "#bbf7d0" : "#fecaca", valid ? "#16a34a" : "#dc2626", 0.76);
    } else if (tool === "path") {
      const draftTiles = pathDraft ? straightTiles(pathDraft.start, pathDraft.end) : [hover];
      const existing = new Set(paths.map((path) => `${path.x},${path.y}`));
      const virtualConnected = campusPathConnectedSet(world);
      let cashLeft = world.player.cash;
      for (const tile of draftTiles) {
        const key = `${tile.x},${tile.y}`;
        if (existing.has(key)) {
          // Existing path is part of the valid drag anchor, not an error state.
          drawDiamond(tile.x, tile.y, "#bfd4e6", "#557b9b", 0.94);
          virtualConnected.add(key);
          continue;
        }
        const inBounds = tile.x >= 0 && tile.y >= 0 && tile.x < CAMPUS_MAP_SIZE && tile.y < CAMPUS_MAP_SIZE;
        const occupied = rooms.some((r) => tile.x >= r.x && tile.x < r.x + r.w && tile.y >= r.y && tile.y < r.y + r.h);
        const connected = adjacentTiles(tile.x, tile.y).some((n) => virtualConnected.has(`${n.x},${n.y}`));
        const valid = inBounds && !occupied && connected && cashLeft >= CAMPUS_PATH_COST;
        drawDiamond(tile.x, tile.y, valid ? "#b9e7d2" : "#fecaca", valid ? "#0f8a62" : "#dc2626", 0.88);
        if (valid) { virtualConnected.add(key); cashLeft -= CAMPUS_PATH_COST; }
      }
    } else if (tool !== "select" && tool !== "navigate") {
      const [w, h] = FACILITY_DEFS[tool].size;
      const candidate = { x: hover.x, y: hover.y, w, h };
      const coversPath = paths.some((p) => p.x >= hover.x && p.x < hover.x + w && p.y >= hover.y && p.y < hover.y + h);
      const valid = hover.x >= 0 && hover.y >= 0 && hover.x + w <= MAP && hover.y + h <= MAP && !rooms.some((r) => overlaps(candidate, r)) && !coversPath && roomTouchesConnectedPath(world, candidate);
      for (let yy = hover.y; yy < hover.y + h; yy++) for (let xx = hover.x; xx < hover.x + w; xx++) if (xx >= 0 && yy >= 0 && xx < MAP && yy < MAP) drawDiamond(xx, yy, valid ? "#bbf7d0" : "#fecaca", valid ? "#16a34a" : "#dc2626", 0.73);
      drawFacilityPreview(tool, hover.x, hover.y, w, h, valid);
    }
  }, [rooms, paths, selectedId, hoveredRoomId, pressedRoomId, hover, tool, camera, compact, visualClock, buildFx, pathDraft, world.tick, world.live, world.player.skus, world.player.personnel, companyBrand.color, expansionTargetId, moveTargetId]);

  function straightTiles(start: { x: number; y: number }, end: { x: number; y: number }) {
    const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
    const finish = horizontal ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
    const length = Math.max(Math.abs(finish.x - start.x), Math.abs(finish.y - start.y));
    return Array.from({ length: length + 1 }, (_, index) => ({
      x: start.x + (finish.x === start.x ? 0 : Math.sign(finish.x - start.x) * index),
      y: start.y + (finish.y === start.y ? 0 : Math.sign(finish.y - start.y) * index),
    }));
  }

  const pickRoom = (tileX: number, tileY: number) => [...rooms].reverse().find((r) => tileX >= r.x && tileX < r.x + r.w && tileY >= r.y && tileY < r.y + r.h);

  const pointInPolygon = (px: number, py: number, pts: { x: number; y: number }[]) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      const intersects = ((a.y > py) !== (b.y > py)) && (px < (b.x - a.x) * (py - a.y) / ((b.y - a.y) || .0001) + a.x);
      if (intersects) inside = !inside;
    }
    return inside;
  };

  // Prefer the parcel itself, then accept the visible body of the building. This makes
  // authored sprites feel directly clickable without letting their transparent margins
  // steal the whole map from buildings in front of them.
  const pickRoomAtScreen = (sx: number, sy: number) => {
    const ordered = [...rooms].sort((a,b) => (b.x+b.y+b.w+b.h) - (a.x+a.y+a.w+a.h));
    const foundationHit = ordered.find((r) => {
      const pts = [iso(r.x,r.y,camera.x,camera.y,camera.zoom), iso(r.x+r.w,r.y,camera.x,camera.y,camera.zoom), iso(r.x+r.w,r.y+r.h,camera.x,camera.y,camera.zoom), iso(r.x,r.y+r.h,camera.x,camera.y,camera.zoom)];
      return pointInPolygon(sx, sy, pts);
    });
    if (foundationHit) return foundationHit;
    return ordered.find((room) => {
      const asset = roomCampusAsset(world, room);
      const image = campusAssetImage(asset);
      const base = iso(room.x + room.w / 2, room.y + room.h, camera.x, camera.y, camera.zoom);
      const projectedWidth = (room.w + room.h) * (TW / 2) * camera.zoom;
      const drawW = Math.max(105, projectedWidth * asset.scale);
      const drawH = image?.complete && image.naturalWidth ? drawW * image.naturalHeight / image.naturalWidth : Math.max(70, roomHeight(room) * camera.zoom * 2.2);
      const left = base.x - drawW * asset.anchor.x + drawW * .12;
      const top = base.y - drawH * asset.anchor.y + drawH * .08;
      return sx >= left && sx <= left + drawW * .76 && sy >= top && sy <= Math.min(base.y + 4, top + drawH * .92);
    });
  };

  const pointerTile = (clientX: number, clientY: number, el: HTMLCanvasElement) => {
    const rect = el.getBoundingClientRect();
    return screenToTile(clientX - rect.left, clientY - rect.top, camera.x, camera.y, camera.zoom);
  };

  const place = (kind: BuildTool, x: number, y: number) => {
    if (kind === "path") {
      const existing = new Set(paths.map((path) => `${path.x},${path.y}`));
      const result = buildPathLine(straightTiles(pathStart.current ?? { x, y }, { x, y }).filter((tile) => !existing.has(`${tile.x},${tile.y}`)));
      setMessage(result.ok ? `Path extended · ${fmtMoney(CAMPUS_PATH_COST)}.` : result.reason ?? "Path cannot be built there.");
      return;
    }
    const meta = FACILITY_DEFS[kind];
    const [w, h] = meta.size;
    const candidate = { x, y, w, h };
    const coversPath = paths.some((p) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h);
    if (x < 0 || y < 0 || x + w > MAP || y + h > MAP || rooms.some((r) => overlaps(candidate, r)) || coversPath) {
      setMessage(coversPath ? "Buildings sit beside paths, not on top of them." : "That facility does not fit there."); return;
    }
    if (!roomTouchesConnectedPath(world, candidate)) { setMessage("Facilities must touch a path connected to the campus entrance."); return; }
    const gate = facilityBuildRequirement(world, kind);
    if (gate) { setMessage(gate); return; }
    if (world.player.cash < meta.buildCost) { setMessage(`Not enough cash to build ${meta.label}.`); return; }
    const firstOffice = kind === "office" && !rooms.some((r) => r.kind === "office");
    const n = rooms.filter((r) => roomFacilityType(r) === kind).length + 1;
    const room: Room = {
      id: firstOffice ? "founder-office" : `${kind}-${Date.now()}`, kind: meta.kind, facilityType: firstOffice ? "office" : kind, x, y, w, h,
      name: firstOffice ? "Founder Office" : (meta.repeatable ? `${meta.label} ${n}` : meta.label), team: firstOffice ? "unassigned" : meta.team,
      productKey: null, skuId: null, assignedPersonnelIds: [], buildCost: meta.buildCost, monthlyCost: meta.monthlyCost,
      capacity: firstOffice ? 4 : meta.capacity, upgradeLevel: 1,
      manufacturingFamilies: meta.kind === "factory" ? defaultFactoryFamiliesForIndustry(world.industryId) : undefined,
      storageProfiles: kind === "cold_storage" ? ["standard","climate","refrigerated","frozen"] : meta.kind === "warehouse" ? ["standard"] : undefined,
    };
    if (!buildRoom(room)) { setMessage(`Could not build ${meta.label}. Check unlocks, cash and path access.`); return; }
    setBuildFx({ id: room.id, until: Date.now() + 4200 });
    setSelectedId(room.id); setTool("select");
    setMessage(firstOffice ? "Founder Office I built. One of four positions belongs to you; three staff desks are open." : `${meta.label} complete. Its gameplay effect is now active.`);
  };

  const placeExpansion = (x: number, y: number) => {
    if (!expansionRoom || !expansionQuote || !expansionSize) { setExpansionTargetId(null); return; }
    const [w, h] = expansionSize;
    const candidate = { x, y, w, h };
    const coversPath = paths.some((p) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h);
    const overlapsOther = rooms.some((r) => r.id !== expansionRoom.id && overlaps(candidate, r));
    if (x < 0 || y < 0 || x + w > MAP || y + h > MAP || overlapsOther || coversPath) {
      setMessage(coversPath ? "The expanded building cannot cover an existing path." : overlapsOther ? "The expanded footprint overlaps another facility." : "That expanded footprint does not fit there."); return;
    }
    if (!roomTouchesConnectedPath(world, candidate)) { setMessage("The expanded facility must touch the connected campus path network."); return; }
    const result = upgradeRoom(expansionRoom.id, candidate);
    if (!result.ok) { setMessage(result.reason ?? "Expansion failed."); return; }
    setBuildFx({ id: expansionRoom.id, until: Date.now() + 4200 });
    setExpansionTargetId(null); setSelectedId(expansionRoom.id); setTool("select");
    setMessage(`${expansionRoom.name} expanded to level ${expansionQuote.nextLevel} · ${w}×${h} footprint.`);
  };

  const placeMove = (x: number, y: number) => {
    if (!movingRoom) { setMoveTargetId(null); return; }
    const result = moveRoom(movingRoom.id, { x, y, w: movingRoom.w, h: movingRoom.h });
    if (!result.ok) { setMessage(result.reason ?? "Move failed."); return; }
    setBuildFx({ id: movingRoom.id, until: Date.now() + 2600 });
    setMoveTargetId(null); setSelectedId(movingRoom.id); setTool("select");
    setMessage(`${movingRoom.name} moved. Staff, upgrades and operating settings were preserved.`);
  };

  const updateSelected = (patch: Partial<Room>) => {
    if (!selectedId) return;
    setRooms((rs) => rs.map((r) => r.id === selectedId ? { ...r, ...patch } : r));
  };

  const openSelected = (room: Room) => {
    const target = roomNavigation(room); onNavigate(target.top, target.sub);
  };

  const blockers = [
    !productRooms.length && "No product management team has a category mandate.",
    !hasFactory && !hasSourcing && "No factory or sourcing office can manufacture products.",
    !hasWarehouse && "No warehouse exists; scaled inventory will be constrained.",
    !world.player.contracts.length && !hasSourcing && "No route to market or distribution-contract team exists.",
    !rooms.some((r) => r.kind === "office" && r.team === "finance") && "No finance team is monitoring unit economics and cash.",
  ].filter(Boolean) as string[];
  const attentionRooms = rooms.map((room) => ({ room, status: roomStatus(room) })).filter(({ status }) => ["critical", "blocked", "attention", "warn"].includes(status.tone));

  const selectedStatus = selected ? roomStatus(selected) : null;
  const selectedType = selected ? roomFacilityType(selected) : null;
  const selectedNav = selected ? roomNavigation(selected) : null;
  const selectedUpgrade = selected ? facilityUpgradeQuote(selected) : null;
  const selectedUpgradeGate = selected && selectedUpgrade ? facilityUpgradeRequirement(world, selected, selectedUpgrade.nextLevel) : null;
  const selectedNextSize = selected && selectedUpgrade ? facilityFootprintForLevel(roomFacilityType(selected), selectedUpgrade.nextLevel, selected) : null;
  const selectedDemolition = selected ? canDemolishFacility(world, selected) : null;
  const warehouseProducts = world.player.skus.filter((s) => s.inventory + (s.mfgBatchSize ?? 0) > 0).sort((a, b) => (b.inventory + (b.mfgBatchSize ?? 0)) - (a.inventory + (a.mfgBatchSize ?? 0))).slice(0, 5);
  const liveWorkItems = [
    ...world.player.skus.filter((sku) => sku.status === "designing").map((sku) => { const tier = sku.projectTier ?? "A"; const total = PRODUCT_PROJECT_TIERS[tier].baseDays; return { id: `design_${sku.id}`, icon: "✦", label: sku.name, detail: `${Math.ceil(sku.designDaysLeft)}d · design`, progress: Math.max(.03, 1 - sku.designDaysLeft / total), color: "#8b5cf6", top: "ops", sub: "products" }; }),
    ...world.player.skus.filter((sku) => (sku.mfgDaysLeft ?? 0) > 0).map((sku) => { const total = productionLeadDays(world, sku, sku.mfgBatchSize || 1); return { id: `batch_${sku.id}`, icon: "⚙", label: sku.name, detail: `${Math.ceil(sku.mfgDaysLeft)}d · production`, progress: Math.max(.03, 1 - sku.mfgDaysLeft / Math.max(1, total)), color: "#06b6d4", top: "ops", sub: "products" }; }),
    ...(world.player.research?.active ? [{ id: "research", icon: "⌬", label: researchDef(world.player.research.active.nodeId).title, detail: "Research program", progress: world.player.research.active.progress / world.player.research.active.requiredPoints, color: "#ec4899", top: "mgmt", sub: "research" }] : []),
    ...(world.player.talentSearch ? [{ id: "talent", icon: "◎", label: "Talent search", detail: `${Math.ceil(world.player.talentSearch.daysLeft)}d remaining`, progress: 1 - world.player.talentSearch.daysLeft / world.player.talentSearch.totalDays, color: "#f59e0b", top: "mgmt", sub: "personnel" }] : []),
    ...(world.player.trainingPrograms ?? []).map((program) => ({ id: `training_${program.id}`, icon: "↟", label: world.player.personnel.find((person) => person.id === program.personnelId)?.name ?? "Employee training", detail: `${Math.ceil(program.daysLeft)}d · training`, progress: 1 - program.daysLeft / program.totalDays, color: "#10b981", top: "mgmt", sub: "personnel" })),
    ...world.activeCampaigns.map((campaign) => ({ id: `campaign_${campaign.id}`, icon: "◈", label: campaign.name, detail: `${Math.ceil(campaign.daysRemaining)}d · campaign`, progress: 1 - campaign.daysRemaining / campaign.totalDays, color: "#f43f5e", top: "mkt", sub: "campaigns" })),
  ].slice(0, 4);

  const hoveredRoom = hoveredRoomId ? rooms.find((room) => room.id === hoveredRoomId) ?? null : null;
  const hoveredStatus = hoveredRoom ? roomStatus(hoveredRoom) : null;
  const hoveredCapacity = hoveredRoom ? (() => {
    const facilityType = roomFacilityType(hoveredRoom);
    if (facilityType === "training_center") return `${(world.player.trainingPrograms ?? []).filter((program) => program.facilityRoomId === hoveredRoom.id).length}/${hoveredRoom.capacity} training slots`;
    if (hoveredRoom.kind === "office") return `${hoveredRoom.assignedPersonnelIds.length + (hoveredRoom.id === "founder-office" ? 1 : 0)}/${hoveredRoom.capacity} people`;
    if (hoveredRoom.kind === "warehouse") return `${fmtNum(hoveredRoom.capacity)} storage`;
    if (hoveredRoom.kind === "factory") return `${fmtNum(hoveredRoom.capacity)}/mo production`;
    return `${fmtNum(hoveredRoom.capacity)}/mo capacity`;
  })() : "";

  const placementFeedback = (() => {
    if (expansionRoom || movingRoom || tool === "select" || tool === "navigate") return null;
    if (tool === "path") {
      const tileCount = pathDraft ? straightTiles(pathDraft.start, pathDraft.end).filter((tile) => !paths.some((path) => path.x === tile.x && path.y === tile.y)).length : 1;
      return {
        valid: true,
        title: pathDraft ? `${tileCount} path tile${tileCount === 1 ? "" : "s"}` : "Draw a campus path",
        detail: pathDraft ? `${fmtMoney(tileCount * CAMPUS_PATH_COST)} · release to build` : "Drag from the entrance or any connected path",
      };
    }
    const meta = FACILITY_DEFS[tool];
    const [w, h] = meta.size;
    const candidate = { x: hover.x, y: hover.y, w, h };
    const inBounds = hover.x >= 0 && hover.y >= 0 && hover.x + w <= MAP && hover.y + h <= MAP;
    const coversPath = paths.some((path) => path.x >= hover.x && path.x < hover.x + w && path.y >= hover.y && path.y < hover.y + h);
    const collision = rooms.some((room) => overlaps(candidate, room));
    const connected = inBounds && roomTouchesConnectedPath(world, candidate);
    const valid = inBounds && !coversPath && !collision && connected;
    const reason = !inBounds ? "Move inside the campus boundary" : coversPath ? "Place beside the path—not on it" : collision ? "Another building occupies this parcel" : !connected ? "The facility must touch a connected path" : `Click to build · ${fmtMoney(meta.buildCost)}`;
    return { valid, title: `${meta.icon} Place ${meta.label} · ${w}×${h}`, detail: reason };
  })();

  const resetCamera = () => {
    const width = wrapRef.current?.clientWidth ?? 900;
    const height = wrapRef.current?.clientHeight ?? Math.max(320, window.innerHeight - 92);
    setCamera(fittedCampusCamera(width, height, rooms, compact));
  };

  return <div className={`campus-map-view${compact ? " is-compact" : ""}`} style={{ position: "relative", height: "100%", minHeight: compact ? 0 : 520, overflow: "hidden" }}>
    <style>{`
      .campus-map-view{--campus-panel-radius:18px;color:${C.ink}}
      .campus-map-view button,.campus-map-view input,.campus-map-view select{font-family:inherit}
      .campus-map-view button{min-height:44px;transition:transform .15s ease,box-shadow .15s ease,filter .15s ease}
      .campus-map-view button:not(:disabled):hover{filter:saturate(1.08);box-shadow:0 8px 18px rgba(17,42,67,.16)!important}
      .campus-map-view button:not(:disabled):active{transform:translateY(1px) scale(.985)}
      .campus-toolbar{position:absolute;left:14px;top:14px;display:flex;gap:6px;flex-wrap:wrap;max-width:calc(100% - 160px);z-index:12}
      .campus-toolbar>*,.campus-toolbar>*>button{min-width:0}
      .campus-build-wrap{position:relative}
      .campus-build-menu,.campus-pulse-panel,.campus-facility-panel{scrollbar-color:#9db5c8 transparent;scrollbar-width:thin}
      .campus-build-menu{position:absolute;left:0;top:48px;width:372px;max-height:72vh;overflow-y:auto;background:linear-gradient(180deg,#fff,#f8fbff);border:1px solid ${C.line};border-radius:16px;padding:9px;box-shadow:0 22px 54px rgba(7,34,63,.27);z-index:24;animation:campusPanelIn .2s cubic-bezier(.2,.9,.25,1)}
      .campus-build-item{transition:background .15s ease,transform .15s ease!important}
      .campus-build-item:not(:disabled):hover{background:#eef7ff!important;transform:translateX(2px)}
      .campus-feedback{position:absolute;z-index:14;left:50%;transform:translateX(-50%);top:66px;width:min(490px,calc(100% - 330px));min-width:320px;display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:13px;box-shadow:0 12px 30px rgba(15,23,42,.2);pointer-events:none;animation:campusPanelIn .18s ease-out}
      .campus-feedback{animation-name:campusFeedbackIn}
      .campus-placement-banner{position:absolute;left:14px;right:14px;top:66px;z-index:16;display:flex;justify-content:space-between;align-items:center;gap:12px;background:rgba(255,255,255,.98);border-radius:13px;padding:9px 12px;box-shadow:0 10px 28px rgba(17,42,67,.2);color:${C.ink};font-size:12.5px;line-height:1.4;animation:campusPanelIn .2s ease-out}
      .campus-pulse-panel{position:absolute;z-index:20;right:14px;top:66px;width:430px;max-height:calc(100% - 90px);overflow-y:auto;background:linear-gradient(180deg,rgba(255,255,255,.99),rgba(245,250,255,.99));border:1px solid ${C.line};border-radius:16px;padding:14px;box-shadow:0 22px 54px rgba(7,34,63,.28);animation:campusPanelIn .22s cubic-bezier(.2,.9,.25,1)}
      .campus-facility-panel{position:absolute;right:18px;top:76px;width:min(410px,calc(100vw - 36px));max-height:calc(100vh - 166px);overflow-y:auto;background:linear-gradient(180deg,rgba(255,255,255,.995),rgba(247,250,255,.99));border:1px solid ${C.violet};border-radius:var(--campus-panel-radius);padding:16px;box-shadow:0 22px 54px rgba(7,34,63,.3);z-index:18;animation:campusSheetIn .25s cubic-bezier(.2,.9,.25,1)}
      .campus-facility-panel [style*="font-size: 8"],.campus-facility-panel [style*="font-size: 9"],.campus-facility-panel [style*="font-size: 10"]{font-size:12px!important;line-height:1.45!important}
      .campus-facility-panel [style*="font-size: 11"]{font-size:12.5px!important;line-height:1.45!important}
      .campus-facility-panel input:not([type="checkbox"]),.campus-facility-panel select{min-height:44px;font-size:14px!important}
      .campus-facility-panel input[type="checkbox"]{width:22px;height:22px;flex:0 0 auto;accent-color:${C.violet}}
      .campus-pulse-panel [style*="font-size: 8"],.campus-pulse-panel [style*="font-size: 9"],.campus-pulse-panel [style*="font-size: 10"]{font-size:12px!important;line-height:1.4!important}
      .campus-build-menu [style*="font-size: 8"],.campus-build-menu [style*="font-size: 9"],.campus-build-menu [style*="font-size: 10"]{font-size:11.5px!important;line-height:1.4!important}
      .campus-build-menu [style*="font-size: 11"]{font-size:12.5px!important;line-height:1.4!important}
      .campus-status-message{position:absolute;left:14px;bottom:14px;max-width:520px;background:rgba(255,255,255,.94);backdrop-filter:blur(9px);border:1px solid ${C.line};border-radius:11px;padding:9px 12px;color:${C.dim};font-size:12px;line-height:1.4;box-shadow:0 8px 22px rgba(17,42,67,.12)}
      .campus-hover-card [style*="font-size: 9"],.campus-hover-card [style*="font-size: 10"]{font-size:12px!important;line-height:1.35!important}
      @keyframes campusPanelIn{from{opacity:0;transform:translateY(-7px) scale(.985)}to{opacity:1;transform:none}}
      @keyframes campusFeedbackIn{from{opacity:0;transform:translate(-50%,-7px) scale(.985)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
      @keyframes campusSheetIn{from{opacity:0;transform:translateX(18px) scale(.985)}to{opacity:1;transform:none}}
      @media(max-width:979px){
        .campus-toolbar{left:7px;right:7px;top:7px;max-width:none;display:grid;grid-template-columns:minmax(52px,1fr) minmax(62px,1.12fr) minmax(72px,1.25fr) 44px 44px 44px;gap:4px}
        .campus-toolbar button{width:100%;min-height:44px!important;padding:8px 6px!important;font-size:12px!important;white-space:nowrap}
        .campus-build-menu{position:absolute;left:0;right:auto;top:48px;width:min(372px,calc(100vw - 22px));max-height:calc(100dvh - 225px);padding:9px;border-radius:16px}
        .campus-feedback{top:60px;width:calc(100% - 14px);min-width:0;padding:9px 11px}
        .campus-placement-banner{left:7px;right:7px;top:60px;display:grid;grid-template-columns:minmax(0,1fr) auto;font-size:12px;padding:9px 10px}
        .campus-pulse-panel{left:7px;right:7px;top:60px;width:auto;max-height:calc(100% - 68px);padding:13px;border-radius:16px}
        .campus-facility-panel{left:6px;right:6px;bottom:6px;top:auto;width:auto;max-height:min(62%,560px);padding:14px;padding-bottom:calc(14px + env(safe-area-inset-bottom));border-radius:20px 20px 13px 13px;animation:campusSheetUp .25s cubic-bezier(.2,.9,.25,1)}
        .campus-status-message{left:7px;right:7px;bottom:7px;max-width:none;font-size:12px;padding:8px 10px}
        .campus-facility-panel input:not([type="checkbox"]),.campus-facility-panel select{font-size:16px!important}
      }
      @media(max-width:370px){
        .campus-toolbar{grid-template-columns:minmax(48px,1fr) minmax(58px,1.12fr) minmax(66px,1.2fr) 44px 44px}
        .campus-center-btn{display:none}
        .campus-facility-panel{max-height:66%}
      }
      @media(max-width:500px){.campus-build-menu{left:calc(-100% + 4px)}}
      @media(max-width:780px){
        .campus-facility-panel{bottom:calc(62px + env(safe-area-inset-bottom))}
        .campus-pulse-panel{bottom:calc(62px + env(safe-area-inset-bottom));max-height:none}
        .campus-status-message{bottom:calc(62px + env(safe-area-inset-bottom))}
      }
      @media(max-width:390px){
        .campus-facility-panel{bottom:6px}
        .campus-pulse-panel{bottom:0}
        .campus-status-message{bottom:7px}
      }
      @media(max-height:650px) and (max-width:979px){
        .campus-build-menu{max-height:calc(100dvh - 225px)}
        .campus-facility-panel{max-height:72%}
        .campus-pulse-panel{max-height:calc(100% - 64px)}
      }
      @keyframes campusSheetUp{from{opacity:0;transform:translateY(24px) scale(.99)}to{opacity:1;transform:none}}
      @media(prefers-reduced-motion:reduce){.campus-map-view *{animation-duration:.01ms!important;transition-duration:.01ms!important}}
    `}</style>
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, background: "#e5ece7", overflow: "hidden" }}>
      <canvas ref={canvasRef}
        role="img"
        aria-label="Interactive company campus. Select a facility to inspect it, or use the build controls to place paths and buildings."
        onPointerDown={(e) => {
          const tile = pointerTile(e.clientX, e.clientY, e.currentTarget);
          const rect = e.currentTarget.getBoundingClientRect();
          const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
          drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY, originX: e.clientX, originY: e.clientY, threshold: e.pointerType === "touch" ? 14 : 7 };
          if (!expansionTargetId && !moveTargetId && (tool === "select" || tool === "navigate")) setPressedRoomId(pickRoomAtScreen(sx, sy)?.id ?? null);
          pathStart.current = !expansionTargetId && !moveTargetId && tool === "path" ? tile : null;
          if (!expansionTargetId && !moveTargetId && tool === "path") setPathDraft({ start: tile, end: tile });
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
          const t = pointerTile(e.clientX, e.clientY, e.currentTarget); setHover(t); setHoverPoint({ x: sx, y: sy });
          if (e.pointerType !== "touch" && (tool === "select" || tool === "navigate") && !expansionTargetId && !moveTargetId) setHoveredRoomId(pickRoomAtScreen(sx, sy)?.id ?? null);
          else setHoveredRoomId(null);
          if (!drag.current.active) return;
          const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
          if (tool === "path" && pathStart.current) { const tile = pointerTile(e.clientX, e.clientY, e.currentTarget); setPathDraft({ start: pathStart.current, end: tile }); }
          const totalTravel = Math.abs(e.clientX - drag.current.originX) + Math.abs(e.clientY - drag.current.originY);
          if (totalTravel > drag.current.threshold) { drag.current.moved = true; setPressedRoomId(null); setHoveredRoomId(null); }
          if (!expansionTargetId && !moveTargetId && (tool === "select" || tool === "navigate") && drag.current.moved) { setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy })); drag.current.x = e.clientX; drag.current.y = e.clientY; }
        }}
        onPointerUp={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
          if (expansionRoom && expansionQuote && expansionSize && !drag.current.moved) {
            const t = pointerTile(e.clientX, e.clientY, e.currentTarget); placeExpansion(t.x, t.y);
          } else if (movingRoom && !drag.current.moved) {
            const t = pointerTile(e.clientX, e.clientY, e.currentTarget); placeMove(t.x, t.y);
          } else if (tool === "path") {
            const start = pathStart.current ?? pointerTile(e.clientX, e.clientY, e.currentTarget);
            const end = pointerTile(e.clientX, e.clientY, e.currentTarget);
            const existing = new Set(paths.map((path) => `${path.x},${path.y}`));
            const result = buildPathLine(straightTiles(start, end).filter((tile) => !existing.has(`${tile.x},${tile.y}`)));
            setMessage(result.ok ? `${result.built} path tile${result.built === 1 ? "" : "s"} built · ${fmtMoney(result.built * CAMPUS_PATH_COST)}.` : result.reason ?? "Path cannot be built there.");
            setPathDraft(null); pathStart.current = null;
          } else if (!drag.current.moved) {
            if (tool === "select" || tool === "navigate") {
              const r = pickRoomAtScreen(sx, sy); setSelectedId(r?.id ?? null); setPulseOpen(false); setBuildMenuOpen(false);
              setMessage(r ? `${r.name} selected.` : "Empty parcel. Use Build to extend paths or place a connected facility.");
            } else { const t = pointerTile(e.clientX, e.clientY, e.currentTarget); place(tool, t.x, t.y); }
          }
          drag.current.active = false;
          setPressedRoomId(null);
          if (e.pointerType === "touch") setHoveredRoomId(null);
        }}
        onPointerCancel={() => { drag.current.active = false; pathStart.current = null; setPathDraft(null); setPressedRoomId(null); setHoveredRoomId(null); }}
        onPointerLeave={() => { if (!drag.current.active) { setHoveredRoomId(null); setPressedRoomId(null); } }}
        style={{ display: "block", cursor: tool === "select" || tool === "navigate" ? hoveredRoomId ? "pointer" : drag.current.active ? "grabbing" : "grab" : "crosshair", touchAction: "none" }} />

      {hoveredRoom && hoveredStatus && !compact && !drag.current.active && <div className="campus-hover-card" style={{
        position: "absolute",
        left: Math.max(12, Math.min(hoverPoint.x + 18, (wrapRef.current?.clientWidth ?? 980) - 286)),
        top: Math.max(72, Math.min(hoverPoint.y + 16, (wrapRef.current?.clientHeight ?? 620) - 154)),
        width: 258, zIndex: 7, pointerEvents: "none", color: "white",
        background: "linear-gradient(145deg,rgba(17,42,67,.97),rgba(30,58,88,.96))",
        border: "1px solid rgba(255,255,255,.24)", borderRadius: 13, padding: "11px 12px",
        boxShadow: "0 14px 34px rgba(15,23,42,.28)", backdropFilter: "blur(8px)",
      }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, background: "rgba(255,255,255,.13)", fontSize: 20 }}>{facilityDefForRoom(hoveredRoom).icon}</span>
          <div style={{ minWidth: 0 }}><b style={{ display: "block", fontSize: 13.5, lineHeight: 1.15 }}>{hoveredRoom.name}</b><span style={{ display: "block", marginTop: 2, color: "rgba(255,255,255,.65)", fontSize: 10.5 }}>{TEAM_LABEL[hoveredRoom.team]}</span></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 6, marginTop: 9 }}>
          <div style={{ borderRadius: 8, padding: "7px 8px", background: "rgba(255,255,255,.09)" }}><span style={{ display: "block", color: "rgba(255,255,255,.58)", fontSize: 9, fontWeight: 800, letterSpacing: .45 }}>ACTIVITY</span><b style={{ display: "block", marginTop: 2, fontSize: 10.5, color: hoveredStatus.tone === "blocked" || hoveredStatus.tone === "critical" ? "#fca5a5" : hoveredStatus.tone === "warn" || hoveredStatus.tone === "attention" ? "#fcd34d" : "#a7f3d0" }}>{hoveredStatus.label}</b></div>
          <div style={{ borderRadius: 8, padding: "7px 8px", background: "rgba(255,255,255,.09)" }}><span style={{ display: "block", color: "rgba(255,255,255,.58)", fontSize: 9, fontWeight: 800, letterSpacing: .45 }}>CAPACITY</span><b style={{ display: "block", marginTop: 2, fontSize: 10.5 }}>{hoveredCapacity}</b></div>
        </div>
        <div style={{ marginTop: 8, color: "#bae6fd", fontSize: 10.5, fontWeight: 800 }}>Click to inspect and manage →</div>
      </div>}

      {placementFeedback && <div className="campus-feedback" role="status" aria-live="polite" style={{ color: placementFeedback.valid ? "#065f46" : "#991b1b", background: placementFeedback.valid ? "rgba(236,253,245,.97)" : "rgba(254,242,242,.97)", border: `2px solid ${placementFeedback.valid ? "#34d399" : "#f87171"}` }}>
        <span style={{ width: 30, height: 30, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 999, color: "white", background: placementFeedback.valid ? "#059669" : "#dc2626", fontWeight: 1000, fontSize: 15 }}>{placementFeedback.valid ? "✓" : "!"}</span>
        <div style={{ minWidth: 0 }}><b style={{ display: "block", fontSize: 13 }}>{placementFeedback.title}</b><span style={{ display: "block", marginTop: 2, fontSize: 12, lineHeight: 1.35 }}>{placementFeedback.detail}</span></div>
      </div>}

      <div className="campus-toolbar" role="toolbar" aria-label="Campus controls">
        <button aria-pressed={tool === "select"} style={{ ...ctrlBtn, background: tool === "select" ? C.violet : "rgba(255,255,255,.94)", color: tool === "select" ? "white" : C.dim, boxShadow: "0 4px 14px rgba(30,41,59,.12)" }} onClick={() => { setExpansionTargetId(null); setMoveTargetId(null); setPulseOpen(false); setBuildMenuOpen(false); setSelectedId(null); setTool("select"); setMessage("Click a building footprint to inspect it. Drag empty ground to move the campus."); }}>↖ {compact ? "Map" : "Campus"}</button>
        <BuildMenu compact={compact} open={buildMenuOpen} onOpenChange={(open) => { setBuildMenuOpen(open); if (open) { setPulseOpen(false); setSelectedId(null); setExpansionTargetId(null); setMoveTargetId(null); } }} current={tool} world={world} cash={world.player.cash} hasOffice={rooms.some((r) => r.kind === "office")} choose={(kind) => { setExpansionTargetId(null); setMoveTargetId(null); setPulseOpen(false); setBuildMenuOpen(false); setTool(kind); setSelectedId(null); setMessage(kind === "path" ? "Path mode: drag from any connected path tile. Blue = existing, green = new, red = blocked." : `Build mode: place ${!rooms.some((r) => r.kind === "office") && kind === "office" ? "your compact 2×2 Founder Office I" : FACILITY_DEFS[kind].label.toLowerCase()} beside the connected path.`); }} />
        <button aria-expanded={pulseOpen} aria-controls="campus-pulse-panel" style={{ ...ctrlBtn, background: pulseOpen ? C.navy : "rgba(255,255,255,.94)", color: pulseOpen ? "white" : attentionRooms.length ? C.red : C.dim, borderColor: attentionRooms.length ? "#fca5a5" : C.line }} onClick={() => { setPulseOpen((value) => !value); setBuildMenuOpen(false); setExpansionTargetId(null); setMoveTargetId(null); setSelectedId(null); }}>◉ Pulse{attentionRooms.length ? ` · ${attentionRooms.length}` : ""}</button>
        <button aria-label="Zoom out" title="Zoom out" style={{ ...ctrlBtn, background: "rgba(255,255,255,.94)" }} onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(.38, c.zoom - .08) }))}>−</button>
        <button className="campus-center-btn" aria-label="Center campus" title="Center campus" style={{ ...ctrlBtn, background: "rgba(255,255,255,.94)" }} onClick={resetCamera}>{compact ? "⌖" : "Center"}</button>
        <button aria-label="Zoom in" title="Zoom in" style={{ ...ctrlBtn, background: "rgba(255,255,255,.94)" }} onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(1.15, c.zoom + .08) }))}>＋</button>
      </div>
      {expansionRoom && expansionSize && <div className="campus-placement-banner" role="status" style={{ border: `2px solid ${C.violet}` }}><span><b>Expansion placement:</b> choose a {expansionSize[0]}×{expansionSize[1]} footprint for {expansionRoom.name}. Green fits; red is blocked.</span><button style={ctrlBtn} onClick={() => { setExpansionTargetId(null); setSelectedId(expansionRoom.id); setMessage("Expansion cancelled."); }}>Cancel</button></div>}
      {movingRoom && <div className="campus-placement-banner" role="status" style={{ border: `2px solid ${C.cyan}` }}><span><b>Move facility:</b> choose a connected {movingRoom.w}×{movingRoom.h} parcel for {movingRoom.name}. Cost {fmtMoney(facilityMoveCost(movingRoom))}; everything inside is preserved.</span><button style={ctrlBtn} onClick={() => { setMoveTargetId(null); setSelectedId(movingRoom.id); setMessage("Move cancelled."); }}>Cancel</button></div>}
      {pulseOpen && !expansionRoom && !movingRoom && <div id="campus-pulse-panel" className="campus-pulse-panel" role="dialog" aria-label="Campus operating pulse">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}><div><div style={{ color: C.violet, fontSize: 8, fontWeight: 900, letterSpacing: .7 }}>LIVE OPERATING VIEW</div><b style={{ display: "block", fontSize: 15, marginTop: 2 }}>Campus pulse</b><div style={{ color: C.faint, fontSize: 9.5, marginTop: 2 }}>The company’s physical state at a glance.</div></div><button aria-label="Close campus pulse" style={ctrlBtn} onClick={() => setPulseOpen(false)}>✕</button></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6, marginTop: 10 }}><CampusKpi icon="👥" label="Office seats" value={`${staffedSeats}/${totalSeats}`} detail={totalSeats ? `${Math.round(staffedSeats / totalSeats * 100)}% occupied` : "Build the first office"} /><CampusKpi icon="📦" label="Warehouse" value={warehouseUnits ? `${Math.round(warehouseUtil * 100)}%` : "None"} detail={`${fmtNum(warehouseUsed)} / ${fmtNum(warehouseUnits)} space`} tone={warehouseUtil > .85 ? "warn" : undefined} /><CampusKpi icon="🏭" label="Production" value={`${ownBatches.length + outsourceBatches.length} live`} detail={`${fmtNum(factoryUnits + supplierUnits)} monthly capacity`} /><CampusKpi icon="🛍" label="Products" value={String(activeSkus.length)} detail={`${fmtNum(inventoryOnHand)} units ready`} /></div>
        {(attentionRooms.length > 0 || blockers.length > 0) && <div style={{ marginTop: 11 }}><b style={{ fontSize: 10.5, color: C.red }}>Needs attention</b><div style={{ display: "grid", gap: 5, marginTop: 6 }}>{attentionRooms.map(({ room, status }) => <button key={room.id} onClick={() => { setPulseOpen(false); setSelectedId(room.id); }} style={{ border: "1px solid #fecaca", background: "#fff7f7", color: C.ink, borderRadius: 8, padding: 8, textAlign: "left", cursor: "pointer", fontSize: 10 }}><b>{room.name}</b><span style={{ color: C.red, marginLeft: 6 }}>{status.label}</span></button>)}{blockers.filter((blocker) => !attentionRooms.some(({ status }) => blocker.toLowerCase().includes(status.label.toLowerCase()))).slice(0, 4).map((blocker) => <div key={blocker} style={{ border: "1px solid #fed7aa", background: "#fffaf0", color: "#92400e", borderRadius: 8, padding: 8, fontSize: 10 }}>{blocker}</div>)}</div></div>}
        {flow.length > 0 && <div style={{ marginTop: 11 }}><b style={{ fontSize: 10.5 }}>Product flow</b><div style={{ display: "grid", gap: 6, marginTop: 6 }}>{flow.slice(0, 4).map((item) => <div key={item.room.id} style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10.5 }}><b>{item.sku?.name ?? item.label}</b><span style={{ color: item.productionReady && item.inventoryReady && item.routeReady ? C.green : C.amber }}>{item.productionReady && item.inventoryReady && item.routeReady ? "FLOWING" : "INCOMPLETE"}</span></div><div style={{ display: "flex", gap: 4, marginTop: 5 }}><FlowStep ok={item.productionReady} label="Make" detail="" /><FlowStep ok={item.inventoryReady} label="Store" detail="" /><FlowStep ok={item.routeReady} label="Sell" detail="" /></div></div>)}</div></div>}
      </div>}
      {!compact && <div style={{ position: "absolute", right: 14, top: 14, background: "rgba(17,42,67,.88)", color: "white", borderRadius: 9, padding: "7px 10px", fontSize: 10, fontWeight: 800 }}>◈ {world.company} Campus</div>}
      {!compact && !selected && !pulseOpen && liveWorkItems.length > 0 && <div className="campus-work-stack"><div className="campus-work-title"><span>LIVE WORK</span><b>{liveWorkItems.length} active</b></div>{liveWorkItems.map((item) => <button key={item.id} onClick={() => onNavigate(item.top, item.sub)}><span className="campus-progress-ring" style={{ background: `conic-gradient(${item.color} ${Math.max(3, Math.min(100, item.progress * 100))}%,rgba(148,163,184,.22) 0)` }}><i>{item.icon}</i></span><span><b>{item.label}</b><small>{item.detail}</small><em><i style={{ width: `${Math.max(3, Math.min(100, item.progress * 100))}%`, background: item.color }}/></em></span><strong>{Math.round(item.progress * 100)}%</strong></button>)}</div>}
      {!placementFeedback && !expansionRoom && !movingRoom && !pulseOpen && !selected && <div className="campus-status-message" role="status">{message}</div>}
    </div>

    {selected && !expansionTargetId && !moveTargetId && <div className="campus-facility-panel" role="dialog" aria-label={`${selected.name} facility controls`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div><div style={{ color: C.faint, fontSize: 8.5, fontWeight: 900, letterSpacing: .8 }}>FACILITY</div><div style={{ fontWeight: 900, fontSize: 16, marginTop: 2 }}>{facilityDefForRoom(selected).icon} {selected.name}</div><div style={{ color: C.dim, fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>{facilityDefForRoom(selected).description}</div></div>
        <button aria-label="Close facility controls" style={ctrlBtn} onClick={() => { setSelectedId(null); setExpansionTargetId(null); }}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginTop: 10 }}>
        <div style={facilityMetric}><span>Status</span><b style={{ color: selectedStatus?.tone === "critical" ? C.red : selectedStatus?.tone === "warn" ? C.amber : C.violet }}>{selectedStatus?.label}</b></div>
        <div style={facilityMetric}><span>Footprint</span><b>{selected.w}×{selected.h}</b></div>
        <div style={facilityMetric}><span>Level</span><b>{selected.id === "founder-office" ? officeStageForLevel(selected.upgradeLevel ?? 1).label : `${selected.upgradeLevel ?? 1}/${facilityDefForRoom(selected).maxLevel}`}</b></div>
      </div>
      <div style={{ marginTop: 6, padding: "8px 9px", borderRadius: 8, background: C.panel2, fontSize: 10.5, display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: C.dim }}>{selectedType === "training_center" ? "Training slots" : selected.kind === "office" ? "Staff seats" : selected.kind === "warehouse" ? "Storage capacity" : selected.kind === "factory" ? "Production / month" : "Supplier capacity / month"}</span><b>{selectedType === "training_center" ? `${(world.player.trainingPrograms ?? []).filter((t)=>t.facilityRoomId===selected.id).length} / ${selected.capacity}` : selected.kind === "office" ? `${selected.assignedPersonnelIds.length + (selected.id === "founder-office" ? 1 : 0)} / ${selected.capacity}` : fmtNum(selected.capacity)}</b></div>
      {selected.id === "founder-office" && world.brands.length === 0
        ? <button style={{ ...bigBtn, width: "100%", marginTop: 10 }} onClick={() => onNavigate("mgmt", "vision")}>Create your founding brand →</button>
        : <button style={{ ...bigBtn, width: "100%", marginTop: 10 }} onClick={() => openSelected(selected)}>{selectedNav?.label} →</button>}
      <label style={labelStyle}>Facility name<input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} style={inputStyle} /></label>

      {selected.kind === "office" && selectedType !== "training_center" && <>
        {selected.id === "founder-office" ? <div style={{ marginTop: 10, display: "grid", gap: 7 }}>
          <div style={{ ...slotStyle, borderColor: "#9fc8e5" }}><div><b>Founder / CEO</b><div style={{ color: C.faint, fontSize: 9.5 }}>Permanent leadership slot</div></div><span style={{ color: C.green, fontWeight: 900 }}>FIXED</span></div>
          {Array.from({ length: Math.max(0, selected.capacity - 1) }).map((_, i) => { const person = world.player.personnel.find((p) => p.id === selected.assignedPersonnelIds[i]); return <div key={i} style={slotStyle}><div><b>{person ? person.name : `Open desk ${i + 2}`}</b><div style={{ color: C.faint, fontSize: 9.5 }}>{person ? person.title : "Flexible startup seat"}</div></div><span style={{ color: person ? C.green : C.violet, fontWeight: 900 }}>{person ? "OCCUPIED" : "OPEN"}</span></div>; })}
        </div> : selectedType === "office" || selectedType === "executive_wing" ? <label style={labelStyle}>Assign team<select value={selected.team} onChange={(e) => updateSelected({ team: e.target.value as TeamKind, productKey: e.target.value === "product" ? selected.productKey : null })} style={inputStyle}>{Object.entries(TEAM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label> : <div style={{ marginTop: 10, padding: 9, borderRadius: 8, background: C.panel2, color: C.dim, fontSize: 10.5 }}><b style={{ color: C.ink }}>Dedicated function:</b> {TEAM_LABEL[selected.team]}</div>}
        <div style={labelStyle}>Assigned employees
          <div style={{ display: "grid", gap: 6, marginTop: 3 }}>{world.player.personnel.filter((p: Personnel) => roleFitsRoom(p.role, selected)).length ? world.player.personnel.filter((p: Personnel) => roleFitsRoom(p.role, selected)).map((p: Personnel) => { const checked = selected.assignedPersonnelIds.includes(p.id); const otherRoom = rooms.find((r) => r.id !== selected.id && r.assignedPersonnelIds.includes(p.id)); const staffLimit = selected.id === "founder-office" ? Math.max(0, selected.capacity - 1) : selected.capacity; const full = !checked && selected.assignedPersonnelIds.length >= staffLimit; return <label key={p.id} title={full ? "This office has no free staff seats." : undefined} style={{ display: "flex", gap: 7, alignItems: "center", fontWeight: 400, opacity: full ? .5 : 1 }}><input disabled={full} type="checkbox" checked={checked} onChange={() => updateSelected({ assignedPersonnelIds: checked ? selected.assignedPersonnelIds.filter((id) => id !== p.id) : [...selected.assignedPersonnelIds, p.id] })} /><span>{p.name} · {p.title}{otherRoom ? <span style={{ color: C.amber }}> · currently {otherRoom.name}</span> : null}</span></label>; }) : <div style={{ color: C.faint, fontWeight: 400 }}>No compatible employees. <button style={{ ...ctrlBtn, marginTop: 6 }} onClick={() => onNavigate("mgmt","personnel")}>Search for people</button></div>}</div>
          {selected.assignedPersonnelIds.length >= (selected.id === "founder-office" ? selected.capacity - 1 : selected.capacity) && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>↳ No free staff desks. Expand this office or build another compatible office.</div>}
        </div>
        {(selected.id === "founder-office" || selected.team === "product") && <>
          <label style={labelStyle}>Category mandate<select value={selected.productKey ?? ""} onChange={(e) => updateSelected({ productKey: e.target.value || null, skuId: null, team: selected.id === "founder-office" ? "unassigned" : "product" })} style={inputStyle}><option value="">Choose product type…</option>{activeProductTypes.map((p) => <option key={p.key} value={p.key}>{p.label} · {INDUSTRIES[p.industryId]?.label ?? p.industryId}</option>)}</select></label>
          {(() => { const check = canCreateProduct(world); return <><button disabled={!check.ok} title={!check.ok ? check.reason : undefined} style={{ ...ctrlBtn, width: "100%", marginTop: 8, color: check.ok ? C.violet : C.faint, opacity: check.ok ? 1 : .5 }} onClick={openCreator}>＋ Design a product</button>{!check.ok && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 4 }}>↳ {check.reason}</div>}</>; })()}
        </>}
      </>}
      {selectedType === "training_center" && <div style={{ marginTop: 10, padding: 10, border: `1px solid ${C.line}`, borderRadius: 9, background: C.panel2 }}><b style={{ fontSize: 11.5 }}>Employee upskilling</b><div style={{ color: C.dim, fontSize: 10.5, marginTop: 4 }}>Training Room I supports 1 active course; Level II supports 3 and shortens programs. Start training from People → Employees.</div>{(world.player.trainingPrograms ?? []).filter((t)=>t.facilityRoomId===selected.id).map((t) => { const p=world.player.personnel.find((x)=>x.id===t.personnelId); return <div key={t.id} style={{ marginTop: 7, fontSize: 10.5, display:"flex", justifyContent:"space-between", gap:8 }}><span>{p?.name ?? "Employee"}</span><b>{Math.ceil(t.daysLeft)}d</b></div>; })}</div>}
      {selected.kind === "warehouse" && <><div style={{ color: C.faint, fontSize: 10.5, marginTop: 9 }}>Storage: {(selected.storageProfiles ?? ["standard"]).map((id) => STORAGE_PROFILES[id as keyof typeof STORAGE_PROFILES]?.label ?? id).join(" + ")} · this building contributes <b style={{ color: C.ink }}>{fmtNum(selected.capacity)}</b> standard-space units to the pooled warehouse network.</div>
        <div style={{ marginTop: 10, padding: 9, border: `1px solid ${C.line}`, borderRadius: 9, background: C.panel2 }}>
          <b style={{ fontSize: 11 }}>Storage modules</b>
          <div style={{ color: C.faint, fontSize: 9.5, marginTop: 3 }}>Products with climate, chilled, frozen or secure storage requirements cannot be manufactured until a compatible module exists.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6, marginTop: 8 }}>{(["climate","refrigerated","frozen","secure"] as StorageProfileId[]).map((profile) => {
            const installed = (selected.storageProfiles ?? ["standard"]).includes(profile);
            const techGate = storageModuleRequirement(world, profile);
            const peopleGate = teamEffectiveness(world, "operations") <= 0 ? "Seat a Sourcing / Operations specialist before installing specialized equipment." : null;
            const gate = techGate ?? peopleGate;
            const cost = WAREHOUSE_MODULE_COST[profile as Exclude<StorageProfileId,"standard">];
            const affordable = world.player.cash >= cost;
            return <button key={profile} disabled={installed || Boolean(gate) || !affordable} title={installed ? "Installed" : gate ?? (!affordable ? `Need ${fmtMoney(cost-world.player.cash)} more cash.` : undefined)} onClick={() => { const r=installWarehouseModule(selected.id, profile); setMessage(r.ok ? `${STORAGE_PROFILES[profile].infrastructureLabel} installed.` : r.reason ?? "Module installation failed."); }} style={{ ...ctrlBtn, textAlign: "left", opacity: installed || gate || !affordable ? .5 : 1 }}>
              <b>{installed ? "✓ " : ""}{STORAGE_PROFILES[profile].infrastructureLabel}</b><div style={{ color: gate ? C.amber : C.faint, fontSize: 9, marginTop: 2 }}>{installed ? "Installed" : gate ?? fmtMoney(cost)}</div>
            </button>;
          })}</div>
        </div>
        <WarehouseMini world={world} products={warehouseProducts} utilization={warehouseUtil} totalCapacity={warehouseUnits} totalUsed={warehouseUsed} /></>}
      {selected.kind === "factory" && <><div style={{ color: C.faint, fontSize: 10.5, marginTop: 9 }}>Lines: {(selected.manufacturingFamilies ?? []).map((id) => MANUFACTURING_FAMILIES[id]?.label ?? id).join(" + ") || "No production family configured"}</div>{teamEffectiveness(world,"operations") <= 0 && <div style={{ color:C.amber,fontSize:9.5,marginTop:6 }}>↳ Factory engineering is idle until a Sourcing / Operations specialist is seated.</div>}<label style={labelStyle}>Production profile<select disabled={teamEffectiveness(world,"operations") <= 0} title={teamEffectiveness(world,"operations") <= 0 ? "Seat a Sourcing / Operations specialist before retooling a factory." : undefined} value="" onChange={(e) => { if (!e.target.value) return; const profile = archetypeByKey(e.target.value); const ok = retoolFactory(selected.id, e.target.value); setMessage(ok ? `${selected.name} retooled for ${profile?.label ?? e.target.value}.` : "Retooling requires an Operations specialist, an unlocked category and sufficient cash."); }} style={{...inputStyle,opacity:teamEffectiveness(world,"operations") > 0 ? 1 : .5}}><option value="">Retool factory for product…</option>{activeProductTypes.map((p) => <option key={p.key} value={p.key}>{p.label} · {p.manufacturingFamilies.map((id) => MANUFACTURING_FAMILIES[id]?.label ?? id).join(" + ")}</option>)}</select></label><ActivityMini title="Owned production" skus={ownBatches} empty="No owned batches currently running." /></>}
      {selected.kind === "outsourcing" && <ActivityMini title="Supplier pipeline" skus={outsourceBatches} empty="No outsourced batches currently inbound." />}
      <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><div><b style={{ fontSize: 11.5 }}>Facility controls</b><div style={{ color: C.faint, fontSize: 9.5, marginTop: 2 }}>Move keeps staff, upgrades and settings. Expansion needs a larger footprint. Demolition is blocked while the building is operationally required.</div></div></div>
        <button disabled={world.player.cash < facilityMoveCost(selected)} title={world.player.cash < facilityMoveCost(selected) ? `Need ${fmtMoney(facilityMoveCost(selected) - world.player.cash)} more cash.` : undefined} style={{ ...ctrlBtn, width: "100%", marginTop: 8, borderColor: C.cyan, color: world.player.cash >= facilityMoveCost(selected) ? C.cyan : C.faint, opacity: world.player.cash >= facilityMoveCost(selected) ? 1 : .5 }} onClick={() => { setConfirmDemolishId(null); setPulseOpen(false); setBuildMenuOpen(false); setMoveTargetId(selected.id); setTool("select"); setMessage(`Move placement: choose a connected ${selected.w}×${selected.h} parcel for ${selected.name}.`); }}>↔ Move facility · {fmtMoney(facilityMoveCost(selected))}</button>
      </div>
      <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><div><b style={{ fontSize: 11.5 }}>Expand / upgrade facility</b><div style={{ color: C.faint, fontSize: 9.5, marginTop: 2 }}>{"Every expansion claims a larger physical footprint. After choosing Expand, place the enlarged building again on the grid; it may overlap its own current footprint but not paths or other facilities."}</div></div>{selectedUpgrade ? <span style={{ color: C.violet, fontWeight: 900, fontSize: 10 }}>{selected.kind === "office" ? `${selectedUpgrade.currentLabel} → ${selectedUpgrade.nextLabel}` : `L${selectedUpgrade.currentLevel} → L${selectedUpgrade.nextLevel}`}</span> : <span style={{ color: C.green, fontWeight: 900, fontSize: 10 }}>MAX</span>}</div>
        {selectedUpgrade ? <><button disabled={Boolean(selectedUpgradeGate) || world.player.cash < selectedUpgrade.cost} title={selectedUpgradeGate ?? (world.player.cash < selectedUpgrade.cost ? `Need ${fmtMoney(selectedUpgrade.cost - world.player.cash)} more cash.` : undefined)} style={{ ...ctrlBtn, width: "100%", marginTop: 8, borderColor: C.violet, color: !selectedUpgradeGate && world.player.cash >= selectedUpgrade.cost ? C.violet : C.faint, opacity: !selectedUpgradeGate && world.player.cash >= selectedUpgrade.cost ? 1 : .5 }} onClick={() => {
          if (!selectedNextSize) return;
          setPulseOpen(false); setBuildMenuOpen(false); setExpansionTargetId(selected.id); setTool("select");
          setMessage(`Expansion placement: choose a new ${selectedNextSize[0]}×${selectedNextSize[1]} footprint for ${selected.name}. The new footprint may overlap the existing building, but not paths or other facilities.`);
        }}>{selectedNextSize ? `${selected.w}×${selected.h} → ${selectedNextSize[0]}×${selectedNextSize[1]} · ` : ""}{selectedType === "training_center" ? `+${fmtNum(selectedUpgrade.capacityGain)} training slots · ${fmtMoney(selectedUpgrade.cost)}` : selected.kind === "office" ? `+${fmtNum(selectedUpgrade.capacityGain)} seats · ${fmtMoney(selectedUpgrade.cost)}` : `+${fmtNum(selectedUpgrade.capacityGain)} capacity · ${fmtMoney(selectedUpgrade.cost)}` }</button>{selectedUpgradeGate ? <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>↳ {selectedUpgradeGate}</div> : world.player.cash < selectedUpgrade.cost && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>↳ Need {fmtMoney(selectedUpgrade.cost - world.player.cash)} more cash for this upgrade.</div>}</> : <div style={{ color: C.faint, fontSize: 10, marginTop: 6 }}>This facility is fully upgraded.</div>}
      </div>
      {selected.id !== "founder-office" && (confirmDemolishId === selected.id ? <div style={{ marginTop: 12, padding: 10, border: "1px solid #fecaca", background: "#fff7f7", borderRadius: 10 }}><b style={{ color: C.red, fontSize: 11 }}>Demolish {selected.name}?</b><div style={{ color: C.dim, fontSize: 9.8, lineHeight: 1.4, marginTop: 3 }}>This removes the building and recovers {fmtMoney(facilityDemolitionRefund(selected))}. The action cannot be undone.</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}><button style={ctrlBtn} onClick={() => setConfirmDemolishId(null)}>Keep facility</button><button style={{ ...ctrlBtn, color: C.red, borderColor: "#fecaca" }} onClick={() => { const result = demolishRoom(selected.id); if (result.ok) { setSelectedId(null); setConfirmDemolishId(null); } else setMessage(result.reason ?? "Demolition blocked."); }}>Confirm demolition</button></div></div> : <><button disabled={!selectedDemolition?.ok} title={selectedDemolition?.ok ? undefined : selectedDemolition?.reason} style={{ ...ctrlBtn, width: "100%", marginTop: 12, color: C.red, opacity: selectedDemolition?.ok ? 1 : .45 }} onClick={() => setConfirmDemolishId(selected.id)}>Demolish · recover {fmtMoney(facilityDemolitionRefund(selected))}</button>{!selectedDemolition?.ok && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>↳ {selectedDemolition?.reason}</div>}</>)}
    </div>}
  </div>;
}

function BuildMenu({ current, cash, choose, compact = false, hasOffice, world, open, onOpenChange }: { current: BuildTool | "select" | "navigate"; cash: number; choose: (kind: BuildTool) => void; compact?: boolean; hasOffice: boolean; world: World; open: boolean; onOpenChange: (open: boolean) => void }) {
  const activeBuild = current !== "select" && current !== "navigate";
  const groups: Array<(typeof FACILITY_DEFS)[FacilityTypeId]["group"]> = ["Core", "Product", "People", "Commercial", "Operations"];
  const groupMeta: Record<(typeof FACILITY_DEFS)[FacilityTypeId]["group"], { blurb: string; tint: string }> = {
    Core: { blurb: "HQ, general offices and top-level leadership space.", tint: "#e0ecff" },
    Product: { blurb: "Design, specialist centers and research facilities.", tint: "#efe5ff" },
    People: { blurb: "Training, HR and team-development infrastructure.", tint: "#e7f7ef" },
    Commercial: { blurb: "Brand building, insights and demand generation.", tint: "#fff0dc" },
    Operations: { blurb: "Warehouses, logistics, factories and sourcing support.", tint: "#e0f5f8" },
  };
  const buildRows = (group: (typeof FACILITY_DEFS)[FacilityTypeId]["group"]) => BUILDABLE_FACILITY_IDS
    .filter((kind) => FACILITY_DEFS[kind].group === group)
    .map((kind) => {
      const d = FACILITY_DEFS[kind];
      const affordable = cash >= d.buildCost;
      const founder = kind === "office" && !hasOffice;
      const gate = founder ? null : facilityBuildRequirement(world, kind);
      const available = affordable && !gate;
      const capacityLabel = d.kind === "office" ? (kind === "training_center" ? `${d.capacity} training slot` : `${founder ? 4 : d.capacity} positions`) : `${fmtNum(d.capacity)} capacity`;
      return { kind, d, affordable, founder, gate, available, capacityLabel };
    })
    .sort((a, b) => Number(b.available) - Number(a.available) || a.d.buildCost - b.d.buildCost);

  return <div className="campus-build-wrap">
    <button aria-expanded={open} aria-controls="campus-build-menu" style={{ ...ctrlBtn, background: open || activeBuild ? C.violet : "rgba(255,255,255,.94)", color: open || activeBuild ? "white" : C.dim, boxShadow: "0 4px 14px rgba(30,41,59,.12)" }} onClick={() => onOpenChange(!open)}>＋ Build</button>
    {open && <div id="campus-build-menu" className="campus-build-menu" role="dialog" aria-label="Campus build menu">
      <div style={{ padding: "6px 8px 8px", borderBottom: `1px solid ${C.grid}`, marginBottom: 6 }}>
        <div style={{ color: C.ink, fontWeight: 900, fontSize: 12.5 }}>Campus build menu</div>
        <div style={{ color: C.faint, fontSize: 9.8, marginTop: 2 }}>Facilities are grouped by function. Buildable items stay at the top of each section, locked ones show the missing requirement.</div>
      </div>
      <button className="campus-build-item" disabled={cash < CAMPUS_PATH_COST} onClick={() => { choose("path"); onOpenChange(false); }} style={{ width: "100%", border: 0, background: current === "path" ? C.panel2 : "transparent", padding: 10, textAlign: "left", borderRadius: 10, cursor: cash >= CAMPUS_PATH_COST ? "pointer" : "default", color: C.ink, fontSize: 12.5, opacity: cash >= CAMPUS_PATH_COST ? 1 : .45 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>▰ Path</b><span style={{ color: C.faint }}>{fmtMoney(CAMPUS_PATH_COST)}/tile</span></div><div style={{ color: C.faint, fontSize: 10.5, marginTop: 2 }}>1×1 · extend from the entrance · buildings must touch connected paths</div></button>
      {groups.map((group) => {
        const rows = buildRows(group);
        const availableCount = rows.filter((r) => r.available).length;
        const meta = groupMeta[group];
        return <div key={group} style={{ marginTop: 8, border: `1px solid ${C.grid}`, borderRadius: 10, overflow: "hidden", background: "#fbfdff" }}>
          <div style={{ padding: "9px 10px 8px", background: `linear-gradient(180deg, ${meta.tint}, #ffffff)`, borderBottom: `1px solid ${C.grid}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <div style={{ color: C.ink, fontSize: 11.2, fontWeight: 900 }}>{group}</div>
              <div style={{ color: availableCount > 0 ? C.green : C.faint, fontSize: 9.5, fontWeight: 800 }}>{availableCount} buildable now</div>
            </div>
            <div style={{ color: C.faint, fontSize: 9.2, marginTop: 3 }}>{meta.blurb}</div>
          </div>
          <div style={{ padding: 6 }}>
            {rows.map(({ kind, d, affordable, founder, gate, available, capacityLabel }) => {
              const missing = gate ?? (!affordable ? `Need ${fmtMoney(d.buildCost - cash)} more cash.` : null);
              return <button className="campus-build-item" disabled={!available} title={missing ?? undefined} key={kind} onClick={() => { choose(kind); onOpenChange(false); }} style={{ width: "100%", border: 0, background: current === kind ? C.panel2 : available ? "transparent" : "#fafafa", padding: 10, textAlign: "left", borderRadius: 10, cursor: available ? "pointer" : "default", color: C.ink, fontSize: 12.5, opacity: available ? 1 : .62, marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <b>{d.icon} {founder ? "Founder Office I" : d.label}</b>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {available ? <span style={{ color: C.green, fontSize: 8.8, fontWeight: 900, letterSpacing: .45 }}>READY</span> : <span style={{ color: C.amber, fontSize: 8.8, fontWeight: 900, letterSpacing: .45 }}>LOCKED</span>}
                    <span style={{ color: C.faint }}>{fmtMoney(d.buildCost)}</span>
                  </div>
                </div>
                <div style={{ color: C.faint, fontSize: 9.5, marginTop: 2 }}>{d.size[0]}×{d.size[1]} · {capacityLabel} · {fmtMoney(d.monthlyCost)}/mo{founder ? " · Founder + 3 staff desks" : ""}</div>
                <div style={{ color: available ? C.dim : C.amber, fontSize: 9.4, marginTop: 3 }}>{available ? d.description : missing}</div>
              </button>;
            })}
          </div>
        </div>;
      })}
    </div>}
  </div>;
}


function WarehouseMini({ world, products, utilization, totalCapacity, totalUsed }: { world: World; products: SKU[]; utilization: number; totalCapacity: number; totalUsed: number }) {
  return <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><b>Warehouse network</b><span style={{ color: utilization > .9 ? C.red : C.dim }}>{fmtNum(totalUsed)} / {fmtNum(totalCapacity)} · {Math.round(utilization * 100)}%</span></div>
    {products.length === 0 ? <div style={{ color: C.faint, fontSize: 11, marginTop: 7 }}>The warehouse is currently empty.</div> : products.map((sku) => {
      const total = sku.inventory + (sku.mfgBatchSize ?? 0);
      return <div key={sku.id} style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 7, alignItems: "center", marginTop: 8 }}>
        <div style={{ width: 24, height: 28, borderRadius: 5, background: brandById(world, sku.brandId).color, border: "1px solid rgba(30,41,59,.15)", display: "grid", placeItems: "center", color: "white", fontSize: 8, fontWeight: 900, boxShadow: "inset 0 5px 0 rgba(255,255,255,.18)" }}>{sku.name.slice(0, 2).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sku.name}</div><div style={{ height: 4, background: C.grid, borderRadius: 3, marginTop: 4 }}><div style={{ width: `${Math.min(100, total / Math.max(1, products[0].inventory + (products[0].mfgBatchSize ?? 0)) * 100)}%`, height: "100%", background: brandById(world, sku.brandId).color, borderRadius: 3 }} /></div></div>
        <b style={{ fontSize: 10.5 }}>{fmtNum(total)}</b>
      </div>;
    })}
  </div>;
}

function ActivityMini({ title, skus, empty }: { title: string; skus: SKU[]; empty: string }) {
  return <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
    <b style={{ fontSize: 11.5 }}>{title}</b>
    {!skus.length ? <div style={{ color: C.faint, fontSize: 11, marginTop: 7 }}>{empty}</div> : skus.slice(0, 5).map((sku) => <div key={sku.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 7, fontSize: 11 }}><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku.name}</span><b>{fmtNum(sku.mfgBatchSize ?? 0)} · {Math.max(0, sku.mfgDaysLeft)}d</b></div>)}
  </div>;
}

function CampusKpi({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone?: "warn" }) {
  return <div style={{ background: C.panel, border: `1px solid ${tone === "warn" ? "#fed7aa" : C.line}`, borderRadius: 11, padding: "10px 12px", minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span style={{ color: C.dim, fontSize: 10.5, fontWeight: 700 }}>{icon} {label}</span><b style={{ fontSize: 14, color: tone === "warn" ? C.red : C.ink }}>{value}</b></div>
    <div style={{ color: C.faint, fontSize: 9.5, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{detail}</div>
  </div>;
}

function FlowStep({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return <div style={{ border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`, background: ok ? "#f0fdf4" : "#fef2f2", borderRadius: 8, padding: "7px 8px" }}><div style={{ color: ok ? "#166534" : "#991b1b", fontWeight: 700 }}>{ok ? "✓" : "!"} {label}</div><div style={{ color: C.faint, marginTop: 2 }}>{detail}</div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: 12, gap: 12 }}><span style={{ color: C.dim }}>{label}</span><b style={{ textAlign: "right" }}>{value}</b></div>;
}

const facilityMetric: React.CSSProperties = { display: "grid", gap: 3, padding: "7px 8px", borderRadius: 8, background: C.panel2, fontSize: 9.5, color: C.dim };
const labelStyle: React.CSSProperties = { display: "grid", gap: 5, fontSize: 12, color: C.dim, marginTop: 10, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 9px", background: "white", color: C.ink, fontSize: 12 };
const slotStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 9px", border: `1px solid ${C.line}`, borderRadius: 9, background: C.panel2, fontSize: 10.5 };
