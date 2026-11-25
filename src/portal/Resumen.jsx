import { Link } from "react-router-dom";
import { areas, buildings } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { noticesOf, paymentStatus, paymentsOf, reservationsOf, unitOf } from "../store/selectors";
import { Icon, StatusBadge } from "../ui";
import { formatDate, money, monthLabel, today } from "../utils";

export default function Resumen() {
  const { user } = useAuth();
  const { state } = useStore();

  const unit = unitOf(state, user);
  const building = buildings.find((b) => b.id === unit.buildingId);
  const payments = paymentsOf(state, user);
  const latest = payments.reduce((a, b) => (b.month > a.month ? b : a), payments[0]);
  const overdue = payments.filter((p) => paymentStatus(p) === "overdue");
  const debt = overdue.reduce((s, p) => s + p.amount, 0);
  const next = reservationsOf(state, user)
    .filter((r) => r.unitId === user.unitId && r.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const notices = noticesOf(state, user).slice(0, 3);

  return (
    <>
      <div className="page-head">
        <h1>Hola, {user.name.split(" ")[0]}</h1>
        <p className="muted">Este es el resumen de tu unidad.</p>
      </div>

      <div className="cards">
        <article className="glass stat">
          <span className="label">Mi unidad</span>
          <strong className="big">{unit.label}</strong>
          <span className="muted small">{building.name} · {user.tenure}</span>
        </article>
        <article className="glass stat">
          <span className="label">Cuota de {monthLabel(latest.month, true)}</span>
          <strong className="big">{money(latest.amount)}</strong>
          <span><StatusBadge status={paymentStatus(latest)} /></span>
          {latest.status !== "paid" && <span className="muted small">Vence el {formatDate(latest.dueDate)}</span>}
        </article>
        <article className="glass stat">
          <span className="label">Deuda vencida</span>
          <strong className={debt ? "big bad-text" : "big"}>{debt ? money(debt) : "Al dia"}</strong>
          <span className="muted small">
            {debt ? `${overdue.length} ${overdue.length === 1 ? "cuota vencida" : "cuotas vencidas"}` : "Sin cuotas vencidas"}
          </span>
        </article>
        <article className="glass stat">
          <span className="label">Próxima reserva</span>
          {next ? (
            <>
              <strong className="big small-big">{areas.find((a) => a.id === next.areaId)?.name}</strong>
              <span className="muted small">{formatDate(next.date)} · {next.slot.split(" (")[0]}</span>
            </>
          ) : (
            <>
              <strong className="big small-big">Sin reservas</strong>
              <span className="muted small">Reserva un area común</span>
            </>
          )}
        </article>
      </div>

      <div className="actions">
        <Link className="btn btn-primary" to="/portal/pagos"><Icon name="card" size={16} />&nbsp;Pagar cuota</Link>
        <Link className="btn btn-glass" to="/portal/reservas"><Icon name="calendar" size={16} />&nbsp;Reservar un area</Link>
      </div>

      <article className="glass panel">
        <h2>Avisos de la administración</h2>
        {notices.length === 0 && <p className="muted">No hay avisos por ahora.</p>}
        <ul className="notice-list">
          {notices.map((n) => (
            <li key={n.id}>
              <div className="notice-top"><strong>{n.title}</strong><span className="muted small">{formatDate(n.date)}</span></div>
              <p className="muted">{n.body}</p>
            </li>
          ))}
        </ul>
        <Link className="back" to="/portal/avisos">Ver todos los avisos</Link>
      </article>
    </>
  );
}
