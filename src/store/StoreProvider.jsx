import { useEffect, useMemo, useReducer, useRef } from "react";
import { expenseCategories, initialState, MONTHS } from "../data";
import { monthSequence, today } from "../utils";
import { expenseError, isValidState, normalizeDoc, ownerFeePayments, reducer, rentPayments, reserveError, tenantError } from "./logic";
import { overdueUnitIds } from "./selectors";
import { StoreContext } from "./StoreContext";

const KEY = "costalago.data.v3";

function hydrate(savedData) {
  const saved = { ...initialState, ...savedData };
  const demoTenant = initialState.users.find((u) => u.id === "u9");
  if (!saved.users.some((u) => u.id === "u9") && demoTenant) {
    saved.users = [...saved.users, demoTenant];
  }
  saved.listings = saved.listings.map((listing) =>
    listing.id === 101 && listing.ownerId === "u7" && Number(listing.fee) === 0
      ? { ...listing, fee: 150 }
      : listing
  );
  saved.tenants = saved.tenants.map((tenant) => {
    if (tenant.id !== "t1" || tenant.userId) return tenant;
    const user = saved.users.find((u) => normalizeDoc(u.document) === normalizeDoc(tenant.document));
    return user?.role === "tenant" ? { ...tenant, userId: user.id, rent: 850, active: true } : tenant;
  });

  const requiredPayments = [
    ...saved.listings.flatMap((listing) => ownerFeePayments(listing, MONTHS.slice(-3))),
    ...saved.tenants.filter((tenant) => tenant.userId && Number(tenant.rent) > 0)
      .flatMap((tenant) => rentPayments(tenant, monthSequence())),
  ];
  const existingPaymentIds = new Set(saved.payments.map((payment) => payment.id));
  saved.payments = [
    ...requiredPayments.filter((payment) => !existingPaymentIds.has(payment.id)),
    ...saved.payments,
  ];
  return saved;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = hydrate(JSON.parse(raw));
      if (isValidState(saved)) return saved;
    }
  } catch (error) {
    console.error("No se pudieron cargar los datos guardados.", error);
  }
  return initialState;
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      console.error("No se pudieron guardar los datos del portal.", error);
    }
  }, [state]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const next = hydrate(JSON.parse(e.newValue));
        if (isValidState(next)) dispatch({ type: "replace", state: next });
      } catch (error) {
        console.error("No se pudieron sincronizar los datos del portal.", error);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const actions = useMemo(
    () => ({
      pay: (paymentId, actorId, method, reference) =>
        dispatch({ type: "pay", paymentId, actorId, method, reference }),

      markPaid: (paymentId, actorId) => dispatch({ type: "markPaid", paymentId, actorId }),

      reserve: (reservation) => {
        const error = reserveError(stateRef.current, reservation);
        if (error) return { ok: false, error };
        dispatch({ type: "reserve", reservation: { ...reservation, id: `r${Date.now()}` } });
        return { ok: true };
      },

      cancelReservation: (id, actorId) => dispatch({ type: "cancelReservation", id, actorId }),

      addNotice: (notice, actorId) =>
        dispatch({ type: "addNotice", actorId, notice: { ...notice, id: `n${Date.now()}`, date: today() } }),

      remindDelinquents: (buildingId, actorId) => {
        const unitIds = overdueUnitIds(stateRef.current, buildingId);
        if (unitIds.length === 0) return { ok: false, error: "No hay unidades con cuotas vencidas en este edificio." };
        dispatch({
          type: "addNotice",
          actorId,
          notice: {
            id: `n${Date.now()}-${buildingId}`,
            buildingId,
            title: "Recordatorio de cuotas vencidas",
            body: "Tienes cuotas vencidas. Regulariza tu pago desde la sección Pagos del portal.",
            date: today(),
            authorId: actorId,
            targetUnitIds: unitIds,
          },
        });
        return { ok: true, count: unitIds.length };
      },

      remindDelinquentOwners: (actorId) => {
        const ownerIds = [...new Set(stateRef.current.payments
          .filter((payment) => payment.type === "ownerFee" && payment.status !== "paid" && payment.dueDate < today())
          .map((payment) => payment.ownerId)
          .filter((id) => stateRef.current.users.some((user) => user.id === id && user.role === "owner")))];
        if (!ownerIds.length) return { ok: false, error: "No hay propietarios con cuotas vencidas." };
        dispatch({ type: "remindDelinquentOwners", actorId, id: `n${Date.now()}` });
        return { ok: true, count: ownerIds.length };
      },

      updateProfile: (userId, changes) => dispatch({ type: "updateProfile", userId, changes }),

      registerUser: (data) => {
        const document = normalizeDoc(data.document);
        const taken = stateRef.current.users.some((u) =>
          u.email.toLowerCase() === data.email.toLowerCase() || normalizeDoc(u.document) === document
        );
        if (taken) return { ok: false, error: "Ya existe una cuenta con ese correo o cédula." };
        if (!["owner", "tenant"].includes(data.role)) return { ok: false, error: "El tipo de cuenta no es válido." };
        const { role, ...profile } = data;
        const user = { id: `u${Date.now()}`, role, ...profile };
        dispatch({ type: "register", user });
        return { ok: true, user };
      },

      addListing: (listing, actorId) => {
        const id = Date.now();
        dispatch({ type: "addListing", actorId, listing: { ...listing, id, ownerId: actorId } });
        return id;
      },
      deleteListing: (id, actorId) => dispatch({ type: "deleteListing", id, actorId }),
      toggleFavorite: (userId, propertyId) => dispatch({ type: "toggleFavorite", userId, propertyId }),

      addInquiry: (data) =>
        dispatch({ type: "addInquiry", inquiry: { ...data, id: `q${Date.now()}`, date: today(), read: false } }),
      setInquiryRead: (id, read, actorId) => dispatch({ type: "setInquiryRead", id, read, actorId }),
      deleteInquiry: (id, actorId) => dispatch({ type: "deleteInquiry", id, actorId }),

      addTenant: (tenant, actorId) => {
        const error = tenantError(stateRef.current, tenant, actorId);
        if (error) return { ok: false, error };
        dispatch({
          type: "addTenant",
          actorId,
          tenant: { ...tenant, id: `t${Date.now()}`, addedBy: actorId, date: today() },
        });
        return { ok: true };
      },
      removeTenant: (id, actorId) => dispatch({ type: "removeTenant", id, actorId }),
      removeTenantByDocument: (document, actorId) => {
        const doc = normalizeDoc(document);
        const tenant = stateRef.current.tenants.find((item) =>
          item.addedBy === actorId && normalizeDoc(item.document) === doc
        );
        if (!tenant) return { ok: false, error: "No se encontró un inquilino con esa cédula en tus inmuebles." };
        dispatch({ type: "removeTenant", id: tenant.id, actorId });
        return { ok: true, tenant };
      },

      deleteOwnerByDocument: (document, actorId) => {
        const actor = stateRef.current.users.find((user) => user.id === actorId);
        if (actor?.role !== "superadmin") return { ok: false, error: "Solo el superadministrador puede eliminar propietarios." };
        const owner = stateRef.current.users.find((user) =>
          user.role === "owner" && normalizeDoc(user.document) === normalizeDoc(document)
        );
        if (!owner) return { ok: false, error: "No existe un propietario con esa cédula." };
        dispatch({ type: "deleteOwnerByDocument", document, actorId });
        return { ok: true, owner };
      },

      addExpense: (expense, actorId) => {
        const normalized = { ...expense, amount: Number(expense.amount), id: `e${Date.now()}` };
        const error = expenseError(stateRef.current, normalized, actorId);
        if (error) return { ok: false, error };
        if (!expenseCategories.includes(normalized.category)) return { ok: false, error: "Elige una categoría válida." };
        dispatch({ type: "addExpense", expense: normalized, actorId });
        return { ok: true };
      },
      reset: () => dispatch({ type: "reset" }),
    }),
    []
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
