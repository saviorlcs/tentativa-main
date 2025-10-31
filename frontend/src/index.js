// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";                           // <-- AQUI: ./App (não ./pages/App)
import { CycleProvider } from "./context/CycleContext";
import "./index.css";
// src/api/http.js
import axios from "axios";
import http from "./api/http";

async function boot() {
  try {
    const r = await http.get("/api/auth/me");
    console.log("auth/me:", r.data);
    // ... resto do seu código que depende disso
  } catch (e) {
    console.error("auth/me erro:", e);
  }
}
boot();




export default http;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CycleProvider>
      <App />
    </CycleProvider>
  </React.StrictMode>
);
