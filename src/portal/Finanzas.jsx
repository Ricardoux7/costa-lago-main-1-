import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { expenseCategories, MONTHS, buildings } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { buildFinance, buildingsOf, delinquencyBreakdown, expensesOf, paymentsOf, unitsOf } from "../store/selectors";
import { CashFlowChart, DelinquencyChart, Donut } from "../charts";
import { money, monthLabel, today } from "../utils";

const RANGES = [3, 6, 12];

export default function Finanzas() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const myBuildings = buildingsOf(state, user);
  const [buildingId, setBuildingId] = useState("all");
  const [range, setRange] = useState(6);
  const [active, setActive] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    buildingId: myBuildings[0]?.id ?? "",
    month: today().slice(0, 7),
    category: expenseCategories[0],
    amount: "",
  });
  const [expenseError, setExpenseError] = useState("");
  const [expenseSaved, setExpenseSaved] = useState("");

  const data = useMemo(() => {
    const ids = buildingId === "all" ? buildingsOf(state, user).map((b) => b.id) : [buildingId];
    const payments = paymentsOf(state, user).filter((p) => ids.includes(p.buildingId));
    const expenses = expensesOf(state, user).filter((e) => ids.includes(e.buildingId));
    const units = unitsOf(state, user).filter((u) => ids.includes(u.buildingId));
    return {
      ...buildFinance(payments, expenses, MONTHS.slice(-range)),
      ...delinquencyBreakdown(payments, units),
    };
  }, [state, user, buildingId, range]);

  const { rows, totals, byCategory, morosos, segments, unitCount } = data;
  const lastIdx = rows.length - 1;
  const current = rows[Math.min(active ?? lastIdx, lastIdx)];
  const maxCat = Math.max(1, ...byCategory.map((c) => c.amount));
  const enMora = unitCount - segments[0].value;
  const expenseRows = useMemo(() => {
    const ids = buildingId === "all" ? myBuildings.map((building) => building.id) : [buildingId];
    const months = new Set(MONTHS.slice(-range));
    months.add(today().slice(0, 7));
    return expensesOf(state, user)
      .filter((expense) => ids.includes(expense.buildingId) && months.has(expense.month))
      .sort((a, b) => b.month.localeCompare(a.month) || a.category.localeCompare(b.category));
  }, [state, user, buildingId, range, myBuildings]);

  const addExpense = (e) => {
    e.preventDefault();
    setExpenseError("");
    setExpenseSaved("");
    const result = actions.addExpense(expenseForm, user.id);
    if (!result.ok) {
      setExpenseError(result.error);
      return;
    }
    setExpenseSaved("El gasto fue agregado y actualizado en las finanzas.");
    setExpenseForm((form) => ({ ...form, amount: "" }));
  };

  return (
    <>
      <div className="page-head">
        <h1>Finanzas</h1>
        <p className="muted">Flujo de caja y morosidad de tus edificios, calculados con los pagos registrados.</p>
      </div>

      <div className="toolbar">
        {myBuildings.length > 1 && (
          <label className="inline-select">
            Edificio
            <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
              <option value="all">Todos mis edificios</option>
              {myBuildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        )}
        <div className="seg" role="group" aria-label="Periodo">
          {RANGES.map((r) => (
            <button key={r} type="button" className={range === r ? "on" : ""} aria-pressed={range === r} onClick={() => setRange(r)}>
              {r} meses
            </button>
          ))}
        </div>
      </div>

      <div className="cards">
        <article className="glass stat"><span className="label">Ingresos cobrados</span><strong className="big">{money(totals.collected)}</strong><span className="muted small">de {money(totals.billed)} facturados</span></article>
        <article className="glass stat"><span className="label">Gastos</span><strong className="big">{money(totals.spent)}</strong><span className="muted small">en {range} meses</span></article>
        <article className="glass stat"><span className="label">Saldo neto</span><strong className={totals.net < 0 ? "big bad-text" : "big ok-text"}>{money(totals.net)}</strong><span className="muted small">ingresos menos gastos</span></article>
        <article className="glass stat"><span className="label">Morosidad</span><strong className="big bad-text">{totals.delinquency.toFixed(1)}%</strong><span className="muted small">{money(totals.overdue)} vencidos</span></article>
      </div>

      <div className="dash-grid">
        <article className="glass panel">
          <h2>Flujo de caja</h2>
          <CashFlowChart rows={rows} active={Math.min(active ?? lastIdx, lastIdx)} onActive={setActive} />
          <div className="legend">
            <span><i className="sw" style={{ background: "#0077B6" }} /> Ingresos</span>
            <span><i className="sw" style={{ background: "#FFB703" }} /> Gastos</span>
            <span><i className="sw" style={{ background: "#1B1F3B" }} /> Saldo neto</span>
          </div>
          <p className="readout">
            <strong>{monthLabel(current.month, true)}:</strong> ingresos {money(current.collected)} · gastos {money(current.spent)} · saldo{" "}
            <strong className={current.net < 0 ? "bad-text" : "ok-text"}>{money(current.net)}</strong>
          </p>
        </article>

        <article className="glass panel">
          <h2>Morosidad por mes</h2>
          <p className="muted small">Porcentaje de lo facturado que sigue vencido</p>
          <DelinquencyChart rows={rows} />
        </article>
      </div>

      <div className="dash-grid three">
        <article className="glass panel">
          <h2>Unidades por situación</h2>
          <Donut segments={segments} centerValue={enMora} centerLabel="en mora" />
          <ul className="legend col">
            {segments.map((s) => (
              <li key={s.label}><i className="sw" style={{ background: s.color }} /> {s.label} <strong>{s.value}</strong></li>
            ))}
          </ul>
        </article>

        <article className="glass panel">
          <h2>Gastos por categoria</h2>
          <ul className="cats">
            {byCategory.map((c) => (
              <li key={c.category}>
                <span>{c.category}</span>
                <span className="track"><span className="fill" style={{ width: `${(c.amount / maxCat) * 100}%` }} /></span>
                <strong>{money(c.amount)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass panel">
          <h2>Mayores deudas</h2>
          {morosos.length === 0 ? (
            <p className="muted">No hay unidades con cuotas vencidas.</p>
          ) : (
            <table>
              <thead><tr><th>Unidad</th><th>Residente</th><th>Meses</th><th>Deuda</th></tr></thead>
              <tbody>
                {morosos.slice(0, 5).map((m) => (
                  <tr key={m.unitId}>
                    <td>{m.label}<span className="muted small block">{buildings.find((b) => b.id === m.buildingId)?.name}</span></td>
                    <td>{m.occupant}</td>
                    <td>{m.months}</td>
                    <td><strong>{money(m.amount)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link className="back" to="/portal/cobranza">Ir a cobranza</Link>
        </article>
      </div>

      <form className="glass panel" onSubmit={addExpense} noValidate>
        <h2>Registrar gasto</h2>
        <p className="muted small">El nuevo gasto se reflejará en los gráficos y en la tabla de este administrador.</p>
        <div className="row">
          <label>
            Edificio
            <select
              value={expenseForm.buildingId}
              onChange={(e) => setExpenseForm((form) => ({ ...form, buildingId: e.target.value }))}
            >
              {myBuildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
            </select>
          </label>
          <label>
            Categoría
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm((form) => ({ ...form, category: e.target.value }))}
            >
              {expenseCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>
            Mes
            <select
              value={expenseForm.month}
              onChange={(e) => setExpenseForm((form) => ({ ...form, month: e.target.value }))}
            >
              {[...new Set([...MONTHS, today().slice(0, 7)])].map((month) => (
                <option key={month} value={month}>{monthLabel(month, true)}</option>
              ))}
            </select>
          </label>
          <label>
            Monto (USD)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm((form) => ({ ...form, amount: e.target.value }))}
              placeholder="250"
            />
          </label>
        </div>
        {expenseError && <p className="notice bad" role="alert">{expenseError}</p>}
        {expenseSaved && <p className="success" role="status">{expenseSaved}</p>}
        <button className="btn btn-primary" type="submit">Agregar gasto</button>
      </form>

      <article className="glass panel">
        <h2>Tabla de gastos</h2>
        {expenseRows.length === 0 ? (
          <p className="muted">No hay gastos registrados en el periodo seleccionado.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Mes</th><th>Edificio</th><th>Categoría</th><th>Monto</th></tr></thead>
              <tbody>
                {expenseRows.map((expense) => (
                  <tr key={expense.id}>
                    <td>{monthLabel(expense.month, true)}</td>
                    <td>{buildings.find((building) => building.id === expense.buildingId)?.name}</td>
                    <td>{expense.category}</td>
                    <td>{money(expense.amount)}</td>
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
