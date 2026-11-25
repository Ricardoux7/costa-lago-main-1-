import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { inquiriesOf } from "../store/selectors";
import { Icon } from "../ui";
import { formatDate } from "../utils";

export default function Consultas() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);

  const all = inquiriesOf(state, user);
  const unread = all.filter((q) => !q.read).length;
  const list = filter === "unread" ? all.filter((q) => !q.read) : all;

  return (
    <>
      <div className="page-head">
        <h1>Consultas</h1>
        <p className="muted">Mensajes enviados desde los formularios de contacto de la página.</p>
      </div>

      <div className="seg" role="group" aria-label="Filtrar consultas">
        <button type="button" className={filter === "all" ? "on" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          Todas ({all.length})
        </button>
        <button type="button" className={filter === "unread" ? "on" : ""} aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>
          Sin leer ({unread})
        </button>
      </div>

      {list.length === 0 && (
        <div className="glass panel empty">
          <h2>{filter === "unread" ? "No tienes consultas sin leer" : "Aún no hay consultas"}</h2>
          <p className="muted">Cuando alguien envíe el formulario de contacto, aparecerá aquí.</p>
        </div>
      )}

      <ul className="inbox">
        {list.map((q) => (
          <li key={q.id} className={q.read ? "glass inquiry" : "glass inquiry unread"}>
            <div className="inquiry-top">
              <strong>{q.name}</strong>
              <span className="muted small">{formatDate(q.date)}</span>
            </div>
            <span className="chip">{q.interest}</span>
            <p>{q.message}</p>
            <p className="muted small">
              <Icon name="phone" size={14} /> {q.phone} · <Icon name="mail" size={14} /> {q.email} · Cédula o RIF {q.document}
            </p>
            <div className="actions">
              <a
                className="btn btn-glass btn-sm"
                href={`mailto:${q.email}?subject=${encodeURIComponent(`Re: ${q.interest}`)}`}
              >
                Responder por correo
              </a>
              <button className="btn btn-glass btn-sm" type="button" onClick={() => actions.setInquiryRead(q.id, !q.read, user.id)}>
                {q.read ? "Marcar como no leída" : "Marcar como leída"}
              </button>
              {confirmId === q.id ? (
                <>
                  <button
                    className="btn btn-primary btn-sm danger"
                    type="button"
                    onClick={() => {
                      actions.deleteInquiry(q.id, user.id);
                      setConfirmId(null);
                    }}
                  >
                    Confirmar
                  </button>
                  <button className="btn btn-glass btn-sm" type="button" onClick={() => setConfirmId(null)}>No</button>
                </>
              ) : (
                <button className="btn btn-glass btn-sm" type="button" onClick={() => setConfirmId(q.id)}>
                  <Icon name="trash" size={14} />&nbsp;Eliminar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
