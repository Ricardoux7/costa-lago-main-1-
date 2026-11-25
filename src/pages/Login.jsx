import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { roleLabel } from "../store/selectors";
import { patterns } from "../validators";
import { Avatar, Icon } from "../ui";

export default function Login() {
  const { user, login } = useAuth();
  const { state, actions } = useStore();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  if (user) return <Navigate to={location.state?.from ?? "/portal"} replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!patterns.email.test(email.trim())) next.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    if (!patterns.required.test(password)) next.password = "Escribe tu contraseña.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;
    const result = login(email, password);
    if (!result.ok) setFormError(result.error);
  };

  const fill = (u) => {
    setEmail(u.email);
    setPassword(u.password);
    setErrors({});
    setFormError("");
  };

  return (
    <section className="detail wrap auth">
      <form className="glass form auth-card" onSubmit={onSubmit} noValidate>
        <div>
          <h1>Portal del condominio</h1>
          <p className="muted">Ingresa para ver tus pagos, reservar áreas comunes o administrar tu edificio.</p>
        </div>
        {location.state?.notice && <p className="notice ok" role="status">{location.state.notice}</p>}
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="username"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
        </label>
        {formError && <p className="notice bad" role="alert">{formError}</p>}
        <button className="btn btn-primary full" type="submit">
          <Icon name="lock" size={16} />&nbsp;Iniciar sesión
        </button>
        <p className="muted small">
          ¿No tienes cuenta? <Link className="link-btn" to="/registro">Crear cuenta</Link>
        </p>
      </form>

      <aside className="glass panel demo">
        <h2>Cuentas de prueba</h2>
        <p className="muted small">
          Fase de maqueta: elige un usuario para llenar el formulario. Cada perfil ve datos distintos.
          Abre otra pestaña con otro usuario para probar sesiones concurrentes.
        </p>
        <ul className="demo-list">
          {state.users.map((u) => (
            <li key={u.id}>
              <Avatar name={u.name} size={38} />
              <div>
                <strong>{u.name}</strong>
                <span className="muted small">
                  {roleLabel(u)}{u.role === "resident" ? ` · unidad ${u.unitId.split("-")[1]}` : ""}
                </span>
              </div>
              <button className="btn btn-glass" type="button" onClick={() => fill(u)}>Usar</button>
            </li>
          ))}
        </ul>
        <button className="link-btn" type="button" onClick={actions.reset}>
          Restablecer datos de ejemplo
        </button>
      </aside>
    </section>
  );
}
