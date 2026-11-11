import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  FilePlus2,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../auth";
import { PERFIS } from "../constants";
import { Alert, Brand, Button } from "./ui";
export const NAVS = {
  CIDADAO: [
    ["", "Visão geral", LayoutDashboard],
    ["georadar", "GeoRadar", Map],
    ["minha-saude", "Minha saúde", HeartPulse],
    ["ocorrencias", "Minhas ocorrências", ClipboardList],
    ["nova-ocorrencia", "Registrar ocorrência", FilePlus2],
    ["lia", "Conversar com LIA", MessageCircle],
  ],
  EMPRESA: [
    ["", "Visão geral", LayoutDashboard],
    ["estabelecimento", "Meu estabelecimento", Building2],
    ["ocorrencias", "Situação ambiental", ClipboardList],
    ["nova-ocorrencia", "Novo relato", FilePlus2],
    ["atendimentos", "Meus atendimentos", ShieldCheck],
  ],
  GESTOR: [
    ["", "Visão geral", LayoutDashboard],
    ["ocorrencias", "Analisar ocorrências", ClipboardList],
    ["atendimentos", "Centro de Operações", ShieldCheck],
  ],
  AGENTE: [
    ["", "Visão geral", LayoutDashboard],
    ["atendimentos", "Minhas vistorias", ClipboardList],
  ],
};
export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 701px)");
    const closeOnWide = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", closeOnWide);
    return () => wide.removeEventListener("change", closeOnWide);
  }, []);
  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const location = useLocation();
  const entries = NAVS[user.perfil];
  const current =
    entries.find(
      ([p]) => location.pathname === "/app" + (p ? "/" + p : ""),
    )?.[1] || "Detalhes do atendimento";
  async function sair() {
    setBusy(true);
    try {
      await logout();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Fechar navegação"
        />
      )}
      <aside
        id="menu-principal"
        className={"sidebar " + (open ? "sidebar-open" : "")}
      >
        <Link
          to="/app"
          onClick={() => setOpen(false)}
          aria-label="AEGIS início"
        >
          <Brand light />
        </Link>
        <button
          className="sidebar-close"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X />
        </button>
        <div className="nav-section-label">SEU ESPAÇO</div>
        <nav aria-label="Menu principal">
          {entries.map(([p, label, Icon]) => (
            <NavLink
              key={p}
              to={"/app" + (p ? "/" + p : "")}
              end
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {label}
              <span className="nav-indicator" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-message">
          <span className="sidebar-message-icon">
            <ShieldCheck size={24} />
          </span>
          <h3>
            Pequenas ações.
            <br />
            Proteção coletiva.
          </h3>
          <p>Cada cuidado faz diferença para a sua comunidade.</p>
          <a
            href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue"
            target="_blank"
            rel="noreferrer"
          >
            Saiba como prevenir
            <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="sidebar-user">
          <span className="avatar">{user.nome?.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.nome}</strong>
            <small>{PERFIS[user.perfil].nome}</small>
          </div>
          <button
            onClick={sair}
            disabled={busy}
            aria-label="Sair da conta"
            title="Sair da conta"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="app-content" inert={open || undefined}>
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="menu-principal"
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            Meu espaço <span>/</span>
            <strong>{current}</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="role-chip">{PERFIS[user.perfil].nome}</span>
          </div>
        </header>
        <main id="conteudo" className="workspace" tabIndex="-1">
          <Alert>{error}</Alert>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>AEGIS · Prevenção que conecta</span>
          <span>Projeto acadêmico · Dados fictícios nos cadastros</span>
        </footer>
      </div>
    </div>
  );
}
