import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { buildings } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { activeTenantsOf, canManageTenants, listingsOf, unitOf } from "../store/selectors";
import { Icon } from "../ui";
import { patterns } from "../validators";
import { formatDate, money } from "../utils";

export default function Inquilinos() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [rent, setRent] = useState("");
  const [targetId, setTargetId] = useState("");
  const [removeDocument, setRemoveDocument] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [added, setAdded] = useState("");
  const [removed, setRemoved] = useState("");

  if (!canManageTenants(user)) return <Navigate to="/portal" replace />;

  const isListingOwner = user.role === "owner";
  const myListings = listingsOf(state, user);
  const unit = unitOf(state, user);
  const buildingName = buildings.find((building) => building.id === unit?.buildingId)?.name;
  const mine = activeTenantsOf(state, user);
  const tenantAccount = state.users.find((candidate) =>
    candidate.role === "tenant" && candidate.document.replace(/[\s-]/g, "").toUpperCase() === document.replace(/[\s-]/g, "").toUpperCase()
  );
  const placeOf = (tenant) => {
    if (tenant.type !== "listing") return `Unidad ${unit?.label} · ${buildingName}`;
    return state.listings.find((listing) => listing.id === tenant.targetId)?.title ?? "Inmueble eliminado";
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!patterns.name.test((tenantAccount?.name ?? name).trim())) next.name = "Escribe el nombre del inquilino (solo letras).";
    if (!patterns.tenantDocument.test(document.trim())) next.document = "Usa el formato V-12345678 o E-12345678.";
    if (!/^\d+(\.\d{1,2})?$/.test(rent) || Number(rent) <= 0) next.rent = "Indica una renta mensual mayor que cero.";
    if (isListingOwner && !targetId) next.target = "Elige el inmueble.";
    setErrors(next);
    setFormError("");
    setAdded("");
    if (Object.keys(next).length) return;

    const result = actions.addTenant({
      type: isListingOwner ? "listing" : "unit",
      targetId: isListingOwner ? Number(targetId) : user.unitId,
      document: document.trim().toUpperCase(),
      name: tenantAccount?.name ?? name.trim(),
      rent: Number(rent),
    }, user.id);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setAdded(`${tenantAccount?.name ?? name.trim()} fue agregado como inquilino.`);
    setName("");
    setDocument("");
    setRent("");
  };

  const submitRemove = (e) => {
    e.preventDefault();
    if (!patterns.tenantDocument.test(removeDocument.trim())) {
      setRemoveError("Usa el formato V-12345678 o E-12345678 para quitar un inquilino.");
      return;
    }
    if (!confirmRemove) {
      const exists = mine.some((tenant) =>
        tenant.document.replace(/[\s-]/g, "").toUpperCase() === removeDocument.replace(/[\s-]/g, "").toUpperCase()
      );
      if (!exists) {
        setRemoveError("No se encontró un inquilino con esa cédula en tus inmuebles.");
        return;
      }
      setRemoveError("");
      setConfirmRemove(true);
      return;
    }
    const result = actions.removeTenantByDocument(removeDocument.trim(), user.id);
    if (!result.ok) {
      setRemoveError(result.error);
      setConfirmRemove(false);
      return;
    }
    setRemoved(`${result.tenant.name} fue eliminado de tus inquilinos.`);
    setRemoveDocument("");
    setConfirmRemove(false);
    setRemoveError("");
  };

  return (
    <>
      <div className="page-head">
        <h1>Inquilinos</h1>
        <p className="muted">Agrega o quita inquilinos por cédula y registra el monto de su renta mensual.</p>
      </div>

      {isListingOwner && myListings.length === 0 ? (
        <div className="glass panel empty">
          <h2>Primero publica un inmueble</h2>
          <p className="muted">Los inquilinos se registran sobre uno de tus inmuebles.</p>
          <Link className="btn btn-primary" to="/portal/inmuebles/nuevo">Publicar inmueble</Link>
        </div>
      ) : (
        <form className="glass panel" onSubmit={submit} noValidate>
          <h2>Agregar inquilino por cédula</h2>
          <div className="row">
            <label>
              Nombre completo
              <input
                value={tenantAccount?.name ?? name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Carlos Rivas"
                disabled={Boolean(tenantAccount)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
            </label>
            <label>
              Cédula del inquilino
              <input
                value={document}
                onChange={(e) => {
                  setDocument(e.target.value);
                  setName("");
                }}
                placeholder="V-12345678"
                aria-invalid={Boolean(errors.document)}
              />
              {errors.document && <span className="field-error" role="alert">{errors.document}</span>}
              {document && tenantAccount && <span className="muted small">Cuenta encontrada: {tenantAccount.name}</span>}
              {document && !tenantAccount && <span className="muted small">Se vinculará automáticamente cuando el inquilino cree su cuenta con esta cédula.</span>}
            </label>
            <label>
              Renta mensual (USD)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                placeholder="850"
                aria-invalid={Boolean(errors.rent)}
              />
              {errors.rent && <span className="field-error" role="alert">{errors.rent}</span>}
            </label>
          </div>
          {isListingOwner ? (
            <label>
              Inmueble
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} aria-invalid={Boolean(errors.target)}>
                <option value="">Selecciona un inmueble…</option>
                {myListings.map((listing) => <option key={listing.id} value={listing.id}>{listing.title}</option>)}
              </select>
              {errors.target && <span className="field-error" role="alert">{errors.target}</span>}
            </label>
          ) : (
            <p className="muted small"><Icon name="building" size={15} /> Se registrará en tu unidad: {unit?.label} · {buildingName}</p>
          )}
          {formError && <p className="notice bad" role="alert">{formError}</p>}
          {added && <p className="success" role="status">{added}</p>}
          <button className="btn btn-primary" type="submit"><Icon name="plus" size={16} />&nbsp;Agregar inquilino</button>
          <p className="muted small">Si aún no tiene cuenta, puede registrarse por separado como Inquilino usando esta misma cédula para activar sus pagos y avisos.</p>
        </form>
      )}

      <form className="glass panel" onSubmit={submitRemove} noValidate>
        <h2>Quitar inquilino por cédula</h2>
        <div className="row">
          <label>
            Cédula del inquilino
            <input
              value={removeDocument}
              onChange={(e) => {
                setRemoveDocument(e.target.value);
                setConfirmRemove(false);
                setRemoveError("");
              }}
              placeholder="V-12345678"
            />
          </label>
          {confirmRemove && <p className="notice bad" role="alert">Confirma que quieres quitar a este inquilino y cancelar sus rentas futuras.</p>}
        </div>
        {removeError && <p className="notice bad" role="alert">{removeError}</p>}
        {removed && <p className="success" role="status">{removed}</p>}
        <button className={`btn ${confirmRemove ? "btn-primary danger" : "btn-glass"}`} type="submit">
          {confirmRemove ? "Confirmar eliminación" : "Buscar y quitar"}
        </button>
      </form>

      <article className="glass panel">
        <h2>Inquilinos registrados</h2>
        {mine.length === 0 ? (
          <p className="muted">Todavía no has registrado inquilinos.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Inquilino</th><th>Cédula</th><th>Inmueble</th><th>Renta mensual</th><th>Registrado</th><th /></tr>
              </thead>
              <tbody>
                {mine.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>{tenant.name}</td>
                    <td>{tenant.document}</td>
                    <td>{placeOf(tenant)}</td>
                    <td>{money(tenant.rent)}</td>
                    <td>{formatDate(tenant.date)}</td>
                    <td>
                      <button
                        className="btn btn-glass btn-sm"
                        type="button"
                        onClick={() => {
                          setRemoveDocument(tenant.document);
                          setConfirmRemove(true);
                          setRemoveError("");
                        }}
                      >
                        Quitar por cédula
                      </button>
                    </td>
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
