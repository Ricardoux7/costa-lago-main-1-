import { createPortal } from "react-dom";
import { buildings, methodLabels } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { unitOf } from "../store/selectors";
import { formatDate, money, monthLabel } from "../utils";

function Sheet({ rows, amount, number }) {
  return (
    <div className="receipt-sheet">
      <header>
        <div>
          <span className="receipt-brand">Costa Lago Residencias</span>
          <p className="small">Gestión inmobiliaria y condominios</p>
        </div>
        <div className="receipt-title">
          <strong>Comprobante de pago</strong>
          <span className="small">Nº {number}</span>
        </div>
      </header>
      <dl className="receipt-rows">
        {rows.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      <p className="receipt-total"><span>Monto pagado</span><strong>{money(amount)}</strong></p>
      <p className="receipt-note">
        Documento generado por el sistema.
      </p>
    </div>
  );
}

export default function Receipt({ payment, onClose }) {
  const { user } = useAuth();
  const { state } = useStore();
  const unit = state.units.find((item) => item.id === (payment.unitId ?? user.unitId)) ?? unitOf(state, user);
  const building = buildings.find((b) => b.id === (unit?.buildingId ?? payment.buildingId));
  const listing = state.listings.find((item) => item.id === payment.listingId);
  const number = `CL-${payment.id.replace(/^p-/, "").toUpperCase()}`;
  const concept = payment.type === "rent"
    ? `Renta mensual, ${monthLabel(payment.month, true)}`
    : payment.type === "ownerFee"
      ? `Cuota mensual, ${monthLabel(payment.month, true)}`
      : `Cuota de condominio, ${monthLabel(payment.month, true)}`;

  const rows = [
    ["Fecha de pago", formatDate(payment.paidAt)],
    [user.role === "tenant" ? "Inquilino" : user.role === "owner" ? "Propietario" : "Residente", user.name],
    ["Cédula o RIF", user.document],
    ["Edificio", building?.name ?? "—"],
    ["Unidad o inmueble", listing?.title ?? unit?.label ?? "—"],
    ["Concepto", concept],
    ["Método de pago", methodLabels[payment.method] ?? "—"],
    ["Referencia", payment.reference ?? "—"],
    ["Estado", "Pagado"],
  ];

  return (
    <>
      <section className="glass receipt-view" aria-label="Comprobante de pago">
        <div className="receipt-paper">
          <Sheet rows={rows} amount={payment.amount} number={number} />
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={() => window.print()}>Imprimir comprobante</button>
          <button className="btn btn-glass" type="button" onClick={onClose}>Cerrar</button>
        </div>
      </section>
      {createPortal(
        <div className="print-root"><Sheet rows={rows} amount={payment.amount} number={number} /></div>,
        document.body
      )}
    </>
  );
}
