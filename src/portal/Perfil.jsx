import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { buildingsOf, listingsOf, roleLabel, unitOf } from "../store/selectors";
import { Avatar } from "../ui";
import { patterns } from "../validators";

const rules = {
  name: [patterns.name, "Escribe tu nombre completo (solo letras)."],
  phone: [patterns.phone, "Ejemplo: 0424-1234567 o +58 424 1234567."],
  email: [patterns.email, "Escribe un correo válido, por ejemplo nombre@correo.com."],
};

export default function Perfil() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const [values, setValues] = useState({ name: user.name, phone: user.phone, email: user.email });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const isAdmin = user.role === "admin";
  const isResident = user.role === "resident";
  const unit = isResident ? unitOf(state, user) : null;
  const buildingNames = buildingsOf(state, user).map((b) => b.name).join(", ");

  const change = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    Object.entries(rules).forEach(([field, [re, msg]]) => {
      if (!re.test(values[field].trim())) next[field] = msg;
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    actions.updateProfile(user.id, { name: values.name.trim(), phone: values.phone.trim(), email: values.email.trim() });
    setSaved(true);
  };

  const field = (name, label, type = "text") => (
    <label>
      {label}
      <input name={name} type={type} value={values[name]} onChange={change} aria-invalid={Boolean(errors[name])} />
      {errors[name] && <span className="field-error" role="alert">{errors[name]}</span>}
    </label>
  );

  return (
    <>
      <div className="page-head">
        <h1>Mi perfil</h1>
        <p className="muted">Tus datos y tu rol dentro de la plataforma.</p>
      </div>

      <div className="two-col">
        <article className="glass panel profile-card">
          <Avatar name={user.name} size={72} />
          <h2>{user.name}</h2>
          <span className="role-tag">{roleLabel(user)}</span>
          <dl className="info-list">
            <div><dt>Cédula o RIF</dt><dd>{user.document}</dd></div>
            <div><dt>Rol</dt><dd>{isAdmin ? "Administrador de condominios" : isResident ? "Residente" : roleLabel(user)}</dd></div>
            {buildingNames && <div><dt>{isAdmin ? "Edificios a cargo" : "Edificio"}</dt><dd>{buildingNames}</dd></div>}
            {isResident && <div><dt>Unidad</dt><dd>{unit?.label ?? "—"}</dd></div>}
            {user.role === "owner" && <div><dt>Inmuebles publicados</dt><dd>{listingsOf(state, user).length}</dd></div>}
          </dl>
        </article>

        <form className="glass panel" onSubmit={submit} noValidate>
          <h2>Editar datos de contacto</h2>
          {field("name", "Nombre completo")}
          {field("phone", "Teléfono", "tel")}
          {field("email", "Correo electrónico", "email")}
          <button className="btn btn-primary" type="submit">Guardar cambios</button>
          {saved && <p className="success" role="status">Datos actualizados.</p>}
        </form>
      </div>
    </>
  );
}
