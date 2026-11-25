import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { patterns } from "../validators";
import { Icon } from "../ui";

const fields = [
  { name: "name", label: "Nombre completo", placeholder: "María Pérez", rule: patterns.name, msg: "Escribe tu nombre completo (solo letras)." },
  { name: "document", label: "Cédula o RIF", placeholder: "V-12345678", rule: patterns.document, msg: "Usa el formato V-12345678 o J-12345678-9." },
  { name: "phone", label: "Teléfono", type: "tel", placeholder: "0424-1234567", rule: patterns.phone, msg: "Ejemplo: 0424-1234567 o +58 424 1234567." },
  { name: "email", label: "Correo electrónico", type: "email", placeholder: "tucorreo@ejemplo.com", rule: patterns.email, msg: "Escribe un correo válido, por ejemplo nombre@correo.com." },
  { name: "password", label: "Contraseña", type: "password", placeholder: "Mínimo 8 caracteres", rule: patterns.password, msg: "Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo." },
];

const empty = { role: "owner", name: "", document: "", phone: "", email: "", password: "", confirm: "" };

export default function Register() {
  const { user, register } = useAuth();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  if (user) return <Navigate to="/portal" replace />;

  const validate = (name, value, all = values) => {
    if (name === "confirm") return value === all.password && value ? "" : "Las contraseñas no coinciden.";
    const f = fields.find((x) => x.name === name);
    return f.rule.test(value.trim()) ? "" : f.msg;
  };

  const change = (e) => {
    const { name, value } = e.target;
    const next = { ...values, [name]: value };
    setValues(next);
    if (errors[name]) setErrors((er) => ({ ...er, [name]: validate(name, value, next) }));
    setFormError("");
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    [...fields.map((f) => f.name), "confirm"].forEach((n) => {
      const msg = validate(n, values[n]);
      if (msg) next[n] = msg;
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    const result = register({
      name: values.name.trim(),
      document: values.document.trim().toUpperCase(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role,
    });
    if (!result.ok) setFormError(result.error);
  };

  const input = (f) => (
    <label key={f.name}>
      {f.label}
      <input
        name={f.name}
        type={f.type ?? "text"}
        value={values[f.name]}
        placeholder={f.placeholder}
        onChange={change}
        autoComplete={f.name === "password" ? "new-password" : "off"}
        aria-invalid={Boolean(errors[f.name])}
      />
      {errors[f.name] && <span className="field-error" role="alert">{errors[f.name]}</span>}
    </label>
  );

  return (
    <section className="detail wrap auth">
      <form className="glass form auth-card" onSubmit={submit} noValidate>
        <div>
          <h1>Crear cuenta</h1>
          <p className="muted">
            Regístrate como propietario para publicar inmuebles o como inquilino para pagar tu renta mensual.
          </p>
        </div>
        <label>
          Tipo de cuenta
          <select name="role" value={values.role} onChange={change}>
            <option value="owner">Propietario</option>
            <option value="tenant">Inquilino</option>
          </select>
        </label>
        <div className="row">{input(fields[0])}{input(fields[1])}</div>
        <div className="row">{input(fields[2])}{input(fields[3])}</div>
        <div className="row">
          {input(fields[4])}
          <label>
            Confirmar contraseña
            <input
              name="confirm"
              type="password"
              value={values.confirm}
              onChange={change}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirm)}
            />
            {errors.confirm && <span className="field-error" role="alert">{errors.confirm}</span>}
          </label>
        </div>
        {formError && <p className="notice bad" role="alert">{formError}</p>}
        <button className="btn btn-primary full" type="submit">
          <Icon name="user" size={16} />&nbsp;Crear mi cuenta
        </button>
        <p className="muted small">
          ¿Ya tienes cuenta? <Link className="link-btn" to="/login">Iniciar sesión</Link>
        </p>
      </form>

      <aside className="glass panel demo">
        <h2>¿Eres residente o administrador?</h2>
        <p className="muted">
          Las cuentas de residentes y administradores las asigna la administración del condominio,
          porque van ligadas a una unidad o a un edificio. Si ya tienes una, inicia sesión.
        </p>
        <Link className="btn btn-glass" to="/login">Ir a iniciar sesión</Link>
      </aside>
    </section>
  );
}
