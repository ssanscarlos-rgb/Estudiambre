import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import Panel from "./pages/Panel";
import Comparar from "./pages/Comparar";
import Registrar from "./pages/Registrar";
import Plan from "./pages/Plan";
import Perfil from "./pages/Perfil";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Panel />} />
        <Route path="/comparar" element={<Comparar />} />
        <Route path="/registrar" element={<Registrar />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
