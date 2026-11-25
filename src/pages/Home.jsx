import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { kindLabel, priceRanges } from "../data";
import { FavoriteButton, Icon, PropertyCard, PropertyImage, Specs } from "../ui";
import { money } from "../utils";
import { useAuth } from "../auth/AuthContext";
import { useProperties } from "../store/useProperties";
import { filterProperties } from "../store/selectors";
import ContactForm from "../ContactForm";

const trust = [
  { icon: "shield", title: "Títulos verificados", text: "Revisamos documentos y registros antes de publicar." },
  { icon: "user", title: "Agentes certificados", text: "Asesores con trayectoria comprobable en Maracaibo." },
  { icon: "chart", title: "Cuentas transparentes", text: "Cuotas y gastos del condominio a la vista." },
  { icon: "clock", title: "Respuesta en 24 horas", text: "Seguimiento personal desde la primera consulta." },
];

const portalFeatures = [
  { icon: "chart", title: "Finanzas a la vista", text: "Dashboard con flujo de caja y morosidad calculados con los pagos reales del edificio." },
  { icon: "calendar", title: "Reservas sin cruces", text: "Elige piscina, salón o cancha en un plano interactivo y evita reservas duplicadas." },
  { icon: "card", title: "Pagos con validación", text: "Paga tu cuota por transferencia, pago móvil o tarjeta con datos verificados." },
  { icon: "bell", title: "Comunicación directa", text: "Avisos de la administración y recordatorios de cuotas vencidas." },
];

const tipos = [...new Set(Object.values(kindLabel))];

function HeroProperty({ p }) {
  return (
    <article className="glass hero-card">
      <div className="hero-art">
        <Link to={`/propiedad/${p.id}`} className="art-link" aria-label={`Ver ${p.title}`}>
          <PropertyImage p={p} />
        </Link>
        <span className="pill tag">{p.tag}</span>
        <FavoriteButton propertyId={p.id} />
      </div>
      <div className="hero-card-body">
        <div>
          <h3>{p.title}</h3>
          <p className="zone"><Icon name="pin" size={15} /> {p.zone}, Maracaibo</p>
        </div>
        <p className="price">{money(p.price)}</p>
      </div>
      <div className="hero-card-foot">
        <Specs p={p} />
        <Link className="btn btn-primary" to={`/propiedad/${p.id}`}>Ver propiedad</Link>
      </div>
    </article>
  );
}

function SearchForm({ zones, initial }) {
  const navigate = useNavigate();
  const [zona, setZona] = useState(initial.zona);
  const [tipo, setTipo] = useState(initial.tipo);
  const [precio, setPrecio] = useState(initial.precio);

  const submit = (e) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (zona) q.set("zona", zona);
    if (tipo) q.set("tipo", tipo);
    if (precio) q.set("precio", precio);
    const search = q.toString();
    navigate({ pathname: "/", search: search ? `?${search}` : "", hash: "#propiedades" });
  };

  return (
    <form className="glass search" onSubmit={submit}>
      <label>
        Zona
        <select value={zona} onChange={(e) => setZona(e.target.value)}>
          <option value="">Todas</option>
          {zones.map((z) => <option key={z}>{z}</option>)}
        </select>
      </label>
      <label>
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos</option>
          {tipos.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label>
        Presupuesto
        <select value={precio} onChange={(e) => setPrecio(e.target.value)}>
          <option value="">Cualquiera</option>
          {priceRanges.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </label>
      <button className="btn btn-primary" type="submit">Buscar</button>
    </form>
  );
}

function FeaturedListings({ list }) {
  const [main, ...side] = list;
  if (!main) return null;
  return (
    <div className="featured">
      <article className="glass feature">
        <div className="feature-art">
          <Link to={`/propiedad/${main.id}`} className="art-link" aria-label={`Ver ${main.title}`}>
            <PropertyImage p={main} />
          </Link>
          <span className="pill tag">{main.tag}</span>
          <FavoriteButton propertyId={main.id} />
        </div>
        <div className="feature-body">
          <p className="price">{money(main.price)}</p>
          <h3>{main.title}</h3>
          <p className="zone"><Icon name="pin" size={15} /> {main.zone}, Maracaibo</p>
          <p className="muted">{main.blurb}</p>
          <Specs p={main} />
          <div className="actions">
            <Link className="btn btn-primary" to={`/propiedad/${main.id}`}>Ver propiedad</Link>
            <a className="btn btn-glass" href="#contacto">Agendar visita</a>
          </div>
        </div>
      </article>

      <div className="side">
        {side.map((p) => (
          <Link key={p.id} to={`/propiedad/${p.id}`} className="glass mini">
            <div className="mini-art">
              <PropertyImage p={p} />
            </div>
            <div className="mini-body">
              <p className="price">{money(p.price)}</p>
              <h3>{p.title}</h3>
              <p className="zone"><Icon name="pin" size={15} /> {p.zone}</p>
              <p className="muted small">{p.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PortalTeaser() {
  const { user } = useAuth();
  return (
    <>
      <div className="teaser">
        {portalFeatures.map((f) => (
          <article key={f.title} className="glass tease">
            <span className="trust-icon"><Icon name={f.icon} size={20} /></span>
            <h3>{f.title}</h3>
            <p className="muted small">{f.text}</p>
          </article>
        ))}
      </div>
      <div className="actions">
        <Link className="btn btn-primary" to={user ? "/portal" : "/login"}>
          {user ? "Ir a mi portal" : "Ingresar al portal"}
        </Link>
        {!user && <Link className="btn btn-glass" to="/registro">Crear cuenta</Link>}
      </div>
    </>
  );
}

export default function Home() {
  const all = useProperties();
  const [params] = useSearchParams();
  const zona = params.get("zona") ?? "";
  const tipo = params.get("tipo") ?? "";
  const precio = params.get("precio") ?? "";
  const filtering = Boolean(zona || tipo || precio);

  const zones = useMemo(() => [...new Set(all.map((p) => p.zone))].sort((a, b) => a.localeCompare(b, "es")), [all]);
  const results = useMemo(() => filterProperties(all, { zona, tipo, precio }), [all, zona, tipo, precio]);
  const featured = useMemo(() => all.filter((p) => p.featured), [all]);
  const others = useMemo(() => all.filter((p) => !p.featured), [all]);
  const precioLabel = priceRanges.find((r) => r.value === precio)?.label;

  return (
    <>
      <section id="inicio" className="hero wrap">
        <div className="hero-copy">
          <h1>Residencias frente al lago, <span className="gold">con cuentas claras</span></h1>
          <p className="lead">
            Propiedades verificadas, agentes certificados y condominios donde cada
            propietario ve en qué se usa su cuota.
          </p>
          <SearchForm key={params.toString()} zones={zones} initial={{ zona, tipo, precio }} />
        </div>
        <HeroProperty p={all[0]} />
      </section>

      <section className="wrap">
        <ul className="glass trust">
          {trust.map((t) => (
            <li key={t.title}>
              <span className="trust-icon"><Icon name={t.icon} size={20} /></span>
              <div>
                <strong>{t.title}</strong>
                <p className="muted small">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="propiedades" className="section wrap">
        {filtering ? (
          <>
            <div className="head">
              <h2>Resultados de tu búsqueda</h2>
              <p className="muted">
                {results.length} {results.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
              </p>
              <div className="chips">
                {zona && <span className="chip">{zona}</span>}
                {tipo && <span className="chip">{tipo}</span>}
                {precioLabel && <span className="chip">{precioLabel}</span>}
                <Link className="chip clear" to="/#propiedades">Limpiar filtros</Link>
              </div>
            </div>
            {results.length === 0 ? (
              <div className="glass panel empty">
                <h3>No encontramos propiedades con esos filtros</h3>
                <p className="muted">Prueba con otra zona, otro tipo o un presupuesto distinto.</p>
                <Link className="btn btn-primary" to="/#propiedades">Ver todas las propiedades</Link>
              </div>
            ) : (
              <div className="grid">
                {results.map((p) => <PropertyCard key={p.id} p={p} />)}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="head">
              <h2>Anuncios destacados</h2>
              <p className="muted">Selección de nuestro equipo, con documentación al día.</p>
            </div>
            <FeaturedListings list={featured} />

            <div className="head spaced">
              <h2>Más propiedades disponibles</h2>
              <p className="muted">Toca una ficha para ver todos los detalles.</p>
            </div>
            <div className="grid">
              {others.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
          </>
        )}
      </section>

      <section id="condominios" className="section wrap band">
        <div className="head">
          <h2>Condominios con cuentas claras</h2>
          <p className="muted">
            Un portal para residentes y administradores: cuotas, reservas de
            áreas comunes y comunicados en un solo lugar.
          </p>
        </div>
        <PortalTeaser />
      </section>

      <section id="contacto" className="section wrap contact">
        <div className="contact-info">
          <h2>Conversemos sobre tu próximo hogar</h2>
          <p className="muted">
            Cuéntanos qué buscas y te enviaremos opciones que se ajusten a tu
            presupuesto y a tu estilo de vida.
          </p>
          <ul className="info">
            <li><Icon name="pin" /> Av. 5 de Julio, Maracaibo, Zulia</li>
            <li><Icon name="phone" /> +58 261 000 0000</li>
            <li><Icon name="mail" /> contacto@costalago.com</li>
            <li><Icon name="clock" /> Lunes a sábado, 8:00 a. m. a 6:00 p. m.</li>
          </ul>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
