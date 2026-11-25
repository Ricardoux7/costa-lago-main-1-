import { Suspense, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { buildings } from "../data";
import { useAuth } from "../auth/AuthContext";
import { useStore } from "../store/StoreContext";
import { buildingsOf, canManageTenants, listingsOf, roleLabel, unitOf } from "../store/selectors";
import { Avatar, Icon } from "../ui";

const favLink = { to: "favoritos", label: "Favoritos", icon: "heart" };
const profileLink = { to: "perfil", label: "Mi perfil", icon: "user" };
const tenantsLink = { to: "inquilinos", label: "Inquilinos", icon: "user" };

function linksFor(user, unread) {
  if (user.role === "superadmin") {
    return [
      { to: "consultas", label: "Consultas", icon: "mail", badge: unread },
      { to: "propietarios", label: "Propietarios", icon: "user" },
      { to: "avisos", label: "Avisos a propietarios", icon: "bell" },
      profileLink,
    ];
  }
  if (user.role === "admin") {
    return [
      { to: "finanzas", label: "Finanzas", icon: "chart" },
      { to: "cobranza", label: "Cobranza", icon: "list" },
      { to: "reservas", label: "Reservas", icon: "calendar" },
      { to: "comunicados", label: "Comunicados", icon: "bell" },
      favLink,
      profileLink,
    ];
  }
  if (user.role === "owner") {
    return [
      { to: "inmuebles", label: "Mis inmuebles", icon: "building" },
      { to: "inquilinos", label: "Inquilinos", icon: "user" },
      { to: "pagos", label: "Mi cuota mensual", icon: "card" },
      { to: "avisos", label: "Avisos", icon: "bell" },
      favLink,
      profileLink,
    ];
  }
  if (user.role === "tenant") {
    return [
      { to: "pagos", label: "Mi renta", icon: "card" },
      { to: "avisos", label: "Avisos", icon: "bell" },
      profileLink,
    ];
  }
  return [
    { to: "resumen", label: "Resumen", icon: "home" },
    { to: "pagos", label: "Mis pagos", icon: "card" },
    { to: "reservas", label: "Reservas", icon: "calendar" },
    { to: "avisos", label: "Avisos", icon: "bell" },
    ...(canManageTenants(user) ? [tenantsLink] : []),
    favLink,
    profileLink,
  ];
}

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();

  const leaving = useRef(false);
  useEffect(
    () => () => {
      if (leaving.current) logout();
    },
    [logout]
  );

  const unread = user.role === "superadmin" ? state.inquiries.filter((q) => !q.read).length : 0;
  const links = linksFor(user, unread);
  const unit = unitOf(state, user);
  const listingCount = listingsOf(state, user).length;

  const context =
    user.role === "superadmin"
      ? "Bandeja de consultas"
      : user.role === "admin"
        ? buildingsOf(state, user).map((b) => b.name).join(" · ")
        : user.role === "owner"
          ? `${listingCount} ${listingCount === 1 ? "inmueble publicado" : "inmuebles publicados"}`
          : user.role === "tenant"
            ? "Pagos de renta"
          : `${buildings.find((b) => b.id === unit?.buildingId)?.name} · unidad ${unit?.label}`;

  return (
    <div className="portal wrap">
      <aside className="glass side-nav">
        <div className="who">
          <Avatar name={user.name} />
          <div>
            <strong>{user.name}</strong>
            <span className="role-tag">{roleLabel(user)}</span>
          </div>
        </div>
        <p className="muted small ctx"><Icon name="building" size={15} /> {context}</p>
        <nav aria-label="Portal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "on" : "")}>
              <Icon name={l.icon} size={18} /> {l.label}
              {l.badge > 0 && <span className="nav-badge" aria-label={`${l.badge} sin leer`}>{l.badge}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          className="btn btn-glass full"
          type="button"
          onClick={() => {
            leaving.current = true;
            navigate("/");
          }}
        >
          <Icon name="logout" size={16} />&nbsp;Cerrar sesión
        </button>
      </aside>

      <div className="portal-main">
        <Suspense fallback={<p className="muted">Cargando…</p>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
