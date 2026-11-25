import { Link, useParams } from "react-router-dom";
import { buildings, properties } from "../data";
import { Icon, PropertyArt, PropertyCard } from "../ui";
import { money } from "../utils";
import ContactForm from "../ContactForm";

export default function PropertyDetail() {
  const { id } = useParams();
  const p = properties.find((x) => x.id === Number(id));

  if (!p) {
    return (
      <section className="detail wrap">
        <h1>No encontramos esa propiedad</h1>
        <p className="muted">Puede que ya no este disponible.</p>
        <Link className="btn btn-primary" to="/#propiedades">Ver todas las propiedades</Link>
      </section>
    );
  }

  const building = buildings.find((b) => b.id === p.buildingId);

  const similar = properties
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
        <PropertyArt palette={p.palette} kind={p.kind} />
        <span className="pill tag">{p.tag}</span>
      </div>

      <div className="detail-head">
        <div>
          <h1>{p.title}</h1>
          <p className="zone"><Icon name="pin" size={15} /> {p.zone}, Maracaibo</p>
        </div>
        <p className="price">{money(p.price)}</p>
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

          <div>
            <h2>Caracteristicas</h2>
            <ul className="features">
              {p.features.map((f) => (
                <li key={f}><Icon name="check" size={18} /> {f}</li>
              ))}
            </ul>
          </div>

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
              <strong>{money(p.fee)}</strong>
              <span className="muted small"> / mes</span>
              {building && <Link className="btn btn-glass" to="/portal">Ir al portal</Link>}
            </div>
          </div>
        </div>

        <aside className="aside">
          <h3>Solicita información</h3>
          <p className="muted small">Dejanos tus datos y te contactamos sobre esta propiedad.</p>
          <ContactForm subject={p.title} />
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
