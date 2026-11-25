import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { listingsOf } from "../store/selectors";
import { Icon, PropertyImage } from "../ui";
import { money } from "../utils";

const tenantNames = (state, listingId) =>
  state.tenants
    .filter((t) => t.type === "listing" && t.targetId === listingId)
    .map((t) => `Inquilino: ${t.name} (${t.document})`)
    .join(" · ");

export default function Inmuebles() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const [confirmId, setConfirmId] = useState(null);
  const mine = listingsOf(state, user);

  return (
    <>
      <div className="page-head">
        <h1>Mis inmuebles</h1>
        <p className="muted">Propiedades que publicaste. Aparecen en el catálogo público.</p>
      </div>

      <div className="actions">
        <Link className="btn btn-primary" to="/portal/inmuebles/nuevo">
          <Icon name="plus" size={16} />&nbsp;Publicar inmueble
        </Link>
      </div>

      {mine.length === 0 ? (
        <div className="glass panel empty">
          <h2>Todavía no publicaste inmuebles</h2>
          <p className="muted">Publica tu primera propiedad para que los visitantes puedan verla.</p>
        </div>
      ) : (
        <ul className="listing-list">
          {mine.map((l) => (
            <li key={l.id} className="glass listing-row">
              <div className="listing-thumb"><PropertyImage p={l} /></div>
              <div className="listing-info">
                <strong>{l.title}</strong>
                <span className="muted small">{l.zone}, Maracaibo · {l.beds} hab. · {l.baths} baños · {l.area} m²</span>
                <span className="muted small">
                  {tenantNames(state, l.id) || "Sin inquilino registrado"}
                </span>
                <span className="muted small">Cuota mensual: {money(l.fee)}</span>
                <span className="price">{money(l.price)}</span>
              </div>
              <div className="listing-actions">
                <Link className="btn btn-glass btn-sm" to={`/propiedad/${l.id}`}>Ver</Link>
                {confirmId === l.id ? (
                  <>
                    <button className="btn btn-primary btn-sm danger" type="button" onClick={() => { actions.deleteListing(l.id, user.id); setConfirmId(null); }}>
                      Confirmar
                    </button>
                    <button className="btn btn-glass btn-sm" type="button" onClick={() => setConfirmId(null)}>No</button>
                  </>
                ) : (
                  <button className="btn btn-glass btn-sm" type="button" onClick={() => setConfirmId(l.id)}>
                    <Icon name="trash" size={14} />&nbsp;Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
