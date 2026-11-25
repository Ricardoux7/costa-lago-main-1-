import { expenseCategories, initialState } from "../data";
import { monthSequence, today } from "../utils";
import { patterns } from "../validators";
import { canManageTenants } from "./selectors";

export const MAX_UPCOMING = 3;

export function isValidState(s) {
  if (!s || typeof s !== "object") return false;
  const lists = ["users", "units", "payments", "expenses", "reservations", "notices", "listings", "inquiries", "tenants"];
  if (!lists.every((k) => Array.isArray(s[k]))) return false;
  if (!s.favorites || typeof s.favorites !== "object") return false;
  const unitIds = new Set(s.units.map((u) => u.id));
  return s.users.every((u) => u.role !== "resident" || unitIds.has(u.unitId));
}

export function reserveError(state, { areaId, date, slot, unitId }) {
  if (!date || date < today()) return "Elige una fecha de hoy en adelante.";
  if (state.reservations.some((r) => r.areaId === areaId && r.date === date && r.slot === slot)) {
    return "Esa área ya está reservada en ese turno. Prueba con otro turno u otra fecha.";
  }
  const upcoming = state.reservations.filter((r) => r.unitId === unitId && r.date >= today()).length;
  if (upcoming >= MAX_UPCOMING) {
    return `Esa unidad ya tiene ${MAX_UPCOMING} reservas próximas. Cancela una para reservar otra.`;
  }
  return "";
}

const userById = (state, id) => state.users.find((u) => u.id === id);
const isSuper = (state, id) => userById(state, id)?.role === "superadmin";
export const normalizeDoc = (d) => (d ?? "").replace(/[\s-]/g, "").toUpperCase();
const nextBillingMonths = () => {
  const date = today();
  const month = date.slice(0, 7);
  return Number(date.slice(8, 10)) <= 15
    ? monthSequence(month)
    : monthSequence(monthSequence(month, 2)[1]);
};

export function ownerFeePayments(listing, months = monthSequence()) {
  if (!Number.isFinite(Number(listing.fee)) || Number(listing.fee) <= 0) return [];
  return months.map((month) => ({
    id: `owner-${listing.id}-${month}`,
    type: "ownerFee",
    ownerId: listing.ownerId,
    listingId: listing.id,
    month,
    amount: Number(listing.fee),
    dueDate: `${month}-15`,
    status: "unpaid",
    paidAt: null,
    method: null,
    reference: null,
  }));
}

export function rentPayments(tenant, months = monthSequence()) {
  return months.map((month) => ({
    id: `rent-${tenant.id}-${month}`,
    type: "rent",
    tenantId: tenant.id,
    tenantUserId: tenant.userId,
    ownerId: tenant.addedBy,
    listingId: tenant.type === "listing" ? tenant.targetId : null,
    unitId: tenant.type === "unit" ? tenant.targetId : null,
    month,
    amount: Number(tenant.rent),
    dueDate: `${month}-15`,
    status: "unpaid",
    paidAt: null,
    method: null,
    reference: null,
  }));
}

export function tenantError(state, t, actorId) {
  const actor = userById(state, actorId);
  if (!actor || !canManageTenants(actor)) return "Tu cuenta no puede registrar inquilinos.";
  if (t.type === "listing") {
    const l = state.listings.find((x) => x.id === t.targetId);
    if (!l || l.ownerId !== actor.id) return "Elige uno de tus inmuebles.";
  } else if (t.type === "unit") {
    if (actor.unitId !== t.targetId) return "Esa unidad no es tuya.";
  } else {
    return "Elige un inmueble.";
  }
  if (!patterns.tenantDocument.test((t.document ?? "").trim())) return "La cédula debe tener el formato V-12345678 o E-12345678.";
  const doc = normalizeDoc(t.document.trim());
  if (normalizeDoc(actor.document) === doc) return "No puedes registrarte a ti mismo como inquilino.";
  const tenantUser = state.users.find((u) => normalizeDoc(u.document) === doc);
  if (tenantUser && tenantUser.role !== "tenant") return "La cédula ya pertenece a una cuenta que no es de inquilino.";
  if (!tenantUser && !patterns.name.test((t.name ?? "").trim())) return "Escribe el nombre del inquilino (solo letras).";
  if (state.tenants.some((x) =>
    x.active !== false &&
    (x.userId === tenantUser?.id || normalizeDoc(x.document) === doc)
  )) return "Ese inquilino ya está asociado a un inmueble.";
  if (!Number.isFinite(Number(t.rent)) || Number(t.rent) <= 0) return "Indica una renta mensual mayor que cero.";
  const same = state.tenants.filter((x) => x.type === t.type && x.targetId === t.targetId && x.active !== false);
  if (same.length >= 5) return "Un inmueble admite hasta 5 inquilinos registrados.";
  return "";
}
const manages = (user, buildingId) => user?.role === "admin" && user.buildingIds.includes(buildingId);
const ownerHasTenant = (state, actor, userId) =>
  state.tenants.some((tenant) => tenant.addedBy === actor.id && tenant.userId === userId && tenant.active !== false);

function isAuthorizedNotice(state, notice, actorId) {
  const actor = userById(state, actorId);
  if (!actor || !notice || !Array.isArray(notice.recipientIds)) return false;
  if (actor.role === "superadmin") {
    return notice.targetRole === "owner" && notice.recipientIds.length > 0 &&
      notice.recipientIds.every((id) => userById(state, id)?.role === "owner");
  }
  if (actor.role === "owner") {
    return notice.targetRole === "tenant" && notice.recipientIds.length > 0 &&
      notice.recipientIds.every((id) => ownerHasTenant(state, actor, id));
  }
  return actor.role === "admin" && manages(actor, notice.buildingId) &&
    !notice.targetRole && notice.recipientIds.length === 0;
}

export function expenseError(state, expense, actorId) {
  const actor = userById(state, actorId);
  if (actor?.role !== "admin" || !manages(actor, expense.buildingId)) return "No puedes registrar gastos en ese edificio.";
  if (!expenseCategories.includes(expense.category)) return "Elige una categoría de gasto válida.";
  if (!/^\d{4}-\d{2}$/.test(expense.month)) return "Elige un mes válido.";
  if (!Number.isFinite(Number(expense.amount)) || Number(expense.amount) <= 0) return "El gasto debe ser mayor que cero.";
  return "";
}

export function reducer(state, action) {
  switch (action.type) {
    case "replace":
      return action.state;

    case "reset":
      return initialState;

    case "register": {
      const email = action.user.email.toLowerCase();
      const document = normalizeDoc(action.user.document);
      if (state.users.some((u) =>
        u.email.toLowerCase() === email || normalizeDoc(u.document) === document
      )) return state;
      if (action.user.role !== "tenant") return { ...state, users: [...state.users, action.user] };
      const pendingTenants = state.tenants.filter((tenant) =>
        !tenant.userId && tenant.active !== false && normalizeDoc(tenant.document) === document
      );
      const tenants = state.tenants.map((tenant) =>
        pendingTenants.some((pending) => pending.id === tenant.id)
          ? { ...tenant, userId: action.user.id, name: action.user.name }
          : tenant
      );
      return {
        ...state,
        users: [...state.users, action.user],
        tenants,
        payments: [
          ...pendingTenants.flatMap((tenant) => rentPayments({
            ...tenant,
            userId: action.user.id,
            name: action.user.name,
          })),
          ...state.payments,
        ],
      };
    }

    case "pay": {
      const actor = userById(state, action.actorId);
      const p = state.payments.find((x) => x.id === action.paymentId);
      if (!actor || !p || p.status === "paid") return state;
      const allowed = p.type === "ownerFee"
        ? actor.role === "owner" && state.listings.some((l) => l.id === p.listingId && l.ownerId === actor.id)
        : p.type === "rent"
          ? actor.role === "tenant" && p.tenantUserId === actor.id &&
            state.tenants.some((t) => t.id === p.tenantId && t.userId === actor.id && t.active !== false)
          : actor.role === "resident" && actor.unitId === p.unitId && !p.type;
      if (!allowed) return state;
      return {
        ...state,
        payments: state.payments.map((x) =>
          x.id === p.id ? { ...x, status: "paid", paidAt: today(), method: action.method, reference: action.reference } : x
        ),
      };
    }

    case "markPaid": {
      const actor = userById(state, action.actorId);
      const p = state.payments.find((x) => x.id === action.paymentId);
      if (!p || p.type || p.status === "paid" || !manages(actor, p.buildingId)) return state;
      return {
        ...state,
        payments: state.payments.map((x) =>
          x.id === p.id ? { ...x, status: "paid", paidAt: today(), method: "manual", reference: "Registrado por administración" } : x
        ),
      };
    }

    case "reserve": {
      const r = action.reservation;
      const actor = userById(state, r.userId);
      const allowed = actor && ((actor.role === "resident" && actor.unitId === r.unitId) || manages(actor, r.buildingId));
      if (!allowed || reserveError(state, r)) return state;
      return { ...state, reservations: [...state.reservations, r] };
    }

    case "cancelReservation": {
      const actor = userById(state, action.actorId);
      const r = state.reservations.find((x) => x.id === action.id);
      if (!actor || !r) return state;
      if (r.unitId !== actor.unitId && !manages(actor, r.buildingId)) return state;
      return { ...state, reservations: state.reservations.filter((x) => x.id !== r.id) };
    }

    case "addNotice": {
      const actor = userById(state, action.actorId);
      if (action.notice.targetRole) {
        if (!isAuthorizedNotice(state, action.notice, action.actorId)) return state;
      } else if (!manages(actor, action.notice.buildingId) || actor.role !== "admin") {
        return state;
      }
      return { ...state, notices: [action.notice, ...state.notices] };
    }

    case "remindDelinquentOwners": {
      const actor = userById(state, action.actorId);
      if (actor?.role !== "admin") return state;
      const ownerIds = [...new Set(state.payments
        .filter((p) => p.type === "ownerFee" && p.status !== "paid" && p.dueDate < today())
        .map((p) => p.ownerId)
        .filter((id) => userById(state, id)?.role === "owner"))];
      if (!ownerIds.length) return state;
      const notice = {
        id: action.id,
        title: "Recordatorio de cuota mensual vencida",
        body: "Tienes una o más cuotas mensuales vencidas. Revisa y regulariza tus pagos desde el portal.",
        date: today(),
        authorId: actor.id,
        targetRole: "owner",
        recipientIds: ownerIds,
      };
      return { ...state, notices: [notice, ...state.notices] };
    }

    case "addListing": {
      const actor = userById(state, action.actorId);
      if (actor?.role !== "owner" || action.listing.ownerId !== actor.id) return state;
      return {
        ...state,
        listings: [action.listing, ...state.listings],
        payments: [...ownerFeePayments(action.listing, nextBillingMonths()), ...state.payments],
      };
    }

    case "deleteListing": {
      const l = state.listings.find((x) => x.id === action.id);
      if (!l || l.ownerId !== action.actorId) return state;
      const favorites = Object.fromEntries(
        Object.entries(state.favorites).map(([uid, ids]) => [uid, ids.filter((id) => id !== l.id)])
      );
      const tenantIds = state.tenants.filter((t) => t.type === "listing" && t.targetId === l.id).map((t) => t.id);
      const tenantUserIds = state.tenants.filter((t) => tenantIds.includes(t.id)).map((t) => t.userId);
      return {
        ...state,
        listings: state.listings.filter((x) => x.id !== l.id),
        tenants: state.tenants.filter((t) => !tenantIds.includes(t.id)),
        payments: state.payments.filter((p) => p.listingId !== l.id && !tenantIds.includes(p.tenantId)),
        notices: state.notices.flatMap((n) => {
          if (n.authorId !== action.actorId || n.targetRole !== "tenant") return [n];
          const recipientIds = (n.recipientIds ?? []).filter((id) => !tenantUserIds.includes(id));
          return recipientIds.length ? [{ ...n, recipientIds }] : [];
        }),
        favorites,
      };
    }

    case "toggleFavorite": {
      if (!userById(state, action.userId)) return state;
      const current = state.favorites[action.userId] ?? [];
      const next = current.includes(action.propertyId)
        ? current.filter((id) => id !== action.propertyId)
        : [...current, action.propertyId];
      return { ...state, favorites: { ...state.favorites, [action.userId]: next } };
    }

    case "addInquiry": {
      const q = action.inquiry;
      if (!q || !patterns.name.test(q.name) || !patterns.email.test(q.email) || !patterns.message.test(q.message)) return state;
      return { ...state, inquiries: [q, ...state.inquiries] };
    }

    case "setInquiryRead": {
      if (!isSuper(state, action.actorId)) return state;
      return { ...state, inquiries: state.inquiries.map((q) => (q.id === action.id ? { ...q, read: action.read } : q)) };
    }

    case "deleteInquiry": {
      if (!isSuper(state, action.actorId)) return state;
      return { ...state, inquiries: state.inquiries.filter((q) => q.id !== action.id) };
    }

    case "addTenant": {
      const error = tenantError(state, action.tenant, action.actorId);
      if (error) return state;
      const tenantUser = state.users.find((u) => normalizeDoc(u.document) === normalizeDoc(action.tenant.document));
      const tenant = {
        ...action.tenant,
        userId: tenantUser?.id ?? null,
        name: tenantUser?.name ?? action.tenant.name,
        document: tenantUser?.document ?? action.tenant.document,
        active: true,
      };
      return {
        ...state,
        tenants: [...state.tenants, tenant],
        payments: [
          ...(tenant.userId ? rentPayments(tenant, nextBillingMonths()) : []),
          ...state.payments,
        ],
      };
    }

    case "removeTenant": {
      const t = state.tenants.find((x) => x.id === action.id);
      if (!t || t.addedBy !== action.actorId) return state;
      return {
        ...state,
        tenants: state.tenants.filter((x) => x.id !== t.id),
        payments: state.payments.filter((p) => p.tenantId !== t.id),
        notices: state.notices.flatMap((notice) => {
          if (notice.authorId !== action.actorId || notice.targetRole !== "tenant") return [notice];
          const recipientIds = (notice.recipientIds ?? []).filter((id) => id !== t.userId);
          return recipientIds.length ? [{ ...notice, recipientIds }] : [];
        }),
      };
    }

    case "addExpense": {
      if (expenseError(state, action.expense, action.actorId)) return state;
      return { ...state, expenses: [action.expense, ...state.expenses] };
    }

    case "deleteOwnerByDocument": {
      if (!isSuper(state, action.actorId)) return state;
      const owner = state.users.find((u) => u.role === "owner" && normalizeDoc(u.document) === normalizeDoc(action.document));
      if (!owner) return state;
      const listingIds = state.listings.filter((l) => l.ownerId === owner.id).map((l) => l.id);
      const tenantIds = state.tenants.filter((t) => t.addedBy === owner.id || (t.type === "listing" && listingIds.includes(t.targetId))).map((t) => t.id);
      const tenantUserIds = state.tenants.filter((t) => tenantIds.includes(t.id)).map((t) => t.userId).filter(Boolean);
      return {
        ...state,
        users: state.users.filter((u) => u.id !== owner.id),
        listings: state.listings.filter((l) => l.ownerId !== owner.id),
        tenants: state.tenants.filter((t) => !tenantIds.includes(t.id)),
        payments: state.payments.filter((p) =>
          p.ownerId !== owner.id && !listingIds.includes(p.listingId) && !tenantIds.includes(p.tenantId)
        ),
        notices: state.notices.flatMap((notice) => {
          if (notice.authorId === owner.id) return [];
          const recipientIds = (notice.recipientIds ?? []).filter((id) => id !== owner.id && !tenantUserIds.includes(id));
          if (notice.targetRole && notice.recipientIds?.length && recipientIds.length === 0) return [];
          return [{ ...notice, recipientIds }];
        }),
        favorites: Object.fromEntries(Object.entries(state.favorites).filter(([id]) => id !== owner.id)),
      };
    }

    case "updateProfile": {
      const { name, phone, email } = action.changes;
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.userId ? { ...u, name, phone, email } : u)),
      };
    }

    default:
      return state;
  }
}
