import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { listingsOf } from "../store/selectors";
import { money } from "../utils";

const normalizeDocument = (value) => value.replace(/[\s-]/g, "").toUpperCase();

export default function Propietarios() {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const [document, setDocument] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const owners = state.users.filter((candidate) => candidate.role === "owner");
  const selectedOwner = owners.find((owner) =>
    normalizeDocument(owner.document) === normalizeDocument(document)
  );
  const ownerListings = (ownerId) => state.listings.filter((listing) => listing.ownerId === ownerId);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!selectedOwner) {
      setError("No existe un propietario con esa cédula.");
      setConfirm(false);
      return;
    }
    if (!confirm) {
      setConfirm(true);
      return;
    }
    const result = actions.deleteOwnerByDocument(document, user.id);
    if (!result.ok) {
      setError(result.error);
      setConfirm(false);
      return;
    }
    setMessage(`Se eliminó la cuenta de ${result.owner.name} y sus anuncios y alquileres asociados.`);
    setDocument("");
    setConfirm(false);
  };

  return (
    <>
      <div className="page-head">
        <h1>Propietarios</h1>
        <p className="muted">Busca y elimina cuentas de propietario usando su cédula.</p>
      </div>

      <form className="glass panel" onSubmit={submit} noValidate>
        <h2>Eliminar propietario</h2>
        <label>
          Cédula del propietario
          <input
            value={document}
            onChange={(e) => {
              setDocument(e.target.value);
              setConfirm(false);
              setError("");
            }}
            placeholder="V-12345678"
          />
        </label>
        {selectedOwner && (
          <p className="muted small">
            Cuenta encontrada: <strong>{selectedOwner.name}</strong> · {ownerListings(selectedOwner.id).length} inmueble(s).
          </p>
        )}
        {confirm && selectedOwner && (
          <p className="notice bad" role="alert">
            Esta acción eliminará la cuenta, sus inmuebles, inquilinos y pagos asociados. No se puede deshacer.
          </p>
        )}
        {error && <p className="notice bad" role="alert">{error}</p>}
        {message && <p className="success" role="status">{message}</p>}
        <button className={`btn ${confirm ? "btn-primary danger" : "btn-glass"}`} type="submit">
          {confirm ? "Confirmar eliminación" : "Buscar por cédula"}
        </button>
      </form>

      <article className="glass panel">
        <h2>Cuentas de propietario</h2>
        {owners.length === 0 ? (
          <p className="muted">No hay propietarios registrados.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Propietario</th><th>Cédula</th><th>Correo</th><th>Inmuebles</th><th>Cuota mensual configurada</th></tr></thead>
              <tbody>
                {owners.map((owner) => {
                  const listings = listingsOf(state, owner);
                  const fee = listings.reduce((sum, listing) => sum + Number(listing.fee || 0), 0);
                  return (
                    <tr key={owner.id}>
                      <td>{owner.name}</td>
                      <td>{owner.document}</td>
                      <td>{owner.email}</td>
                      <td>{listings.length}</td>
                      <td>{money(fee)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </>
  );
}
