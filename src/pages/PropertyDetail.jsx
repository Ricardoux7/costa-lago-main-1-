import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buildings } from "../data";
import { FavoriteButton, Icon, PropertyCard, PropertyImage } from "../ui";
import { money } from "../utils";
import { useProperties } from "../store/useProperties";
import ContactForm from "../ContactForm";

function Thumb({ src, active, onPick }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <button type="button" className={active ? "thumb on" : "thumb"} onClick={onPick} aria-label="Ver esta foto">
      <img src={src} alt="" onError={() => setFailed(true)} />
    </button>
  );
}

export default function PropertyDetail() {
  const { id } = useParams();
  const all = useProperties();
  const [photo, setPhoto] = useState(0);
  const p = all.find((x) => x.id === Number(id));

  if (!p) {
    return (
      <section className="detail wrap">
        <h1>No encontramos esa propiedad</h1>
        <p className="muted">Puede que ya no esté disponible.</p>
        <Link className="btn btn-primary" to="/#propiedades">Ver todas las propiedades</Link>
      </section>
    );
  }

  const building = buildings.find((b) => b.id === p.buildingId);

  const similar = all
    .filter((x) => x.id !== p.id)
    .sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
    .slice(0, 3);

  const facts = [
    { icon: "bed", value: p.beds, label: "Habitaciones" },
    { icon: "bath", value: p.baths, label: "Baños" },
    { icon: "area", value: `${p.area} m²`, label: "Construcción" },
    { icon: "car", value: p.parking, label: "Puestos" },
    { icon: "calendar", value: p.year, label: "Año" },
  ];

  return (
    <section className="detail wrap">
      <Link to="/#propiedades" className="back">
        <Icon name="arrowLeft" /> Volver a propiedades
      </Link>

      <div className="detail-art">
        <PropertyImage key={`${p.id}-${photo}`} p={p} index={photo} />
        <span className="pill tag">{p.tag}</span>
      </div>
      {p.images?.length > 1 && (
        <div className="thumbs">
          {p.images.map((src, i) => (
            <Thumb key={src} src={src} active={i === photo} onPick={() => setPhoto(i)} />
          ))}
        </div>
      )}

      <div className="detail-head">
        <div>
          <h1>{p.title}</h1>
          <p className="zone"><Icon name="pin" size={15} /> {p.zone}, Maracaibo</p>
          {p.ownerId && <p className="owner-badge">Publicado directamente por su propietario</p>}
        </div>
        <div className="detail-price">
          <p className="price">{money(p.price)}</p>
          <FavoriteButton propertyId={p.id} label />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <ul className="facts">
            {facts.map((f) => (
              <li key={f.label} className="glass fact">
                <Icon name={f.icon} size={22} />
                <strong>{f.value}</strong>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>

          <div>
            <h2>Descripción</h2>
            <p className="muted desc">{p.description}</p>
          </div>

          {p.features?.length > 0 && (
            <div>
              <h2>Características</h2>
              <ul className="features">
                {p.features.map((f) => (
                  <li key={f}><Icon name="check" size={18} /> {f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass condo">
            <div>
              <h3>{building ? building.name : "Sin condominio"}</h3>
              <p className="muted small">
                {building
                  ? "Los residentes de este edificio gestionan sus pagos y reservas en el portal."
                  : "Esta propiedad no pertenece a un condominio administrado en la plataforma."}
              </p>
            </div>
            <div className="condo-fee">
              {p.fee > 0 && (
                <>
                  <strong>{money(p.fee)}</strong>
                  <span className="muted small"> / mes</span>
                </>
              )}
              {building && <Link className="btn btn-glass" to="/portal">Ir al portal</Link>}
            </div>
          </div>
        </div>

        <aside className="aside">
          <h3>Solicita información</h3>
          <p className="muted small">Déjanos tus datos y te contactamos sobre esta propiedad.</p>
          <ContactForm subject={p.title} propertyId={p.id} />
        </aside>
      </div>

      <div className="head similar-head">
        <h2>Propiedades similares</h2>
        <p className="muted">Cercanas en precio a esta propiedad.</p>
      </div>
      <div className="grid">
        {similar.map((s) => (
          <PropertyCard key={s.id} p={s} />
        ))}
      </div>
    </section>
  );
}
