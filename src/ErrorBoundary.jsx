import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  reset = () => {
    try {
      localStorage.removeItem("costalago.data.v3");
      sessionStorage.removeItem("costalago.session");
    } catch {
    }
    window.location.assign("/");
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="detail wrap">
        <div className="glass panel empty">
          <h1>Algo salió mal</h1>
          <p className="muted">
            Ocurrió un error inesperado en esta pantalla. Puede deberse a datos guardados de una versión anterior.
          </p>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={this.reset}>
              Restablecer datos y volver al inicio
            </button>
            <a className="btn btn-glass" href="/">Volver al inicio</a>
          </div>
        </div>
      </section>
    );
  }
}
