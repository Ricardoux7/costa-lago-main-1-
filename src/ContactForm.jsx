import { useState } from "react";
import { useStore } from "./store/StoreContext";
import { patterns } from "./validators";

const rules = {
  name: [patterns.name, "Escribe tu nombre completo (solo letras)."],
  document: [patterns.document, "Usa el formato V-12345678 o J-12345678-9."],
  phone: [patterns.phone, "Ejemplo: 0424-1234567 o +58 424 1234567."],
  email: [patterns.email, "Escribe un correo válido, por ejemplo nombre@correo.com."],
  message: [patterns.message, "El mensaje debe tener entre 10 y 500 caracteres."],
};

const check = (field, value) => (rules[field][0].test(value.trim()) ? "" : rules[field][1]);

const interests = {
  comprar: "Comprar una propiedad",
  visita: "Agendar una visita",
  vender: "Vender mi propiedad",
  condominio: "Administración de condominios",
};

export default function ContactForm({ subject, propertyId }) {
  const { actions } = useStore();
  const initial = {
    name: "",
    document: "",
    phone: "",
    email: "",
    interest: "comprar",
    message: subject ? `Hola, me interesa ${subject}.` : "",
    website: "",
  };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: check(name, value) }));
    setSent(false);
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    if (rules[name]) setErrors((er) => ({ ...er, [name]: check(name, value) }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const next = {};
    Object.keys(rules).forEach((f) => {
      const msg = check(f, values[f]);
      if (msg) next[f] = msg;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!values.website) {
      actions.addInquiry({
        propertyId: propertyId ?? null,
        subject: subject ?? null,
        interest: subject ?? interests[values.interest],
        name: values.name.trim(),
        document: values.document.trim().toUpperCase(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      });
    }
    setSent(true);
    setValues(initial);
  };

  const input = (name, label, props = {}) => (
    <label>
      {label}
      <input
        name={name}
        value={values[name]}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(errors[name])}
        {...props}
      />
      {errors[name] && <span className="field-error" role="alert">{errors[name]}</span>}
    </label>
  );

  return (
    <form className="glass form" onSubmit={onSubmit} noValidate>
      <div className="row">
        {input("name", "Nombre completo", { type: "text", placeholder: "María Pérez" })}
        {input("document", "Cédula o RIF", { type: "text", placeholder: "V-12345678" })}
      </div>
      <div className="row">
        {input("phone", "Teléfono", { type: "tel", placeholder: "0424-1234567" })}
        {input("email", "Correo electrónico", { type: "email", placeholder: "tucorreo@ejemplo.com" })}
      </div>
      {!subject && (
        <label>
          Me interesa
          <select name="interest" value={values.interest} onChange={onChange}>
            {Object.entries(interests).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
      )}
      <label>
        Mensaje
        <textarea
          name="message"
          rows="4"
          value={values.message}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(errors.message)}
          placeholder="Cuéntanos qué estás buscando"
        />
        {errors.message && <span className="field-error" role="alert">{errors.message}</span>}
      </label>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={values.website} onChange={onChange} />
      <button className="btn btn-primary full" type="submit">Enviar consulta</button>
      {sent ? (
        <p className="success" role="status">¡Gracias! Recibimos tu consulta y un asesor te responderá pronto.</p>
      ) : (
        <p className="muted small">Un asesor te responderá en menos de 24 horas.</p>
      )}
    </form>
  );
}
