import { memo } from "react";
import { monthLabel } from "./utils";

const W = 640;
const H = 260;
const PAD = { l: 44, r: 10, t: 14, b: 30 };
const innerW = W - PAD.l - PAD.r;
const innerH = H - PAD.t - PAD.b;

const fmtTick = (v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : `${v}`);

export const CashFlowChart = memo(function CashFlowChart({ rows, active, onActive }) {
  const maxVal = Math.max(1, ...rows.flatMap((r) => [r.collected, r.spent, r.net]));
  const top = Math.ceil(maxVal / 1000) * 1000;
  const bottom = Math.min(0, ...rows.map((r) => r.net));
  const y = (v) => PAD.t + innerH * (1 - (v - bottom) / (top - bottom));
  const gw = innerW / rows.length;
  const bw = Math.min(18, gw * 0.32);
  const cx = (i) => PAD.l + gw * i + gw / 2;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(bottom + (top - bottom) * t));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ch" role="img" aria-label="Flujo de caja mensual: ingresos, gastos y saldo neto">
      {ticks.map((t) => (
        <g key={t}>
          <line className="ch-grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
          <text className="ch-axis" x={PAD.l - 8} y={y(t) + 4} textAnchor="end">{fmtTick(t)}</text>
        </g>
      ))}
      {rows.map((r, i) => (
        <g
          key={r.month}
          className="ch-col"
          tabIndex={0}
          onMouseEnter={() => onActive(i)}
          onFocus={() => onActive(i)}
          aria-label={`${monthLabel(r.month, true)}: ingresos ${r.collected}, gastos ${r.spent}`}
        >
          <rect className={i === active ? "ch-hit on" : "ch-hit"} x={cx(i) - gw / 2} y={PAD.t} width={gw} height={innerH} rx="6" />
          <rect className="b-in" x={cx(i) - bw - 1} y={y(r.collected)} width={bw} height={y(0) - y(r.collected)} rx="3" />
          <rect className="b-out" x={cx(i) + 1} y={y(r.spent)} width={bw} height={y(0) - y(r.spent)} rx="3" />
          <text className="ch-axis" x={cx(i)} y={H - 8} textAnchor="middle">{monthLabel(r.month)}</text>
        </g>
      ))}
      <polyline className="net-line" points={rows.map((r, i) => `${cx(i)},${y(r.net)}`).join(" ")} />
      {rows.map((r, i) => (
        <circle key={r.month} className="net-dot" cx={cx(i)} cy={y(r.net)} r={i === active ? 5 : 3} />
      ))}
    </svg>
  );
});

export const DelinquencyChart = memo(function DelinquencyChart({ rows }) {
  const top = Math.max(5, Math.ceil(Math.max(...rows.map((r) => r.delinquency)) / 5) * 5);
  const n = rows.length;
  const x = (i) => PAD.l + (n > 1 ? (innerW * i) / (n - 1) : innerW / 2);
  const y = (v) => PAD.t + innerH * (1 - v / top);
  const pts = rows.map((r, i) => `${x(i)},${y(r.delinquency)}`).join(" ");
  const ticks = [0, 0.5, 1].map((t) => Math.round(top * t));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ch" role="img" aria-label="Porcentaje de morosidad por mes">
      {ticks.map((t) => (
        <g key={t}>
          <line className="ch-grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
          <text className="ch-axis" x={PAD.l - 8} y={y(t) + 4} textAnchor="end">{t}%</text>
        </g>
      ))}
      <polygon className="del-area" points={`${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`} />
      <polyline className="del-line" points={pts} />
      {rows.map((r, i) => (
        <g key={r.month}>
          <circle className="del-dot" cx={x(i)} cy={y(r.delinquency)} r="3.5" />
          <text className="ch-axis" x={x(i)} y={H - 8} textAnchor="middle">{monthLabel(r.month)}</text>
        </g>
      ))}
    </svg>
  );
});

const R = 52;
const C = 2 * Math.PI * R;

export const Donut = memo(function Donut({ segments, centerValue, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const arcs = segments.map((s, i) => ({
    ...s,
    len: (s.value / total) * C,
    start: segments.slice(0, i).reduce((acc, x) => acc + (x.value / total) * C, 0),
  }));
  return (
    <svg viewBox="0 0 140 140" className="donut" role="img" aria-label="Unidades según meses de atraso">
      <circle className="donut-bg" cx="70" cy="70" r={R} fill="none" strokeWidth="18" />
      {arcs.map((a) => (
        <circle
          key={a.label}
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={a.color}
          strokeWidth="18"
          strokeDasharray={`${a.len} ${C - a.len}`}
          strokeDashoffset={-a.start}
          transform="rotate(-90 70 70)"
        />
      ))}
      <text className="donut-num" x="70" y="72" textAnchor="middle">{centerValue}</text>
      <text className="donut-cap" x="70" y="88" textAnchor="middle">{centerLabel}</text>
    </svg>
  );
});
