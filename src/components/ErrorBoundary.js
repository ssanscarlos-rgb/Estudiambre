import React from "react";
import { AlertTriangle } from "lucide-react";

// Si una pantalla lanza un error al dibujarse, muestra este aviso en lugar
// de dejar toda la web en blanco. Layout lo usa con key={pathname}, así que
// al navegar a otra sección se recupera solo.
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Error al mostrar la pantalla:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-strip" role="alert">
        <AlertTriangle size={15} aria-hidden="true" />
        <span className="error-strip-text">
          <strong>Algo salió mal al mostrar esta pantalla.</strong> Puedes volver a intentarlo o ir a otra sección.
        </span>
        <button type="button" className="btn-ghost" onClick={() => this.setState({ error: null })}>
          Reintentar
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
