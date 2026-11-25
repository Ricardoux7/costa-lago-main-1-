import { useState } from "react";
import { areas, slots } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { buildingsOf, reservationsOf } from "../store/selectors";
import { addDays, formatDate, today } from "../utils";

function AreaMap({ buildingAreas, stateOf, selectedId, onPick }) {
  return (
    <svg viewBox="0 0 360 220" className="plan" role="group" aria-label="Plano de áreas comunes. Selecciona un área para reservarla">
      {buildingAreas.map((a) => {
        const st = stateOf(a);
        return (
          <g
            key={a.id}
            className="zone-g"
            role="button"
            tabIndex={0}
            aria-pressed={selectedId === a.id}
            aria-label={`${a.name}, ${st === "free" ? "disponible" : st === "mine" ? "reservada por tu unidad" : "reservada"} en este turno`}
            onClick={() => onPick(a.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick(a.id);
              }
            }}
          >
            <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="14" className={`zone-rect ${st}${selectedId === a.id ? " selected" : ""}`} />
            <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 4} textAnchor="middle" className="zone-text">{a.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Reservas() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const isResident = user.role === "resident";
  const myBuildings = buildingsOf(state, user);

  const [buildingId, setBuildingId] = useState(myBuildings[0].id);
  const [areaId, setAreaId] = useState(null);
  const [date, setDate] = useState(() => addDays(today(), 2));
  const [slot, setSlot] = useState(slots[2]);
  const [msg, setMsg] = useState(null);
  const [unitSel, setUnitSel] = useState("");

  const buildingAreas = areas.filter((a) => a.buildingId === buildingId);
  const buildingUnits = state.units.filter((u) => u.buildingId === buildingId);
  const reservations = reservationsOf(state, user).filter((r) => r.buildingId === buildingId);
  const area = buildingAreas.find((a) => a.id === areaId);

  const reservationAt = (a) => reservations.find((r) => r.areaId === a.id && r.date === date && r.slot === slot);
  const stateOf = (a) => {
    const r = reservationAt(a);
    if (!r) return "free";
    return r.unitId === user.unitId ? "mine" : "reserved";
  };

  const upcoming = reservations
    .filter((r) => r.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date) || slots.indexOf(a.slot) - slots.indexOf(b.slot))
    .slice(0, 12);

  const unitLabel = (id) => state.units.find((u) => u.id === id)?.label;
  const areaName = (id) => areas.find((a) => a.id === id)?.name;

  const reset = () => setMsg(null);

  const reserve = (e) => {
    e.preventDefault();
    if (!area) return setMsg({ ok: false, text: "Primero elige un área en el plano." });
    const unitId = isResident ? user.unitId : unitSel;
    if (!unitId) return setMsg({ ok: false, text: "Elige la unidad a nombre de la cual se hace la reserva." });
    const result = actions.reserve({ buildingId, areaId: area.id, date, slot, userId: user.id, unitId });
    setMsg(
      result.ok
        ? { ok: true, text: `Reserva confirmada: ${area.name}, ${formatDate(date)}, ${slot}.` }
        : { ok: false, text: result.error }
    );
  };

  return (
    <>
      <div className="page-head">
        <h1>Reserva de áreas comunes</h1>
        <p className="muted">
          {isResident
            ? "Elige fecha y turno, y toca un área del plano."
            : "Reserva a nombre de una unidad o gestiona las reservas de tus edificios."}
        </p>
      </div>

      {myBuildings.length > 1 && (
        <label className="inline-select">
          Edificio
          <select value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setAreaId(null); setUnitSel(""); reset(); }}>
            {myBuildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      )}

      <div className="two-col">
        <article className="glass panel">
          <AreaMap buildingAreas={buildingAreas} stateOf={stateOf} selectedId={areaId} onPick={(id) => { setAreaId(id); reset(); }} />
          <div className="legend">
            <span><i className="sw" style={{ border: "1.5px solid #0077B6" }} /> Disponible</span>
            <span><i className="sw" style={{ background: "#FFB703" }} /> Reservada</span>
            {isResident && <span><i className="sw" style={{ background: "#0077B6" }} /> Tu reserva</span>}
          </div>

          <form className="reserve" onSubmit={reserve}>
            <div className="row">
              <label>
                Fecha
                <input type="date" value={date} onChange={(e) => { setDate(e.target.value); reset(); }} />
              </label>
              <label>
                Turno
                <select value={slot} onChange={(e) => { setSlot(e.target.value); reset(); }}>
                  {slots.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            {!isResident && (
              <label>
                Unidad
                <select value={unitSel} onChange={(e) => { setUnitSel(e.target.value); reset(); }}>
                  <option value="">Selecciona la unidad…</option>
                  {buildingUnits.map((u) => <option key={u.id} value={u.id}>{u.label} · {u.occupant}</option>)}
                </select>
              </label>
            )}
            <p className="selected-info">
              {area
                ? `${area.name} · ${area.capacity} · ${stateOf(area) === "free" ? "Disponible" : "Reservada"} en este turno`
                : "Toca un área del plano para seleccionarla."}
            </p>
            <button className="btn btn-primary full" type="submit">Reservar área</button>
            {msg && <p className={msg.ok ? "notice ok" : "notice bad"} role="status">{msg.text}</p>}
          </form>
        </article>

        <article className="glass panel">
          <h2>Próximas reservas del edificio</h2>
          {upcoming.length === 0 && <p className="muted">No hay reservas próximas.</p>}
          <ul className="res-list">
            {upcoming.map((r) => {
              const mine = r.unitId === user.unitId;
              const canCancel = mine || user.role === "admin";
              return (
                <li key={r.id}>
                  <div>
                    <strong>{areaName(r.areaId)}</strong>
                    <span className="muted small">{formatDate(r.date)} · {r.slot}</span>
                    <span className="muted small">Unidad {unitLabel(r.unitId)} {mine && <em className="mine-tag">Tuya</em>}</span>
                  </div>
                  {canCancel && (
                    <button className="btn btn-glass btn-sm" type="button" onClick={() => actions.cancelReservation(r.id, user.id)}>
                      Cancelar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      </div>
    </>
  );
}
