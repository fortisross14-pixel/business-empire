import React, { useEffect, useMemo, useRef, useState } from "react";
import type { World, OperatingRoom, OperatingRoomKind, OperatingTeamKind, Personnel, SKU, IndustryBusiness } from "../../engine/types";
import type { StorageProfileId } from "../../engine/productCatalog";
import { PRODUCT_PROJECT_TIERS } from "../../engine/types";
import { C, ctrlBtn, bigBtn, fmtMoney, fmtNum } from "../theme";
import { CAMPUS_ENTRANCE, CAMPUS_PATH_COST, canBuildCampusPath, facilityUpgradeQuote, officeStageForLevel, OPERATING_ROOM_DEFS, roleFitsRoom, roomTouchesConnectedPath, storageModuleRequirement, WAREHOUSE_MODULE_COST } from "../../engine/infrastructure";
import { brandById, primaryBrand } from "../../engine/brands";
import { archetypeByKey, defaultFactoryFamiliesForIndustry, MANUFACTURING_FAMILIES, STORAGE_PROFILES } from "../../engine/productCatalog";
import { canCreateProduct, inventoryUsed } from "../../engine/capacity";
import { INDUSTRIES } from "../../engine/industries";
import { campusAssetImage, CAMPUS_ASSETS, roomCampusAsset } from "../campus/assetRegistry";
import { facilityResearchRequirement, officeUpgradeResearchRequirement } from "../../engine/research";
import { teamEffectiveness } from "../../engine/people";

const MAP = 48;
const TW = 54;
const TH = 27;

type RoomKind = OperatingRoomKind;
type BuildTool = RoomKind | "path";
type TeamKind = OperatingTeamKind;
type Room = OperatingRoom;
type NavTarget = { top: string; sub: string; label: string };

const ROOM_META: Record<RoomKind, { label: string; icon: string; size: [number, number]; cost: number; monthlyCost: number; capacity: number; floor: string; wall: string; roof: string; description: string }> = {
  office: { label: "Office", icon: "🏢", size: OPERATING_ROOM_DEFS.office.size, cost: OPERATING_ROOM_DEFS.office.buildCost, monthlyCost: OPERATING_ROOM_DEFS.office.monthlyCost, capacity: OPERATING_ROOM_DEFS.office.capacity, floor: "#dbeafe", wall: "#526b90", roof: "#eef6ff", description: "Houses product, marketing, finance, sales, strategy or operations teams." },
  factory: { label: "Factory", icon: "🏭", size: OPERATING_ROOM_DEFS.factory.size, cost: OPERATING_ROOM_DEFS.factory.buildCost, monthlyCost: OPERATING_ROOM_DEFS.factory.monthlyCost, capacity: OPERATING_ROOM_DEFS.factory.capacity, floor: "#e5e7eb", wall: "#5e6671", roof: "#d9dee5", description: "Owned manufacturing capacity. Active production is visible directly on the campus." },
  warehouse: { label: "Warehouse", icon: "📦", size: OPERATING_ROOM_DEFS.warehouse.size, cost: OPERATING_ROOM_DEFS.warehouse.buildCost, monthlyCost: OPERATING_ROOM_DEFS.warehouse.monthlyCost, capacity: OPERATING_ROOM_DEFS.warehouse.capacity, floor: "#fef3c7", wall: "#8b6b2f", roof: "#fff7d6", description: "Stores finished goods. Its fill level mirrors real inventory and inbound batches." },
  outsourcing: { label: "Sourcing Office", icon: "🤝", size: OPERATING_ROOM_DEFS.outsourcing.size, cost: OPERATING_ROOM_DEFS.outsourcing.buildCost, monthlyCost: OPERATING_ROOM_DEFS.outsourcing.monthlyCost, capacity: OPERATING_ROOM_DEFS.outsourcing.capacity, floor: "#ede9fe", wall: "#6d59a0", roof: "#f4f0ff", description: "Coordinates suppliers, contract manufacturing and external distribution partners." },
};

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

export function CompanyMapView({ world, openCreator, updateRooms, buildRoom, buildPath, buildPathLine, demolishRoom, upgradeRoom, retoolFactory, installWarehouseModule, onNavigate }: {
  world: World;
  openCreator: () => void;
  updateRooms: (rooms: OperatingRoom[]) => void;
  buildRoom: (room: OperatingRoom) => boolean;
  buildPath: (x: number, y: number) => { ok: boolean; reason?: string };
  buildPathLine: (tiles: { x: number; y: number }[]) => { ok: boolean; reason?: string; built: number };
  demolishRoom: (roomId: string) => void;
  upgradeRoom: (roomId: string) => { ok: boolean; reason?: string };
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
  const [tool, setTool] = useState<BuildTool | "select" | "navigate">("select");
  const [hover, setHover] = useState({ x: 0, y: 0 });
  const [camera, setCamera] = useState({ x: 480, y: 28, zoom: 0.72 });
  const [message, setMessage] = useState("Start from the entrance: build a path, then place your first office beside it.");
  const [visualClock, setVisualClock] = useState(Date.now());
  const [buildFx, setBuildFx] = useState<{ id: string; until: number } | null>(null);
  const [pathDraft, setPathDraft] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [compact, setCompact] = useState(false);
  const drag = useRef<{ active: boolean; moved: boolean; x: number; y: number }>({ active: false, moved: false, x: 0, y: 0 });
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
      const width = window.innerWidth;
      const isCompact = width < 980;
      const zoom = width < 430 ? .42 : width < 600 ? .48 : isCompact ? .58 : .68;
      setCompact(isCompact);
      const activeRooms = roomsRef.current;
      const bounds = activeRooms.reduce((box, room) => ({
        minX: Math.min(box.minX, room.x), minY: Math.min(box.minY, room.y),
        maxX: Math.max(box.maxX, room.x + room.w), maxY: Math.max(box.maxY, room.y + room.h),
      }), { minX: CAMPUS_ENTRANCE.x, minY: CAMPUS_ENTRANCE.y, maxX: CAMPUS_ENTRANCE.x + 1, maxY: CAMPUS_ENTRANCE.y + 1 });
      const gx = (bounds.minX + bounds.maxX) / 2, gy = (bounds.minY + bounds.maxY) / 2;
      const targetX = width * (isCompact ? .50 : .53);
      const targetY = Math.max(175, (wrapRef.current?.clientHeight || window.innerHeight - 92) * (isCompact ? .60 : .58));
      setCamera({ x: targetX - (gx - gy) * (TW / 2) * zoom, y: targetY - (gx + gy) * (TH / 2) * zoom, zoom });
    };
    apply(); window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [rooms.length]);

  const selected = rooms.find((r) => r.id === selectedId) ?? null;
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
  const activeSkus = world.player.skus.filter((s) => s.status === "active");
  const staffedSeats = rooms.filter((r) => r.kind === "office").reduce((n, r) => n + r.assignedPersonnelIds.length + (r.id === "founder-office" ? 1 : 0), 0);
  const totalSeats = rooms.filter((r) => r.kind === "office").reduce((n, r) => n + r.capacity, 0);
  const salesPulse = world.live?.totalUnits ?? 0;
  const activeBusinesses = Object.values(world.player.businesses ?? {}).filter((b): b is IndustryBusiness => Boolean(b && b.status === "active"));
  const activeProductTypes = [...new Map(activeBusinesses.flatMap((b) => b.unlockedCategories).map((key) => [key, archetypeByKey(key)] as const)).values()].filter((p): p is NonNullable<typeof p> => Boolean(p));

  const flow = useMemo(() => productRooms.map((r) => {
    const sku = world.player.skus.find((s) => s.id === r.skuId) ?? world.player.skus.find((s) => s.productKey === r.productKey);
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
    if (room.kind === "warehouse") {
      const tone = warehouseUtil > .9 ? "critical" : warehouseUtil > .72 ? "warn" : "ok";
      return { label: `${Math.round(warehouseUtil * 100)}% full`, progress: warehouseUtil, tone };
    }
    if (room.kind === "factory") {
      const load = factoryUnits ? Math.min(1, ownBatches.reduce((n, s) => n + (s.mfgBatchSize ?? 0), 0) / Math.max(factoryUnits, 1)) : 0;
      return { label: ownBatches.length ? `${ownBatches.length} batch${ownBatches.length > 1 ? "es" : ""} running` : "Idle capacity", progress: load, tone: ownBatches.length ? "active" : "neutral" };
    }
    if (room.kind === "outsourcing") {
      const load = supplierUnits ? Math.min(1, outsourceBatches.reduce((n, s) => n + (s.mfgBatchSize ?? 0), 0) / Math.max(supplierUnits, 1)) : 0;
      return { label: outsourceBatches.length ? `${outsourceBatches.length} supplier batch${outsourceBatches.length > 1 ? "es" : ""}` : "Partners ready", progress: load, tone: outsourceBatches.length ? "active" : "neutral" };
    }
    const occupiedSeats = room.assignedPersonnelIds.length + (room.id === "founder-office" ? 1 : 0);
    const occupancy = room.capacity ? occupiedSeats / room.capacity : 0;
    const linkedSku = room.skuId ? world.player.skus.find((s) => s.id === room.skuId) : null;
    const productSku = linkedSku ?? (room.team === "product" && room.productKey ? world.player.skus.find((s) => s.productKey === room.productKey && s.status === "designing") : null);
    if (productSku?.status === "designing") {
      const tier = productSku.projectTier ?? (productSku.designDepth === "breakthrough" ? "AAA" : productSku.designDepth === "advanced" ? "AA" : "A");
      const total = PRODUCT_PROJECT_TIERS[tier].baseDays;
      return { label: `${productSku.name} · ${Math.max(0, productSku.designDaysLeft)}d`, progress: Math.max(0, Math.min(1, 1 - productSku.designDaysLeft / total)), tone: "active" };
    }
    return { label: `${occupiedSeats}/${room.capacity} positions`, progress: occupancy, tone: room.id === "founder-office" ? "ok" : room.team === "unassigned" ? "warn" : "ok" };
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
      const meta = ROOM_META[room.kind];
      const selectedNow = room.id === selectedId;
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
      ctx.fillStyle = selectedNow ? "rgba(83,103,201,.16)" : "rgba(47,63,71,.11)";
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
        ctx.shadowColor = selectedNow ? "rgba(124,58,237,.3)" : "rgba(30,41,59,.14)";
        ctx.shadowBlur = selectedNow ? 15 : 6; ctx.shadowOffsetY = 5;
        ctx.drawImage(assetImg, dx, dy, drawW, drawH);
        ctx.shadowColor = "transparent";
        if (selectedNow) {
          ctx.strokeStyle = C.violet; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath(); ctx.stroke();
          ctx.fillStyle = "rgba(83,103,201,.08)"; ctx.fill();
        }
      } else {
      ctx.shadowColor = selectedNow ? "rgba(124,58,237,.28)" : "rgba(30,41,59,.18)";
      ctx.shadowBlur = selectedNow ? 12 : 8; ctx.shadowOffsetY = 7;
      ctx.fillStyle = shade(meta.wall, -18);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = meta.wall;
      ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(t3.x, t3.y); ctx.lineTo(t2.x, t2.y); ctx.closePath(); ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = selectedNow ? shade(meta.roof, 4) : meta.roof;
      ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = selectedNow ? C.violet : "rgba(51,65,85,.26)"; ctx.lineWidth = selectedNow ? 2.2 : 1; ctx.stroke();

      const roofY = center.y - rawH;

      // Building-specific visual language.
      if (room.kind === "office") {
        ctx.strokeStyle = "rgba(255,255,255,.72)"; ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(center.x + i * 11 * camera.zoom, roofY - 1); ctx.lineTo(center.x + i * 11 * camera.zoom, roofY + 18 * camera.zoom); ctx.stroke();
        }
        ctx.strokeStyle = companyBrand.color; ctx.lineWidth = 4 * camera.zoom;
        ctx.beginPath(); ctx.moveTo(t0.x + (t1.x - t0.x) * .18, t0.y + (t1.y - t0.y) * .18); ctx.lineTo(t0.x + (t1.x - t0.x) * .82, t0.y + (t1.y - t0.y) * .82); ctx.stroke();
      } else if (room.kind === "factory") {
        ctx.fillStyle = "#8a939e";
        [-.23, .05, .32].forEach((off, i) => {
          const x = center.x + off * room.w * TW * camera.zoom * .5;
          const y = roofY - 5 - i * 1.5;
          ctx.fillRect(x - 3, y - 13 * camera.zoom, 6, 15 * camera.zoom);
          if (ownBatches.length) {
            const puff = 7 + ((visualClock / 180 + i * 5) % 9);
            ctx.fillStyle = `rgba(148,163,184,${.22 + (i * .04)})`;
            ctx.beginPath(); ctx.arc(x + Math.sin(visualClock / 700 + i) * 3, y - 16 * camera.zoom - puff, 4 + i, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#8a939e";
          }
        });
        // Production lights.
        ctx.fillStyle = ownBatches.length ? "#22c55e" : "#94a3b8";
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(center.x - 23 + i * 15, roofY + 14, 2.6, 0, Math.PI * 2); ctx.fill(); }
      } else if (room.kind === "warehouse") {
        ctx.strokeStyle = "rgba(139,107,47,.35)"; ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
          const a = i / 5; ctx.beginPath(); ctx.moveTo(t0.x + (t3.x - t0.x) * a, t0.y + (t3.y - t0.y) * a); ctx.lineTo(t1.x + (t2.x - t1.x) * a, t1.y + (t2.y - t1.y) * a); ctx.stroke();
        }
        drawPackageStack(room);
      } else {
        ctx.strokeStyle = companyBrand.color; ctx.lineWidth = 3 * camera.zoom;
        ctx.beginPath(); ctx.moveTo(t0.x + 8, t0.y + 4); ctx.lineTo(t1.x - 8, t1.y + 4); ctx.stroke();
        ctx.fillStyle = outsourceBatches.length ? "#22c55e" : "#94a3b8";
        ctx.beginPath(); ctx.arc(center.x, roofY + 9, 3, 0, Math.PI * 2); ctx.fill();
      }

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
      const labelW = Math.min(178, Math.max(100, room.name.length * 6.4 + 30));
      roundedRect(ctx, center.x - labelW / 2, roofY - 44, labelW, 34, 8);
      ctx.fillStyle = selectedNow ? "rgba(255,255,255,.98)" : "rgba(255,255,255,.91)"; ctx.fill();
      ctx.strokeStyle = selectedNow ? C.violet : "rgba(100,116,139,.22)"; ctx.lineWidth = selectedNow ? 1.5 : 1; ctx.stroke();
      ctx.textAlign = "center"; ctx.fillStyle = "#1f2937"; ctx.font = `700 ${Math.max(9, 11.5 * camera.zoom)}px system-ui`;
      ctx.fillText(`${meta.icon} ${room.name}`, center.x, roofY - 28);
      ctx.font = `${Math.max(8, 9.5 * camera.zoom)}px system-ui`; ctx.fillStyle = status.tone === "critical" ? "#dc2626" : status.tone === "warn" ? "#b45309" : status.tone === "active" ? "#4f46e5" : "#64748b";
      ctx.fillText(status.label, center.x, roofY - 16);
      const barW = labelW - 18; ctx.fillStyle = "rgba(148,163,184,.2)"; ctx.fillRect(center.x - barW / 2, roofY - 13, barW, 2.5);
      ctx.fillStyle = status.tone === "critical" ? "#ef4444" : status.tone === "warn" ? "#f59e0b" : status.tone === "active" ? companyBrand.color : "#22c55e";
      ctx.fillRect(center.x - barW / 2, roofY - 13, barW * Math.max(.03, Math.min(1, status.progress)), 2.5);
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

    if (tool === "path") {
      const draftTiles = pathDraft ? straightTiles(pathDraft.start, pathDraft.end) : [hover];
      for (const tile of draftTiles) {
        const check = canBuildCampusPath(world, tile);
        drawDiamond(tile.x, tile.y, check.ok ? "#b9e7d2" : "#fecaca", check.ok ? "#0f8a62" : "#dc2626", 0.88);
      }
    } else if (tool !== "select" && tool !== "navigate") {
      const [w, h] = ROOM_META[tool].size;
      const candidate = { x: hover.x, y: hover.y, w, h };
      const coversPath = paths.some((p) => p.x >= hover.x && p.x < hover.x + w && p.y >= hover.y && p.y < hover.y + h);
      const valid = hover.x >= 0 && hover.y >= 0 && hover.x + w <= MAP && hover.y + h <= MAP && !rooms.some((r) => overlaps(candidate, r)) && !coversPath && roomTouchesConnectedPath(world, candidate);
      for (let yy = hover.y; yy < hover.y + h; yy++) for (let xx = hover.x; xx < hover.x + w; xx++) if (xx >= 0 && yy >= 0 && xx < MAP && yy < MAP) drawDiamond(xx, yy, valid ? "#bbf7d0" : "#fecaca", valid ? "#16a34a" : "#dc2626", 0.73);
    }
  }, [rooms, paths, selectedId, hover, tool, camera, compact, visualClock, buildFx, pathDraft, world.tick, world.live, world.player.skus, world.player.personnel, companyBrand.color]);

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

  // Hit testing deliberately uses only the projected foundation diamond. Tall isometric
  // sprites can overlap visually, but they never steal clicks from the parcel below.
  const pickRoomAtScreen = (sx: number, sy: number) => {
    const ordered = [...rooms].sort((a,b) => (b.x+b.y+b.w+b.h) - (a.x+a.y+a.w+a.h));
    return ordered.find((r) => {
      const pts = [iso(r.x,r.y,camera.x,camera.y,camera.zoom), iso(r.x+r.w,r.y,camera.x,camera.y,camera.zoom), iso(r.x+r.w,r.y+r.h,camera.x,camera.y,camera.zoom), iso(r.x,r.y+r.h,camera.x,camera.y,camera.zoom)];
      return pointInPolygon(sx, sy, pts);
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
    const meta = ROOM_META[kind];
    const [w, h] = meta.size;
    const candidate = { x, y, w, h };
    const coversPath = paths.some((p) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h);
    if (x < 0 || y < 0 || x + w > MAP || y + h > MAP || rooms.some((r) => overlaps(candidate, r)) || coversPath) {
      setMessage(coversPath ? "Buildings sit beside paths, not on top of them." : "That facility does not fit there."); return;
    }
    if (!roomTouchesConnectedPath(world, candidate)) { setMessage("Facilities must touch a path connected to the campus entrance."); return; }
    if (world.player.cash < meta.cost) { setMessage(`Not enough cash to build ${meta.label}.`); return; }
    const firstOffice = kind === "office" && !rooms.some((r) => r.kind === "office");
    const n = rooms.filter((r) => r.kind === kind).length + 1;
    const room: Room = {
      id: firstOffice ? "founder-office" : `${kind}-${Date.now()}`, kind, x, y, w, h,
      name: firstOffice ? "Founder Office" : `${meta.label} ${n}`, team: firstOffice ? "unassigned" : (kind === "office" ? "unassigned" : "operations"),
      productKey: null, skuId: null, assignedPersonnelIds: [], buildCost: meta.cost, monthlyCost: meta.monthlyCost,
      capacity: firstOffice ? 4 : meta.capacity, upgradeLevel: 1,
      manufacturingFamilies: kind === "factory" ? defaultFactoryFamiliesForIndustry(world.industryId) : undefined,
      storageProfiles: kind === "warehouse" ? ["standard"] : undefined,
    };
    if (!buildRoom(room)) { setMessage(`Could not build ${meta.label}. Check cash and path access.`); return; }
    setBuildFx({ id: room.id, until: Date.now() + 4200 });
    setSelectedId(room.id); setTool("select");
    setMessage(firstOffice ? "Founder Office built. One of four positions belongs to you; three staff desks are open." : `${meta.label} complete. Its activity and capacity now appear directly on the campus.`);
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

  const selectedStatus = selected ? roomStatus(selected) : null;
  const selectedNav = selected ? roomNavigation(selected) : null;
  const selectedUpgrade = selected ? facilityUpgradeQuote(selected) : null;
  const selectedUpgradeGate = selected && selectedUpgrade && selected.kind === "office" ? officeUpgradeResearchRequirement(world, selectedUpgrade.nextLevel) : null;
  const warehouseProducts = world.player.skus.filter((s) => s.inventory + (s.mfgBatchSize ?? 0) > 0).sort((a, b) => (b.inventory + (b.mfgBatchSize ?? 0)) - (a.inventory + (a.mfgBatchSize ?? 0))).slice(0, 5);

  const resetCamera = () => {
    const width = wrapRef.current?.clientWidth ?? 900;
    const zoom = width < 430 ? .42 : width < 600 ? .48 : compact ? .58 : .68;
    const bounds = rooms.reduce((box, room) => ({
      minX: Math.min(box.minX, room.x), minY: Math.min(box.minY, room.y),
      maxX: Math.max(box.maxX, room.x + room.w), maxY: Math.max(box.maxY, room.y + room.h),
    }), { minX: CAMPUS_ENTRANCE.x, minY: CAMPUS_ENTRANCE.y, maxX: CAMPUS_ENTRANCE.x + 1, maxY: CAMPUS_ENTRANCE.y + 1 });
    const gx = (bounds.minX + bounds.maxX) / 2, gy = (bounds.minY + bounds.maxY) / 2;
    const targetX = width * (compact ? .50 : .53);
    const targetY = Math.max(175, (wrapRef.current?.clientHeight ?? window.innerHeight) * (compact ? .60 : .58));
    setCamera({ x: targetX - (gx - gy) * (TW / 2) * zoom, y: targetY - (gx + gy) * (TH / 2) * zoom, zoom });
  };

  return <div style={{ position: "relative", height: "100%", minHeight: compact ? 0 : 520, overflow: "hidden" }}>
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, background: "#e5ece7", overflow: "hidden" }}>
      <canvas ref={canvasRef}
        onPointerDown={(e) => { const tile = pointerTile(e.clientX, e.clientY, e.currentTarget); drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY }; pathStart.current = tool === "path" ? tile : null; if (tool === "path") setPathDraft({ start: tile, end: tile }); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => {
          const t = pointerTile(e.clientX, e.clientY, e.currentTarget); setHover(t);
          if (!drag.current.active) return;
          const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
          if (tool === "path" && pathStart.current) { const tile = pointerTile(e.clientX, e.clientY, e.currentTarget); setPathDraft({ start: pathStart.current, end: tile }); }
          if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
          if ((tool === "select" || tool === "navigate") && drag.current.moved) { setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy })); drag.current.x = e.clientX; drag.current.y = e.clientY; }
        }}
        onPointerUp={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
          if (tool === "path") {
            const start = pathStart.current ?? pointerTile(e.clientX, e.clientY, e.currentTarget);
            const end = pointerTile(e.clientX, e.clientY, e.currentTarget);
            const existing = new Set(paths.map((path) => `${path.x},${path.y}`));
            const result = buildPathLine(straightTiles(start, end).filter((tile) => !existing.has(`${tile.x},${tile.y}`)));
            setMessage(result.ok ? `${result.built} path tile${result.built === 1 ? "" : "s"} built · ${fmtMoney(result.built * CAMPUS_PATH_COST)}.` : result.reason ?? "Path cannot be built there.");
            setPathDraft(null); pathStart.current = null;
          } else if (!drag.current.moved) {
            if (tool === "select" || tool === "navigate") {
              const r = pickRoomAtScreen(sx, sy); setSelectedId(r?.id ?? null);
              setMessage(r ? `${r.name} selected.` : "Empty parcel. Use Build to extend paths or place a connected facility.");
            } else { const t = pointerTile(e.clientX, e.clientY, e.currentTarget); place(tool, t.x, t.y); }
          }
          drag.current.active = false;
        }}
        style={{ display: "block", cursor: tool === "select" || tool === "navigate" ? "grab" : "crosshair", touchAction: "none" }} />

      <div style={{ position: "absolute", left: compact ? 7 : 14, top: compact ? 7 : 14, right: compact ? 7 : undefined, display: "flex", gap: compact ? 4 : 6, flexWrap: "wrap", maxWidth: compact ? "none" : "calc(100% - 160px)", zIndex: 6 }}>
        <button style={{ ...ctrlBtn, minHeight: compact ? 40 : undefined, background: tool === "select" ? C.violet : "rgba(255,255,255,.94)", color: tool === "select" ? "white" : C.dim, boxShadow: "0 4px 14px rgba(30,41,59,.12)" }} onClick={() => { setTool("select"); setMessage("Click a building footprint to inspect it. Drag empty ground to move the campus."); }}>↖ {compact ? "Map" : "Campus"}</button>
        <BuildMenu compact={compact} current={tool} world={world} cash={world.player.cash} hasOffice={rooms.some((r) => r.kind === "office")} choose={(kind) => { setTool(kind); setSelectedId(null); setMessage(kind === "path" ? "Path mode: extend one tile at a time from the campus entrance." : `Build mode: place ${!rooms.some((r) => r.kind === "office") && kind === "office" ? "your 4-seat Founder Office" : ROOM_META[kind].label.toLowerCase()} beside the connected path.`); }} />
        <button aria-label="Zoom out" style={{ ...ctrlBtn, minWidth: compact ? 40 : undefined, minHeight: compact ? 40 : undefined, background: "rgba(255,255,255,.94)" }} onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(.38, c.zoom - .08) }))}>−</button>
        <button style={{ ...ctrlBtn, minHeight: compact ? 40 : undefined, background: "rgba(255,255,255,.94)" }} onClick={resetCamera}>{compact ? "⌖" : "Center"}</button>
        <button aria-label="Zoom in" style={{ ...ctrlBtn, minWidth: compact ? 40 : undefined, minHeight: compact ? 40 : undefined, background: "rgba(255,255,255,.94)" }} onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(1.15, c.zoom + .08) }))}>＋</button>
      </div>
      {!compact && <div style={{ position: "absolute", right: 14, top: 14, background: "rgba(17,42,67,.88)", color: "white", borderRadius: 9, padding: "7px 10px", fontSize: 10, fontWeight: 800 }}>◈ {world.company} Campus</div>}
      {!compact && <div style={{ position: "absolute", left: 14, bottom: 14, maxWidth: 520, background: "rgba(255,255,255,.92)", backdropFilter: "blur(7px)", border: `1px solid ${C.line}`, borderRadius: 9, padding: "7px 10px", color: C.dim, fontSize: 10.5 }}>{message}</div>}
    </div>

    {selected && <div style={compact ? { position: "absolute", left: 6, right: 6, bottom: 6, top: "auto", width: "auto", maxHeight: "56%", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "rgba(255,255,255,.99)", border: `1px solid ${C.violet}`, borderRadius: "16px 16px 12px 12px", padding: 12, paddingBottom: "calc(12px + env(safe-area-inset-bottom))", boxShadow: "0 -12px 38px rgba(17,42,67,.25)", zIndex: 8 } : { position: "absolute", right: 18, top: 68, width: "min(390px,calc(100vw - 36px))", maxHeight: "calc(100vh - 158px)", overflowY: "auto", background: "rgba(255,255,255,.98)", border: `1px solid ${C.violet}`, borderRadius: 15, padding: 15, boxShadow: "0 18px 44px rgba(17,42,67,.24)", zIndex: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div><div style={{ color: C.faint, fontSize: 8.5, fontWeight: 900, letterSpacing: .8 }}>FACILITY</div><div style={{ fontWeight: 900, fontSize: 16, marginTop: 2 }}>{ROOM_META[selected.kind].icon} {selected.name}</div><div style={{ color: C.dim, fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>{ROOM_META[selected.kind].description}</div></div>
        <button style={ctrlBtn} onClick={() => setSelectedId(null)}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginTop: 10 }}>
        <div style={facilityMetric}><span>Status</span><b style={{ color: selectedStatus?.tone === "critical" ? C.red : selectedStatus?.tone === "warn" ? C.amber : C.violet }}>{selectedStatus?.label}</b></div>
        <div style={facilityMetric}><span>Footprint</span><b>{selected.w}×{selected.h}</b></div>
        <div style={facilityMetric}><span>{selected.kind === "office" ? "Office scale" : "Level"}</span><b>{selected.kind === "office" ? officeStageForLevel(selected.upgradeLevel ?? 1).label : `${selected.upgradeLevel ?? 1}/3`}</b></div>
      </div>
      <div style={{ marginTop: 6, padding: "8px 9px", borderRadius: 8, background: C.panel2, fontSize: 10.5, display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: C.dim }}>{selected.kind === "office" ? "Staff seats" : selected.kind === "warehouse" ? "Storage capacity" : selected.kind === "factory" ? "Production / month" : "Supplier capacity / month"}</span><b>{selected.kind === "office" ? `${selected.assignedPersonnelIds.length + (selected.id === "founder-office" ? 1 : 0)} / ${selected.capacity}` : fmtNum(selected.capacity)}</b></div>
      {selected.id === "founder-office" && world.brands.length === 0
        ? <button style={{ ...bigBtn, width: "100%", marginTop: 10 }} onClick={() => onNavigate("mgmt", "vision")}>Create your founding brand →</button>
        : <button style={{ ...bigBtn, width: "100%", marginTop: 10 }} onClick={() => openSelected(selected)}>{selectedNav?.label} →</button>}
      <label style={labelStyle}>Facility name<input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} style={inputStyle} /></label>

      {selected.kind === "office" && <>
        {selected.id === "founder-office" ? <div style={{ marginTop: 10, display: "grid", gap: 7 }}>
          <div style={{ ...slotStyle, borderColor: "#9fc8e5" }}><div><b>Founder / CEO</b><div style={{ color: C.faint, fontSize: 9.5 }}>Permanent leadership slot</div></div><span style={{ color: C.green, fontWeight: 900 }}>FIXED</span></div>
          {Array.from({ length: Math.max(0, selected.capacity - 1) }).map((_, i) => { const person = world.player.personnel.find((p) => p.id === selected.assignedPersonnelIds[i]); return <div key={i} style={slotStyle}><div><b>{person ? person.name : `Open desk ${i + 2}`}</b><div style={{ color: C.faint, fontSize: 9.5 }}>{person ? person.title : "Flexible startup seat"}</div></div><span style={{ color: person ? C.green : C.violet, fontWeight: 900 }}>{person ? "OCCUPIED" : "OPEN"}</span></div>; })}
        </div> : <label style={labelStyle}>Assign team<select value={selected.team} onChange={(e) => updateSelected({ team: e.target.value as TeamKind, productKey: e.target.value === "product" ? selected.productKey : null })} style={inputStyle}>{Object.entries(TEAM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
        <div style={labelStyle}>Assigned employees
          <div style={{ display: "grid", gap: 6, marginTop: 3 }}>{world.player.personnel.filter((p: Personnel) => roleFitsRoom(p.role, selected)).length ? world.player.personnel.filter((p: Personnel) => roleFitsRoom(p.role, selected)).map((p: Personnel) => { const checked = selected.assignedPersonnelIds.includes(p.id); const otherRoom = rooms.find((r) => r.id !== selected.id && r.assignedPersonnelIds.includes(p.id)); const staffLimit = selected.id === "founder-office" ? Math.max(0, selected.capacity - 1) : selected.capacity; const full = !checked && selected.assignedPersonnelIds.length >= staffLimit; return <label key={p.id} title={full ? "This office has no free staff seats." : undefined} style={{ display: "flex", gap: 7, alignItems: "center", fontWeight: 400, opacity: full ? .5 : 1 }}><input disabled={full} type="checkbox" checked={checked} onChange={() => updateSelected({ assignedPersonnelIds: checked ? selected.assignedPersonnelIds.filter((id) => id !== p.id) : [...selected.assignedPersonnelIds, p.id] })} /><span>{p.name} · {p.title}{otherRoom ? <span style={{ color: C.amber }}> · currently {otherRoom.name}</span> : null}</span></label>; }) : <div style={{ color: C.faint, fontWeight: 400 }}>No compatible employees. <button style={{ ...ctrlBtn, marginTop: 6 }} onClick={() => onNavigate("mgmt","personnel")}>Search for people</button></div>}</div>
          {selected.assignedPersonnelIds.length >= (selected.id === "founder-office" ? selected.capacity - 1 : selected.capacity) && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>↳ No free staff desks. Expand this office or build another compatible office.</div>}
        </div>
        {(selected.id === "founder-office" || selected.team === "product") && <>
          <label style={labelStyle}>Category mandate<select value={selected.productKey ?? ""} onChange={(e) => updateSelected({ productKey: e.target.value || null, skuId: null, team: selected.id === "founder-office" ? "unassigned" : "product" })} style={inputStyle}><option value="">Choose product type…</option>{activeProductTypes.map((p) => <option key={p.key} value={p.key}>{p.label} · {INDUSTRIES[p.industryId]?.label ?? p.industryId}</option>)}</select></label>
          {(() => { const check = canCreateProduct(world); return <><button disabled={!check.ok} title={!check.ok ? check.reason : undefined} style={{ ...ctrlBtn, width: "100%", marginTop: 8, color: check.ok ? C.violet : C.faint, opacity: check.ok ? 1 : .5 }} onClick={openCreator}>＋ Design a product</button>{!check.ok && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 4 }}>↳ {check.reason}</div>}</>; })()}
        </>}
      </>}
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><div><b style={{ fontSize: 11.5 }}>Expand / upgrade facility</b><div style={{ color: C.faint, fontSize: 9.5, marginTop: 2 }}>{selected.kind === "office" ? "Office progression: 4 → 8 → 16 → 32 seats. Once the Corporate HQ is reached, every additional floor adds 8 more positions." : "Capacity upgrades improve this facility without changing its current footprint."}</div></div>{selectedUpgrade ? <span style={{ color: C.violet, fontWeight: 900, fontSize: 10 }}>{selected.kind === "office" ? `${selectedUpgrade.currentLabel} → ${selectedUpgrade.nextLabel}` : `L${selectedUpgrade.currentLevel} → L${selectedUpgrade.nextLevel}`}</span> : <span style={{ color: C.green, fontWeight: 900, fontSize: 10 }}>MAX</span>}</div>
        {selectedUpgrade ? <><button disabled={Boolean(selectedUpgradeGate) || world.player.cash < selectedUpgrade.cost} title={selectedUpgradeGate ?? (world.player.cash < selectedUpgrade.cost ? `Need ${fmtMoney(selectedUpgrade.cost - world.player.cash)} more cash.` : undefined)} style={{ ...ctrlBtn, width: "100%", marginTop: 8, borderColor: C.violet, color: !selectedUpgradeGate && world.player.cash >= selectedUpgrade.cost ? C.violet : C.faint, opacity: !selectedUpgradeGate && world.player.cash >= selectedUpgrade.cost ? 1 : .5 }} onClick={() => { const r = upgradeRoom(selected.id); setMessage(r.ok ? `${selected.name} expanded to level ${selectedUpgrade.nextLevel}.` : r.reason ?? "Upgrade failed."); }}>{selected.kind === "office" ? `Expand · +${fmtNum(selectedUpgrade.capacityGain)} seats · ${fmtMoney(selectedUpgrade.cost)}` : `Upgrade · +${fmtNum(selectedUpgrade.capacityGain)} capacity · ${fmtMoney(selectedUpgrade.cost)}`}</button>{selectedUpgradeGate ? <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>↳ {selectedUpgradeGate}</div> : world.player.cash < selectedUpgrade.cost && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>↳ Need {fmtMoney(selectedUpgrade.cost - world.player.cash)} more cash for this upgrade.</div>}</> : <div style={{ color: C.faint, fontSize: 10, marginTop: 6 }}>This facility is fully upgraded.</div>}
      </div>
      {selected.id !== "founder-office" && <button style={{ ...ctrlBtn, width: "100%", marginTop: 12, color: C.red }} onClick={() => { demolishRoom(selected.id); setSelectedId(null); }}>Demolish facility</button>}
    </div>}
  </div>;
}

function BuildMenu({ current, cash, choose, compact = false, hasOffice, world }: { current: BuildTool | "select" | "navigate"; cash: number; choose: (kind: BuildTool) => void; compact?: boolean; hasOffice: boolean; world: World }) {
  const [open, setOpen] = useState(false);
  const activeBuild = current !== "select" && current !== "navigate";
  return <div style={{ position: "relative" }}>
    <button style={{ ...ctrlBtn, minHeight: compact ? 40 : undefined, background: open || activeBuild ? C.violet : "rgba(255,255,255,.94)", color: open || activeBuild ? "white" : C.dim, boxShadow: "0 4px 14px rgba(30,41,59,.12)" }} onClick={() => setOpen((v) => !v)}>＋ Build</button>
    {open && <div style={{ position: "absolute", left: 0, top: compact ? 44 : 38, width: compact ? "min(310px,calc(100vw - 20px))" : 310, maxHeight: compact ? "52vh" : undefined, overflowY: compact ? "auto" : undefined, background: "white", border: `1px solid ${C.line}`, borderRadius: 11, padding: 7, boxShadow: "0 12px 32px rgba(17,42,67,.22)", zIndex: 12 }}>
      <button disabled={cash < CAMPUS_PATH_COST} onClick={() => { choose("path"); setOpen(false); }} style={{ width: "100%", border: 0, background: current === "path" ? C.panel2 : "transparent", padding: 9, textAlign: "left", borderRadius: 7, cursor: cash >= CAMPUS_PATH_COST ? "pointer" : "default", color: C.ink, fontSize: 11, opacity: cash >= CAMPUS_PATH_COST ? 1 : .45 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>▰ Path</b><span style={{ color: C.faint }}>{fmtMoney(CAMPUS_PATH_COST)}/tile</span></div><div style={{ color: C.faint, fontSize: 9.5, marginTop: 2 }}>1×1 · extend from the entrance · buildings must touch connected paths</div></button>
      {(Object.keys(ROOM_META) as RoomKind[]).map((kind) => {
        const d = ROOM_META[kind]; const affordable = cash >= d.cost; const founder = kind === "office" && !hasOffice; const gate = founder ? null : facilityResearchRequirement(world, kind); const available = affordable && !gate;
        return <button disabled={!available} title={gate ?? (!affordable ? `Need ${fmtMoney(d.cost - cash)} more cash.` : undefined)} key={kind} onClick={() => { choose(kind); setOpen(false); }} style={{ width: "100%", border: 0, background: current === kind ? C.panel2 : "transparent", padding: 9, textAlign: "left", borderRadius: 7, cursor: available ? "pointer" : "default", color: C.ink, fontSize: 11, opacity: available ? 1 : .45 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{d.icon} {founder ? "Founder Office" : d.label}</b><span style={{ color: C.faint }}>{fmtMoney(d.cost)}</span></div><div style={{ color: available ? C.faint : C.amber, fontSize: 9.5, marginTop: 2 }}>{d.size[0]}×{d.size[1]} footprint · {kind === "office" ? `${founder ? 4 : d.capacity} positions` : `${fmtNum(d.capacity)} capacity`} · {fmtMoney(d.monthlyCost)}/mo{founder ? " · Founder + 3 staff desks" : ""}{gate ? ` · ${gate}` : !affordable ? ` · need ${fmtMoney(d.cost - cash)} more cash` : ""}</div></button>;
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
