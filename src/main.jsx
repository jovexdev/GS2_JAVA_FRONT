import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { Loading } from "./components/ui";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { Occurrences, NewOccurrence } from "./pages/Occurrences";
import { Attendances, AttendanceDetail } from "./pages/Attendances";
import Establishment from "./pages/Establishment";
import GeoRadar from "./pages/GeoRadar";
import Lia from "./pages/Lia";
const MinhaSaude = lazy(() => import("./pages/MinhaSaude"));
import "./styles.css";

function Protected({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/entrar" replace />;
  if (roles && !roles.includes(user.perfil))
    return <Navigate to="/app" replace />;
  return <Outlet />;
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route element={<Protected />}>
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route
                element={<Protected roles={["CIDADAO", "EMPRESA", "GESTOR"]} />}
              >
                <Route path="ocorrencias" element={<Occurrences />} />
              </Route>
              <Route element={<Protected roles={["CIDADAO", "EMPRESA"]} />}>
                <Route path="nova-ocorrencia" element={<NewOccurrence />} />
              </Route>
              <Route path="atendimentos" element={<Attendances />} />
              <Route path="atendimentos/:id" element={<AttendanceDetail />} />
              <Route element={<Protected roles={["EMPRESA"]} />}>
                <Route path="estabelecimento" element={<Establishment />} />
              </Route>
              <Route element={<Protected roles={["CIDADAO"]} />}>
                <Route path="georadar" element={<GeoRadar />} />
                <Route path="lia" element={<Lia />} />
                <Route
                  path="minha-saude"
                  element={
                    <Suspense fallback={<Loading />}>
                      <MinhaSaude />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
