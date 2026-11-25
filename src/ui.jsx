import { memo, useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { useStore } from "./store/StoreContext";
import { initials, money } from "./utils";

const paths = {
  bed: "M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3",
  bath: "M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
  area: "M4 4h16v16H4zM4 10h6M10 4v6",
  car: "M5 16h14l-1.5-5.5A2 2 0 0 0 15.6 9H8.4a2 2 0 0 0-1.9 1.5L5 16zM5 16v3M19 16v3M8 13h.01M16 13h.01",
  calendar: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  mail: "M3 6h18v12H3zM3 7l9 7 9-7",
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  bell: "M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  logout: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
  building: "M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3M3 21h18",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
};

export function Icon({ name, size = 18, filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Costa Lago Residencias, inicio">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#FFD60A" />
        <path d="M5 22c4-3 7-3 11 0s7 3 11 0" stroke="#0B1F3A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M10 17v-6l6-4 6 4v6" stroke="#0B1F3A" strokeWidth="2" fill="none" strokeLinejoin="round" />
      </svg>
      <span>Costa<b>Lago</b></span>
    </Link>
  );
}

const buildings = {
  torre: [[30, 70, 55, 100], [95, 35, 65, 135], [170, 80, 50, 90], [228, 60, 45, 110]],
  penthouse: [[60, 45, 120, 125], [190, 95, 60, 75]],
  casa: [[50, 105, 130, 65], [190, 120, 60, 50]],
};

export function PropertyArt({ palette, kind }) {
  const id = useId().replace(/:/g, "");
  const [sky1, sky2, ink] = palette;
  return (
    <svg
      className="art"
      viewBox="0 0 300 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Ilustración de la propiedad"
    >
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky2} />
          <stop offset="1" stopColor={sky1} />
        </linearGradient>
      </defs>
      <rect width="300" height="200" fill={`url(#sky${id})`} />
      <circle cx="232" cy="62" r="26" fill="#fff" opacity=".35" />
      <rect y="168" width="300" height="32" fill={ink} opacity=".55" />
      {buildings[kind].map(([x, y, w, h]) => (
        <g key={x}>
          <rect x={x} y={y} width={w} height={h} rx="3" fill={ink} opacity=".92" />
          {Array.from({ length: Math.floor(h / 16) - 1 }).flatMap((_, r) =>
            Array.from({ length: Math.floor(w / 14) - 1 }).map((__, c) => (
              <rect
                key={`${r}-${c}`}
                x={x + 7 + c * 14}
                y={y + 9 + r * 16}
                width="7"
                height="9"
                rx="1.5"
                fill={(c * 3 + r * 5 + x) % 4 ? "#F6D28E" : "#fff"}
                opacity={(c * 3 + r * 5 + x) % 4 ? 0.7 : 0.14}
              />
            ))
          )}
        </g>
      ))}
    </svg>
  );
}

export function Specs({ p }) {
  return (
    <ul className="specs">
      <li><Icon name="bed" size={16} /> {p.beds} hab.</li>
      <li><Icon name="bath" size={16} /> {p.baths} baños</li>
      <li><Icon name="area" size={16} /> {p.area} m²</li>
    </ul>
  );
}

function Photo({ src, alt, fallback }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return <img className="art" src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function PropertyImage({ p, index = 0 }) {
  const fallback = <PropertyArt palette={p.palette} kind={p.kind} />;
  const src = p.images?.[index];
  if (!src) return fallback;
  return <Photo key={src} src={src} alt={p.title} fallback={fallback} />;
}

export function FavoriteButton({ propertyId, label = false }) {
  const { user } = useAuth();
  const { state, actions } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const active = Boolean(user && (state.favorites?.[user.id] ?? []).includes(propertyId));

  const toggle = () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname, notice: "Inicia sesión para guardar propiedades en favoritos." } });
      return;
    }
    actions.toggleFavorite(user.id, propertyId);
  };

  if (label) {
    return (
      <button className="btn btn-glass" type="button" aria-pressed={active} onClick={toggle}>
        <Icon name="heart" size={16} filled={active} />&nbsp;{active ? "Guardada" : "Guardar"}
      </button>
    );
  }
  return (
    <button
      className={active ? "fav on" : "fav"}
      type="button"
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={toggle}
    >
      <Icon name="heart" filled={active} />
    </button>
  );
}

export const PropertyCard = memo(function PropertyCard({ p }) {
  return (
    <article className="glass card">
      <Link to={`/propiedad/${p.id}`} className="card-link">
        <div className="card-art">
          <PropertyImage p={p} />
          <span className="pill tag">{p.tag}</span>
        </div>
        <div className="card-body">
          <p className="price">{money(p.price)}</p>
          <h3>{p.title}</h3>
          <p className="zone"><Icon name="pin" size={15} /> {p.zone}, Maracaibo</p>
          <Specs p={p} />
        </div>
      </Link>
      <FavoriteButton propertyId={p.id} />
    </article>
  );
});

const avatarColors = [["#FFD60A", "#0077B6"], ["#48CAE4", "#0B3C6B"], ["#FFE29A", "#0096C7"], ["#BFE6F5", "#1D6FA5"]];

export function Avatar({ name, size = 44 }) {
  const [a, b] = avatarColors[name.length % avatarColors.length];
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${a}, ${b})` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

const statusLabels = { paid: "Pagada", pending: "Por vencer", overdue: "Vencida" };

export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{statusLabels[status]}</span>;
}
