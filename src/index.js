import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registrarServiceWorker } from "./pushWeb";

const root = ReactDOM.createRoot(document.getElementById("root"));
registrarServiceWorker();

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
