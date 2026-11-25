import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { paymentStatus, paymentsOf } from "../store/selectors";
import { StatusBadge } from "../ui";
import { formatDate, money, monthLabel } from "../utils";
import PaymentForm from "./PaymentForm";
import Receipt from "./Receipt";

export default function Pagos() {
  const { user } = useAuth();
  const { state } = useStore();
  const [selectedId, setSelectedId] = useState(null);
  const [receiptId, setReceiptId] = useState(null);
  const [notice, setNotice] = useState("");

  const payments = useMemo(
    () => [...paymentsOf(state, user)].sort((a, b) => b.month.localeCompare(a.month)),
    [state, user]
  );
  const selected = payments.find((p) => p.id === selectedId && p.status !== "paid");
  const receipt = payments.find((p) => p.id === receiptId && p.status === "paid");
  const heading = user.role === "tenant" ? "Mi renta mensual" : user.role === "owner" ? "Mi cuota mensual" : "Mis pagos";
  const description = user.role === "tenant"
    ? "Pagos de renta de tus alquileres activos. No se incluyen cuotas de condominio."
    : user.role === "owner"
      ? "Cuotas mensuales de condominio asociadas a tus inmuebles."
      : "Historial de cuotas de condominio de tu unidad.";

  const paymentConcept = (payment) => {
    if (payment.type === "rent") {
      const tenant = state.tenants.find((item) => item.id === payment.tenantId);
      return tenant?.type === "listing"
        ? state.listings.find((listing) => listing.id === tenant.targetId)?.title ?? "Renta mensual"
        : "Renta mensual";
    }
    if (payment.type === "ownerFee") {
      return state.listings.find((listing) => listing.id === payment.listingId)?.title ?? "Cuota mensual";
    }
    return `Cuota de condominio · ${state.units.find((unit) => unit.id === payment.unitId)?.label ?? "Unidad"}`;
  };

  return (
    <>
      <div className="page-head">
        <h1>{heading}</h1>
        <p className="muted">{description}</p>
      </div>

      {notice && <p className="success" role="status">{notice}</p>}

      {receipt && <Receipt key={receipt.id} payment={receipt} onClose={() => setReceiptId(null)} />}

      {selected && (
        <PaymentForm
          key={selected.id}
          payment={selected}
          onCancel={() => setSelectedId(null)}
          onDone={(id, text) => {
            setNotice(text);
            setReceiptId(id);
            setSelectedId(null);
          }}
        />
      )}

      <article className="glass panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Concepto</th><th>Mes</th><th>Monto</th><th>Vence</th><th>Estado</th><th>Detalle del pago</th><th />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{paymentConcept(p)}</td>
                  <td>{monthLabel(p.month, true)}</td>
                  <td>{money(p.amount)}</td>
                  <td>{formatDate(p.dueDate)}</td>
                  <td><StatusBadge status={paymentStatus(p)} /></td>
                  <td className="muted small">{p.status === "paid" ? `${formatDate(p.paidAt)} · ${p.reference}` : "—"}</td>
                  <td>
                    {p.status === "paid" ? (
                      <button
                        className="btn btn-glass btn-sm"
                        type="button"
                        onClick={() => {
                          setNotice("");
                          setSelectedId(null);
                          setReceiptId(p.id);
                        }}
                      >
                        Comprobante
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => {
                          setNotice("");
                          setReceiptId(null);
                          setSelectedId(p.id);
                        }}
                      >
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <p className="muted">
              {user.role === "tenant"
                ? "No tienes una renta activa. Pídele al propietario que te agregue con tu cédula."
                : user.role === "owner"
                  ? "Tus inmuebles no tienen una cuota mensual configurada."
                  : "No hay pagos para mostrar."}
            </p>
          )}
        </div>
      </article>
    </>
  );
}
