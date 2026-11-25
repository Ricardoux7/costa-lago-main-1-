import { buildings, kindLabel, priceRanges } from "../data";
import { today } from "../utils";

const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);

export const paymentStatus = (p) =>
  p.status === "paid" ? "paid" : p.dueDate < today() ? "overdue" : "pending";

export const unitOf = (state, user) => state.units.find((u) => u.id === user.unitId);

export const buildingIdsOf = (state, user) =>
  user.role === "admin" ? user.buildingIds : [unitOf(state, user)?.buildingId].filter(Boolean);

export const buildingsOf = (state, user) =>
  buildings.filter((b) => buildingIdsOf(state, user).includes(b.id));

export function paymentsOf(state, user) {
  if (user.role === "owner") {
    const listingIds = new Set(listingsOf(state, user).map((listing) => listing.id));
    return state.payments.filter((p) => p.type === "ownerFee" && listingIds.has(p.listingId));
  }
  if (user.role === "tenant") {
    return state.payments.filter((p) => p.type === "rent" && p.tenantUserId === user.id);
  }
  if (user.role === "resident") {
    return state.payments.filter((p) => !p.type && p.unitId === user.unitId);
  }
  const ids = buildingIdsOf(state, user);
  return state.payments.filter((p) => !p.type && ids.includes(p.buildingId));
}

export function expensesOf(state, user) {
  if (user.role !== "admin") return [];
  return state.expenses.filter((e) => user.buildingIds.includes(e.buildingId));
}

export function unitsOf(state, user) {
  if (user.role !== "admin") return [];
  return state.units.filter((u) => user.buildingIds.includes(u.buildingId));
}

export function reservationsOf(state, user) {
  const ids = buildingIdsOf(state, user);
  return state.reservations.filter((r) => ids.includes(r.buildingId));
}

export function noticesOf(state, user) {
  if (user.role === "owner" || user.role === "tenant") {
    return state.notices
      .filter((n) => n.authorId === user.id || (n.recipientIds ?? []).includes(user.id))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  if (user.role === "superadmin") {
    return state.notices
      .filter((n) => n.authorId === user.id && n.targetRole === "owner")
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  const ids = buildingIdsOf(state, user);
  return state.notices
    .filter((n) => ids.includes(n.buildingId))
    .filter((n) => user.role === "admin" || !n.targetUnitIds || n.targetUnitIds.includes(user.unitId))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function overdueUnitIds(state, buildingId) {
  const ids = state.payments
    .filter((p) => p.buildingId === buildingId && paymentStatus(p) === "overdue")
    .map((p) => p.unitId);
  return [...new Set(ids)];
}

export function buildFinance(payments, expenses, months) {
  const rows = months.map((month) => {
    const pays = payments.filter((p) => p.month === month);
    const billed = sum(pays, (p) => p.amount);
    const collected = sum(pays.filter((p) => p.status === "paid"), (p) => p.amount);
    const overdue = sum(pays.filter((p) => paymentStatus(p) === "overdue"), (p) => p.amount);
    const spent = sum(expenses.filter((e) => e.month === month), (e) => e.amount);
    return { month, billed, collected, overdue, spent, net: collected - spent, delinquency: billed ? (overdue / billed) * 100 : 0 };
  });

  const totals = {
    billed: sum(rows, (r) => r.billed),
    collected: sum(rows, (r) => r.collected),
    overdue: sum(rows, (r) => r.overdue),
    spent: sum(rows, (r) => r.spent),
  };
  totals.net = totals.collected - totals.spent;
  totals.delinquency = totals.billed ? (totals.overdue / totals.billed) * 100 : 0;

  const byCat = {};
  expenses
    .filter((e) => months.includes(e.month))
    .forEach((e) => { byCat[e.category] = (byCat[e.category] ?? 0) + e.amount; });
  const byCategory = Object.entries(byCat)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { rows, totals, byCategory };
}

export function delinquencyBreakdown(payments, units) {
  const debt = new Map();
  payments.forEach((p) => {
    if (paymentStatus(p) !== "overdue") return;
    const d = debt.get(p.unitId) ?? { months: 0, amount: 0 };
    d.months += 1;
    d.amount += p.amount;
    debt.set(p.unitId, d);
  });

  const morosos = units
    .filter((u) => debt.has(u.id))
    .map((u) => ({ unitId: u.id, label: u.label, buildingId: u.buildingId, occupant: u.occupant, ...debt.get(u.id) }))
    .sort((a, b) => b.amount - a.amount);

  const count = (fn) => units.filter((u) => fn(debt.get(u.id)?.months ?? 0)).length;
  const segments = [
    { label: "Al día", value: count((m) => m === 0), color: "#0096C7" },
    { label: "1 mes de atraso", value: count((m) => m === 1), color: "#FFB703" },
    { label: "2 meses", value: count((m) => m === 2), color: "#F97316" },
    { label: "3 meses o más", value: count((m) => m >= 3), color: "#E5484D" },
  ];
  return { morosos, segments, unitCount: units.length };
}

export const roleLabel = (user) =>
  user.role === "superadmin"
    ? "Superadministrador"
    : user.role === "admin"
      ? "Administrador"
      : user.role === "owner"
        ? "Propietario"
        : user.role === "tenant"
          ? "Inquilino"
        : (user.tenure ?? "Residente");

export const canManageTenants = (user) =>
  user.role === "owner" || (user.role === "resident" && /^Propietari/.test(user.tenure ?? ""));

export const inquiriesOf = (state, user) =>
  user.role === "superadmin" ? [...state.inquiries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)) : [];

export const tenantsOf = (state, user) => state.tenants.filter((t) => t.addedBy === user.id);
export const activeTenantsOf = (state, user) =>
  tenantsOf(state, user).filter((tenant) => tenant.active !== false);

export const listingsOf = (state, user) => state.listings.filter((l) => l.ownerId === user.id);

export function filterProperties(list, { zona, tipo, precio }) {
  const range = priceRanges.find((r) => r.value === precio);
  return list.filter(
    (p) =>
      (!zona || p.zone === zona) &&
      (!tipo || kindLabel[p.kind] === tipo) &&
      (!range || (p.price > range.min && p.price <= range.max))
  );
}
