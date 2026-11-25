import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { useProperties } from "../store/useProperties";
import { PropertyCard } from "../ui";

export default function Favoritos() {
  const { user } = useAuth();
  const { state } = useStore();
  const all = useProperties();
  const ids = state.favorites?.[user.id] ?? [];
  const saved = all.filter((p) => ids.includes(p.id));

  return (
    <>
      <div className="page-head">
        <h1>Mis favoritos</h1>
        <p className="muted">Las propiedades que guardaste con el corazón.</p>
      </div>

      {saved.length === 0 ? (
        <div className="glass panel empty">
          <h2>Aún no guardaste ninguna propiedad</h2>
          <p className="muted">Toca el corazón de una ficha para guardarla aquí.</p>
          <Link className="btn btn-primary" to="/#propiedades">Ver propiedades</Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {saved.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}
