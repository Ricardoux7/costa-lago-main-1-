import { useState } from "react";
import { banks } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { luhn, notExpired, patterns } from "../validators";
import { monthLabel, money } from "../utils";

const bank = { name: "bank", label: "Banco", type: "select", rule: patterns.required, msg: "Elige un banco." };
const idField = {
  name: "document", label: "Cédula o RIF del titular", placeholder: "V-12345678",
  rule: patterns.document, msg: "Usa el formato V-12345678 o J-12345678-9.",
};

const methods = {
  transfer: {
    label: "Transferencia",
    fields: [
      bank,
      { name: "reference", label: "Número de referencia", placeholder: "00123456", rule: patterns.bankReference, msg: "La referencia debe tener entre 6 y 12 dígitos." },
      idField,
    ],
  },
  mobile: {
    label: "Pago móvil",
    fields: [
      bank,
      { name: "phone", label: "Teléfono del pagador", placeholder: "0424-1234567", rule: patterns.phone, msg: "Ejemplo: 0424-1234567 o +58 424 1234567." },
      idField,
      { name: "reference", label: "Referencia", placeholder: "123456", rule: patterns.mobileReference, msg: "La referencia debe tener entre 4 y 8 dígitos." },
    ],
  },
  card: {
    label: "Tarjeta",
    fields: [
      { name: "holder", label: "Titular de la tarjeta", placeholder: "María Pérez", rule: patterns.name, msg: "Escribe el nombre como aparece en la tarjeta." },
      { name: "number", label: "Número de tarjeta", placeholder: "4242 4242 4242 4242", rule: patterns.cardNumber, check: luhn, msg: "El número de tarjeta no es válido." },
      { name: "expiry", label: "Vencimiento (MM/AA)", placeholder: "08/28", rule: patterns.cardExpiry, check: notExpired, msg: "Usa MM/AA con una fecha que no haya vencido." },
      { name: "cvv", label: "CVV", placeholder: "123", type: "password", rule: patterns.cvv, msg: "El CVV tiene 3 o 4 dígitos." },
    ],
  },
};

const isValid = (f, value) => f.rule.test(value.trim()) && (!f.check || f.check(value.trim()));

const referenceOf = (method, values) =>
  method === "card"
    ? `Tarjeta •••• ${values.number.replace(/\D/g, "").slice(-4)}`
    : `${methods[method].label} ${values.reference}`;

export default function PaymentForm({ payment, onDone, onCancel }) {
  const { user } = useAuth();
  const { actions } = useStore();
  const [method, setMethod] = useState("transfer");
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  const fields = methods[method].fields;
  const paymentType = payment.type === "rent" ? "renta" : payment.type === "ownerFee" ? "cuota mensual" : "cuota de condominio";

  const change = (f, value) => {
    setValues((v) => ({ ...v, [f.name]: value }));
    if (errors[f.name]) setErrors((er) => ({ ...er, [f.name]: isValid(f, value) ? "" : f.msg }));
  };

  const pick = (m) => {
    setMethod(m);
    setValues({});
    setErrors({});
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    fields.forEach((f) => {
      if (!isValid(f, values[f.name] ?? "")) next[f.name] = f.msg;
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    actions.pay(payment.id, user.id, method, referenceOf(method, values));
    onDone(payment.id, `Pago de ${money(payment.amount)} registrado (${monthLabel(payment.month, true)}).`);
  };

  return (
    <form className="glass panel pay-form" onSubmit={submit} noValidate>
      <div className="pay-head">
        <h2>Pagar {paymentType} de {monthLabel(payment.month, true)}</h2>
        <strong className="big">{money(payment.amount)}</strong>
      </div>

      <div className="seg" role="tablist" aria-label="Método de pago">
        {Object.entries(methods).map(([key, m]) => (
          <button key={key} type="button" role="tab" aria-selected={method === key} className={method === key ? "on" : ""} onClick={() => pick(key)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="row pay-grid">
        {fields.map((f) => (
          <label key={f.name}>
            {f.label}
            {f.type === "select" ? (
              <select value={values[f.name] ?? ""} onChange={(e) => change(f, e.target.value)} aria-invalid={Boolean(errors[f.name])}>
                <option value="">Selecciona…</option>
                {banks.map((b) => <option key={b}>{b}</option>)}
              </select>
            ) : (
              <input
                type={f.type ?? "text"}
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                autoComplete="off"
                onChange={(e) => change(f, e.target.value)}
                aria-invalid={Boolean(errors[f.name])}
              />
            )}
            {errors[f.name] && <span className="field-error" role="alert">{errors[f.name]}</span>}
          </label>
        ))}
      </div>

      <div className="actions">
        <button className="btn btn-primary" type="submit">Confirmar pago</button>
        <button className="btn btn-glass" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
