import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider } from "./store/StoreProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import { Avatar, Logo } from "./ui";
import ErrorBoundary from "./ErrorBoundary";
import Home from "./pages/Home";
import "./styles.css";

const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const PortalLayout = lazy(() => import("./portal/PortalLayout"));
const Resumen = lazy(() => import("./portal/Resumen"));
const Pagos = lazy(() => import("./portal/Pagos"));
const Reservas = lazy(() => import("./portal/Reservas"));
const Avisos = lazy(() => import("./portal/Avisos"));
const Perfil = lazy(() => import("./portal/Perfil"));
const Finanzas = lazy(() => import("./portal/Finanzas"));
const Cobranza = lazy(() => import("./portal/Cobranza"));
const Favoritos = lazy(() => import("./portal/Favoritos"));
const Inmuebles = lazy(() => import("./portal/Inmuebles"));
const NuevoInmueble = lazy(() => import("./portal/NuevoInmueble"));
const Consultas = lazy(() => import("./portal/Consultas"));
const Inquilinos = lazy(() => import("./portal/Inquilinos"));
const Propietarios = lazy(() => import("./portal/Propietarios"));

function Guarded({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

function ScrollManager() {
  const { pathname, hash, search } = useLocation();
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash, search]);
  return null;
}

function Header() {
  const { user } = useAuth();
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Logo />
        <nav aria-label="Principal">
          <Link to="/#propiedades">Propiedades</Link>
          <Link to="/#condominios">Condominios</Link>
          <Link to="/#contacto">Contacto</Link>
        </nav>
        <div className="nav-actions">
          {user ? (
            <Link className="user-chip" to="/portal">
              <Avatar name={user.name} size={32} />
              <span>Mi portal</span>
            </Link>
          ) : (
            <>
              <Link className="nav-login" to="/login">Iniciar sesión</Link>
              <Link className="nav-login" to="/registro">Crear cuenta</Link>
              <Link className="btn btn-primary" to="/#contacto">Agendar visita</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap foot-in">
        <Logo />
        <p className="muted small">© 2026 Costa Lago Residencias.</p>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <section className="detail wrap">
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección que escribiste no existe.</p>
      <Link className="btn btn-primary" to="/">Volver al inicio</Link>
    </section>
  );
}

function PortalHome() {
  const { user } = useAuth();
  const home = { superadmin: "/portal/consultas", admin: "/portal/finanzas", resident: "/portal/resumen", owner: "/portal/inmuebles", tenant: "/portal/pagos" };
  return <Navigate to={home[user.role]} replace />;
}

const only = (roles, page) => <RequireAuth roles={roles}>{page}</RequireAuth>;

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <ScrollManager />
          <div className="bg" aria-hidden="true" />
          <Header />
          <main>
            <Guarded>
            <Suspense fallback={<p className="wrap loading muted">Cargando…</p>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/propiedad/:id" element={<PropertyDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Register />} />

                <Route path="/portal" element={<RequireAuth><PortalLayout /></RequireAuth>}>
                  <Route index element={<PortalHome />} />
                  <Route path="resumen" element={only(["resident"], <Resumen />)} />
                  <Route path="pagos" element={only(["resident", "owner", "tenant"], <Pagos />)} />
                  <Route path="avisos" element={only(["resident", "owner", "tenant", "superadmin"], <Avisos />)} />
                  <Route path="finanzas" element={only(["admin"], <Finanzas />)} />
                  <Route path="cobranza" element={only(["admin"], <Cobranza />)} />
                  <Route path="comunicados" element={only(["admin"], <Avisos />)} />
                  <Route path="consultas" element={only(["superadmin"], <Consultas />)} />
                  <Route path="propietarios" element={only(["superadmin"], <Propietarios />)} />
                  <Route path="inmuebles" element={only(["owner"], <Inmuebles />)} />
                  <Route path="inmuebles/nuevo" element={only(["owner"], <NuevoInmueble />)} />
                  <Route path="inquilinos" element={only(["owner", "resident"], <Inquilinos />)} />
                  <Route path="reservas" element={only(["resident", "admin"], <Reservas />)} />
                  <Route path="favoritos" element={<Favoritos />} />
                  <Route path="perfil" element={<Perfil />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </Guarded>
          </main>
          <Footer />
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}
