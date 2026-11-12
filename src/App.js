import React from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./styles.css";
import { AuthProvider, useAuth } from "./auth";
import { ToastProvider } from "./components/Toast";
import LoginScreen from "./components/LoginScreen";
import Layout from "./components/Layout";
import ErrorState from "./components/ErrorState";
import Panel from "./pages/Panel";
import Comparar from "./pages/Comparar";
import Registrar from "./pages/Registrar";
import Plan from "./pages/Plan";
import Perfil from "./pages/Perfil";
import Notificaciones from "./pages/Notificaciones";

function NotFound() {
  return (
    <ErrorState error={{ status: 404 }}>
      <Link className="btn-primary" to="/">Volver al Panel</Link>
    </ErrorState>
  );
}

function Gate() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Panel />} />
        <Route path="comparar" element={<Comparar />} />
        <Route path="registrar" element={<Registrar />} />
        <Route path="plan" element={<Plan />} />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Gate />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
