import { useState } from "react";
import { Link } from "react-router-dom";
import { buildings } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { activeTenantsOf, buildingsOf, noticesOf } from "../store/selectors";
import { patterns } from "../validators";
import { formatDate } from "../utils";

export default function Avisos() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const isAdmin = user.role === "admin";
  const isSuperAdmin = user.role === "superadmin";
  const isOwner = user.role === "owner";
  const myBuildings = isAdmin ? buildingsOf(state, user) : [];
  const recipients = isSuperAdmin
    ? state.users.filter((candidate) => candidate.role === "owner")
    : isOwner
      ? activeTenantsOf(state, user).map((tenant) => state.users.find((candidate) => candidate.id === tenant.userId)).filter(Boolean)
      : [];
  const notices = noticesOf(state, user);

  const [buildingId, setBuildingId] = useState(myBuildings[0]?.id ?? "");
  const [recipientId, setRecipientId] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!patterns.title.test(title.trim())) next.title = "El título debe tener entre 4 y 80 caracteres.";
    if (!patterns.message.test(body.trim())) next.body = "El mensaje debe tener entre 10 y 500 caracteres.";
    if (isAdmin && !myBuildings.some((building) => building.id === buildingId)) next.buildingId = "Elige un edificio a tu cargo.";
    if ((isSuperAdmin || isOwner) && recipients.length === 0) next.recipients = "No hay destinatarios disponibles.";
    if (recipientId !== "all" && !recipients.some((recipient) => recipient.id === recipientId)) {
      next.recipients = "El destinatario seleccionado ya no está disponible.";
    }
    setErrors(next);
    setSent(false);
    if (Object.keys(next).length) return;

    const recipientIds = isSuperAdmin || isOwner
      ? recipientId === "all" ? recipients.map((recipient) => recipient.id) : [recipientId]
      : [];
    actions.addNotice({
      ...(isAdmin ? { buildingId, targetUnitIds: null } : {}),
      ...(isSuperAdmin ? { targetRole: "owner" } : {}),
      ...(isOwner ? { targetRole: "tenant" } : {}),
      recipientIds,
      title: title.trim(),
      body: body.trim(),
      authorId: user.id,
    }, user.id);
    setTitle("");
    setBody("");
    setSent(true);
  };

  const heading = isAdmin ? "Comunicados" : "Avisos";
  const description = isAdmin
    ? "Publica comunicados para los residentes de tus edificios."
    : isSuperAdmin
      ? "Envía avisos únicamente a cuentas de propietario."
      : isOwner
        ? "Envía avisos a los inquilinos asociados a tus inmuebles."
        : "Avisos que te enviaron el administrador o el propietario de tu alquiler.";

  return (
    <>
      <div className="page-head">
        <h1>{heading}</h1>
        <p className="muted">{description}</p>
      </div>

      {(isAdmin || isSuperAdmin || isOwner) && (
        <form className="glass panel" onSubmit={submit} noValidate>
          <h2>{isAdmin ? "Nuevo comunicado" : "Enviar aviso"}</h2>
          {isAdmin ? (
            <label>
              Edificio
              <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} aria-invalid={Boolean(errors.buildingId)}>
                {myBuildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
              </select>
              {errors.buildingId && <span className="field-error" role="alert">{errors.buildingId}</span>}
            </label>
          ) : (
            <label>
              {isSuperAdmin ? "Destinatarios" : "Inquilino"}
              <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} aria-invalid={Boolean(errors.recipients)}>
                <option value="all">{isSuperAdmin ? "Todos los propietarios" : "Todos mis inquilinos"}</option>
                {recipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>{recipient.name}</option>
                ))}
              </select>
              {errors.recipients && <span className="field-error" role="alert">{errors.recipients}</span>}
            </label>
          )}
          <label>
            Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: Aviso importante" aria-invalid={Boolean(errors.title)} />
            {errors.title && <span className="field-error" role="alert">{errors.title}</span>}
          </label>
          <label>
            Mensaje
            <textarea rows="3" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe el aviso" aria-invalid={Boolean(errors.body)} />
            {errors.body && <span className="field-error" role="alert">{errors.body}</span>}
          </label>
          <button className="btn btn-primary" type="submit">
            {isAdmin ? "Publicar comunicado" : "Enviar aviso"}
          </button>
          {sent && <p className="success" role="status">Aviso enviado dentro del portal.</p>}
          {isOwner && recipients.length === 0 && (
            <p className="muted small">
              Para recibir avisos en el portal, tus inquilinos deben crear una cuenta de inquilino y ser agregados con su cédula.
              {" "}<Link to="/portal/inquilinos">Gestionar inquilinos</Link>
            </p>
          )}
          {isSuperAdmin && recipients.length === 0 && <p className="muted small">Aún no hay cuentas de propietario registradas.</p>}
        </form>
      )}

      <article className="glass panel">
        <h2>{isAdmin ? "Comunicados publicados" : "Avisos recientes"}</h2>
        {notices.length === 0 && <p className="muted">No hay avisos por ahora.</p>}
        <ul className="notice-list">
          {notices.map((notice) => (
            <li key={notice.id}>
              <div className="notice-top">
                <strong>{notice.title}</strong>
                <span className="muted small">{formatDate(notice.date)}</span>
              </div>
              {(isAdmin || isSuperAdmin || isOwner) && (
                <span className="muted small">
                  {isAdmin
                    ? buildings.find((building) => building.id === notice.buildingId)?.name
                    : isSuperAdmin
                      ? `Propietarios destinatarios: ${notice.recipientIds?.length ?? 0}`
                      : `Inquilinos destinatarios: ${notice.recipientIds?.length ?? 0}`}
                </span>
              )}
              <p className="muted">{notice.body}</p>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
