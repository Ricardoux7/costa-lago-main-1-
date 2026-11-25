import { memo, useCallback, useMemo, useState } from "react";
import { MONTHS, buildings } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { buildingsOf, paymentStatus, paymentsOf } from "../store/selectors";
import { StatusBadge } from "../ui";
import { formatDate, money, monthLabel } from "../utils";

const PAGE = 15;

const Row = memo(function Row({ p, unit, onMarkPaid }) {
  const status = paymentStatus(p);
  return (
    <tr>
      <td>{unit?.label}<span className="muted small block">{buildings.find((b) => b.id === p.buildingId)?.name}</span></td>
      <td>{unit?.occupant}</td>
      <td>{monthLabel(p.month, true)}</td>
      <td>{money(p.amount)}</td>
      <td>{formatDate(p.dueDate)}</td>
      <td><StatusBadge status={status} /></td>
      <td>
        {status !== "paid" && (
          <button className="btn btn-glass btn-sm" type="button" onClick={() => onMarkPaid(p.id)}>Registrar pago</button>
        )}
      </td>
    </tr>
  );
});

export default function Cobranza() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const myBuildings = buildingsOf(state, user);
  const [buildingId, setBuildingId] = useState("all");
  const [status, setStatus] = useState("overdue");
  const [month, setMonth] = useState("all");
  const [limit, setLimit] = useState(PAGE);
  const [msg, setMsg] = useState(null);

  const unitMap = useMemo(() => new Map(state.units.map((u) => [u.id, u])), [state.units]);

  const rows = useMemo(() => {
    const ids = buildingId === "all" ? buildingsOf(state, user).map((b) => b.id) : [buildingId];
    return paymentsOf(state, user)
      .filter((p) => ids.includes(p.buildingId))
      .filter((p) => month === "all" || p.month === month)
      .filter((p) => status === "all" || paymentStatus(p) === status)
      .sort((a, b) => b.month.localeCompare(a.month) || a.unitId.localeCompare(b.unitId));
  }, [state, user, buildingId, status, month]);
  const ownerRows = useMemo(() => state.payments
    .filter((payment) => payment.type === "ownerFee" && paymentStatus(payment) === "overdue")
    .map((payment) => ({
      ...payment,
      owner: state.users.find((candidate) => candidate.id === payment.ownerId),
      listing: state.listings.find((candidate) => candidate.id === payment.listingId),
    }))
    .filter((payment) => payment.owner),
  [state.payments, state.users, state.listings]);

  const markPaid = useCallback((id) => actions.markPaid(id, user.id), [actions, user.id]);

  const remind = () => {
    const result = actions.remindDelinquentOwners(user.id);
    setMsg(result.ok
      ? { ok: true, text: `Aviso enviado a ${result.count} ${result.count === 1 ? "propietario moroso" : "propietarios morosos"}.` }
      : { ok: false, text: result.error });
  };

  const filter = (setter) => (e) => {
    setter(e.target.value);
    setLimit(PAGE);
  };

  return (
    <>
      <div className="page-head">
        <h1>Cobranza</h1>
        <p className="muted">Cuotas de tus edificios. Registrar un pago actualiza el dashboard al instante.</p>
      </div>

      <div className="toolbar">
        {myBuildings.length > 1 && (
          <label className="inline-select">
            Edificio
            <select value={buildingId} onChange={filter(setBuildingId)}>
              <option value="all">Todos</option>
              {myBuildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        )}
        <label className="inline-select">
          Estado
          <select value={status} onChange={filter(setStatus)}>
            <option value="overdue">Vencidas</option>
            <option value="pending">Por vencer</option>
            <option value="paid">Pagadas</option>
            <option value="all">Todas</option>
          </select>
        </label>
        <label className="inline-select">
          Mes
          <select value={month} onChange={filter(setMonth)}>
            <option value="all">Todos</option>
            {[...MONTHS].reverse().map((m) => <option key={m} value={m}>{monthLabel(m, true)}</option>)}
          </select>
        </label>
        <button className="btn btn-primary" type="button" onClick={remind}>Recordar propietarios morosos</button>
      </div>
      {msg && <p className={msg.ok ? "success" : "notice bad"} role="status">{msg.text}</p>}

      <article className="glass panel">
        <p className="muted small">{rows.length} {rows.length === 1 ? "cuota" : "cuotas"}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Unidad</th><th>Residente</th><th>Mes</th><th>Monto</th><th>Vence</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((p) => (
                <Row key={p.id} p={p} unit={unitMap.get(p.unitId)} onMarkPaid={markPaid} />
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="muted">No hay cuotas con estos filtros.</p>}
        {rows.length > limit && (
          <button className="btn btn-glass" type="button" onClick={() => setLimit((l) => l + PAGE)}>Ver mas</button>
        )}
      </article>

      <article className="glass panel">
        <h2>Propietarios con cuotas vencidas</h2>
        {ownerRows.length === 0 ? (
          <p className="muted">No hay propietarios con cuotas vencidas.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Propietario</th><th>Cédula</th><th>Inmueble</th><th>Mes</th><th>Monto vencido</th></tr></thead>
              <tbody>
                {ownerRows.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.owner.name}</td>
                    <td>{payment.owner.document}</td>
                    <td>{payment.listing?.title ?? "Inmueble eliminado"}</td>
                    <td>{monthLabel(payment.month, true)}</td>
                    <td>{money(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </>
  );
}
