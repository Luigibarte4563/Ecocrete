// One place for the brand string, catalogue, plans, mix table, prices and money helpers.

export const BRAND = { name: "EcoCrete", sub: "Smart Concrete Estimator" };

export const CONTACT = {
  email: "hello@ecocrete.ph",
  phone: "+63 917 000 0000",
  address: "Quezon City, Metro Manila",
  hours: "Mon–Sat · 8AM–6PM",
};

export const PAYMENTS = ["GCash", "Maya", "BDO", "BPI", "Metrobank", "Landbank", "Visa", "Mastercard"];

// services, one-off, prices in PHP excluding VAT
export const SERVICES = [
  {
    id: "pro-estimate",
    index: "01",
    name: "Pro Estimate Report",
    description: "An engineer-checked material takeoff and cost report for your project.",
    price: 3500,
    unit: "per project",
    features: [
      "Complete material takeoff (cement, sand, gravel, rebar, formwork)",
      "Labor cost estimates per Philippine rates",
      "3 supplier price comparisons per material",
      "Wastage factors per material type",
      "PDF report delivered in 24 hours",
    ],
    featured: true,
    badge: "Most popular",
  },
  {
    id: "mix-design",
    index: "02",
    name: "Custom Mix Design",
    description: "A mix proportioned for your target strength and the aggregates you actually have.",
    price: 8500,
    unit: "per mix",
    features: [
      "Target strength and slump optimization",
      "Local aggregate characterization",
      "Admixture recommendations (plasticizers, retarders)",
      "Trial batch proportions and adjustments",
      "Signed engineer's certificate",
    ],
  },
  {
    id: "supplier-match",
    index: "03",
    name: "Supplier Match & Booking",
    description: "We shortlist verified suppliers, negotiate volume pricing and book the deliveries.",
    price: 5000,
    unit: "per project",
    features: [
      "Verified supplier shortlist (3–5 options)",
      "Negotiated volume pricing",
      "Delivery scheduling and coordination",
      "Real-time delivery tracking",
      "Post-pour quality receipts",
    ],
    badge: "New",
  },
  {
    id: "project-tracker",
    index: "04",
    name: "Project Tracker Pro",
    description: "Keep every pour, cost and strength test on one tracked timeline.",
    price: 2500,
    unit: "per month",
    features: [
      "Unlimited pours and estimates saved",
      "Cost tracking against budget",
      "Strength test logging and trends",
      "Compliance checklist (NSCP, DPWH)",
      "Team access (up to 5 members)",
      "Export reports (PDF, Excel)",
    ],
  },
  {
    id: "consultation",
    index: "05",
    name: "Engineer Consultation",
    description: "An hour with a licensed civil engineer about your plans, specs or test results.",
    price: 4000,
    unit: "per session",
    features: [
      "1-hour video consultation",
      "Document review (plans, specs, tests)",
      "Written summary and recommendations",
      "Follow-up email support (7 days)",
      "Scheduled within 48 hours",
    ],
  },
];

// subscription plans, per workspace per month, excluding VAT
export const PLANS = [
  {
    id: "starter",
    index: "01",
    name: "Starter",
    price: 1999,
    unit: "per workspace / month",
    description: "For a single small project and a small crew.",
    features: [
      "5 active projects",
      "5 team seats",
      "Unlimited mix estimates",
      "Wastage and cost tracking",
      "20 report exports a month",
      "Email support",
    ],
    compare: { projects: "5", seats: "5", batching: false, suppliers: false, carbon: false, exports: "20 / mo", support: "Email" },
  },
  {
    id: "professional",
    index: "02",
    name: "Professional",
    price: 4999,
    unit: "per workspace / month",
    description: "For a contractor running several pours at once.",
    features: [
      "25 active projects",
      "20 team seats",
      "Automated batching sheets",
      "Supplier price comparisons",
      "Carbon and SCM reporting",
      "100 report exports a month",
      "Priority support",
    ],
    featured: true,
    badge: "Best value",
    compare: { projects: "25", seats: "20", batching: true, suppliers: true, carbon: true, exports: "100 / mo", support: "Priority" },
  },
  {
    id: "enterprise",
    index: "03",
    name: "Enterprise",
    price: 9999,
    unit: "per workspace / month",
    description: "For a developer or a multi-site programme.",
    features: [
      "Unlimited projects",
      "Unlimited team seats",
      "API and custom integrations",
      "1 TB document storage",
      "Dedicated engineer",
      "24/7 support",
    ],
    compare: { projects: "Unlimited", seats: "Unlimited", batching: true, suppliers: true, carbon: true, exports: "Unlimited", support: "24/7 dedicated" },
  },
];

// volumetric mix table: cement kg per m3, water/cement ratio, sand and gravel as kg per kg of binder
export const MIX = {
  C15: { label: "C15/20 (15 MPa) · Non-structural", cement: 280, wc: 0.62, sand: 2.4, gravel: 3.6 },
  C20: { label: "C20/25 (20 MPa) · Patios, Floors", cement: 320, wc: 0.58, sand: 2.0, gravel: 3.2 },
  C25: { label: "C25/30 (25 MPa) · Standard Slabs", cement: 360, wc: 0.5, sand: 1.8, gravel: 2.8 },
  C30: { label: "C30/37 (30 MPa) · Pavements", cement: 400, wc: 0.45, sand: 1.5, gravel: 2.6 },
  C35: { label: "C35/45 (35 MPa) · Structural", cement: 440, wc: 0.42, sand: 1.3, gravel: 2.4 },
  C40: { label: "C40/50 (40 MPa) · Columns & Beams", cement: 480, wc: 0.38, sand: 1.2, gravel: 2.2 },
};

export const SCM = {
  none: { label: "100% Ordinary Portland Cement", short: "None", pricePerKg: 0 },
  flyash: { label: "Fly Ash (ASTM C618)", short: "Fly Ash", pricePerKg: 6 },
  ggbfs: { label: "GGBFS Slag (BS EN 15167)", short: "GGBFS Slag", pricePerKg: 9 },
  silica: { label: "Silica Fume (ASTM C1240)", short: "Silica Fume", pricePerKg: 28 },
};

export const scmLabel = (type) => (SCM[type] || SCM.none).label;

// material prices used by the calculator's cost column
export const PRICES = {
  cementBag: 280, // one 50 kg bag
  sand: 1500, // per tonne
  gravel: 1400, // per tonne
};

export const WASTAGE = [0, 5, 10, 15];
export const CARBON_PER_KG_CEMENT = 0.83; // kg CO2e saved per kg of cement replaced

// one recipient only, same rule as the server
export const EMAIL_RE = /^[^\s@,<>]+@[^\s@,<>]+\.[a-zA-Z]{2,}$/;

export const VAT_RATE = 0.12;
export const CANCEL_FEE = 0.2;
export const CANCEL_DAYS = 7;
export const MAX_QTY = 99;

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
export const formatPHP = (n) => peso.format(Math.round(Number(n) || 0));

export function totals(subtotal) {
  const sub = Number(subtotal) || 0;
  const vat = sub * VAT_RATE;
  return { subtotal: sub, vat, total: sub + vat };
}

export const refundAmount = (total) => (Number(total) || 0) * (1 - CANCEL_FEE);

export const getService = (id) => SERVICES.find((s) => s.id === id);
export const getPlan = (id) => PLANS.find((p) => p.id === id);

// bigger stone needs less mixing water: +2% at 10 mm, -3% at 40 mm
const WATER_FACTOR = { 10: 1.02, 20: 1, 40: 0.97 };

// the batch for one pour, in the units the site buys in. Pure: the page just renders it.
export function mixBatch({ grade, length = 0, width = 0, depth = 0, waste = 0, maxAgg = 20, scmType = "none", scmPct = 0 } = {}) {
  const cfg = MIX[grade] || MIX.C25;
  const replacement = scmType === "none" ? 0 : Math.min(Math.max(Number(scmPct) || 0, 0), 0.5);
  const volume = (Number(length) || 0) * (Number(width) || 0) * (Number(depth) || 0) * (1 + (Number(waste) || 0) / 100);
  const binder = cfg.cement * volume;
  const cementKg = binder * (1 - replacement);
  const scmKg = binder * replacement;
  const bags = Math.ceil(cementKg / 50);
  const sandKg = binder * cfg.sand;
  const gravelKg = binder * cfg.gravel;
  const waterL = Math.round(binder * cfg.wc * (WATER_FACTOR[maxAgg] || 1));
  const scmPrice = (SCM[scmType] || SCM.none).pricePerKg;

  const cost = {
    cement: bags * PRICES.cementBag,
    scm: scmKg * scmPrice,
    sand: (sandKg / 1000) * PRICES.sand,
    gravel: (gravelKg / 1000) * PRICES.gravel,
  };

  return {
    cfg,
    volume,
    binder,
    cementKg,
    scmKg,
    bags,
    sandKg,
    gravelKg,
    waterL,
    cost,
    total: cost.cement + cost.scm + cost.sand + cost.gravel,
    savedKg: scmKg * CARBON_PER_KG_CEMENT,
  };
}

// A stored cart item turned into a priced line. Custom items (calculator output) carry
// their own name, unit, price and a text summary so they survive a catalogue change.
export function lineOf(item = {}) {
  const qty = Math.min(Math.max(Number(item.qty) || 0, 0), MAX_QTY);
  if (!qty) return null;
  const custom = item.custom;
  const price = Number(custom?.price);
  if (custom && custom.name && Number.isFinite(price) && price >= 0) {
    return { id: item.id, qty, name: custom.name, unit: custom.unit || "", price, meta: custom.meta || "", lineTotal: price * qty, custom: true };
  }
  const known = getService(item.id) || getPlan(item.id);
  if (!known) return null;
  return { id: known.id, qty, name: known.name, unit: known.unit, price: known.price, meta: "", lineTotal: known.price * qty, custom: false };
}
