import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  Fingerprint,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../auth";
import { api } from "../api";
import { PERFIS, SENHA_DEMO } from "../constants";
import { Alert, Brand, Button, Field } from "../components/ui";

const ICONES = {
  GESTOR: BriefcaseBusiness,
  AGENTE: ShieldCheck,
  CIDADAO: Users,
  EMPRESA: Building2,
};
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState("CIDADAO");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    api("/saude", { signal: c.signal })
      .then(() => setOnline(true))
      .catch((e) => {
        if (e.name !== "AbortError") setOnline(false);
      });
    return () => c.abort();
  }, []);
  if (user) return <Navigate to="/app" replace />;
  function choose(value) {
    setPerfil(value);
    setError("");
  }
  function preencher(value, customEmail) {
    choose(value);
    setEmail(customEmail || PERFIS[value].email);
    setSenha(SENHA_DEMO);
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), senha, perfil);
      navigate("/app", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand light />
        <div className="story-copy">
          <span className="story-label">
            <span className="status-dot" />
            INTELIGÊNCIA PARA PREVENIR
          </span>
          <h1>
            Uma rede de cuidado.
            <br />
            <em>
              Uma cidade
              <br />
              mais protegida.
            </em>
          </h1>
          <p>
            Informação que orienta. Pessoas que agem.
            <br />
            Juntos, um passo à frente da dengue.
          </p>
        </div>
        <div className="radar-art" aria-hidden="true">
          <div className="radar-ring ring-1" />
          <div className="radar-ring ring-2" />
          <div className="radar-ring ring-3" />
          <div className="radar-cross" />
          <svg viewBox="0 0 480 250">
            <path
              d="M-30 130 90 130 145 70 230 70 290 10M70 290 70 200 145 130 250 130 310 70 510 70M130 300 220 210 330 210 420 120 510 120M-20 30 80 30 130 80M350 0 350 100 440 190 510 190"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
          <span className="radar-point point-1" />
          <span className="radar-point point-2" />
          <span className="radar-point point-3" />
          <span className="radar-center">
            <ShieldCheck size={34} />
          </span>
          <span className="radar-tag">
            <span className="status-dot" />
            Proteção começa com conexão
          </span>
        </div>
        <div className="story-footer">
          <HeartHandshake size={19} />
          <span>Por você. Pela sua comunidade.</span>
          <span className="story-year">AEGIS / 2026</span>
        </div>
      </section>
      <section className="auth-content">
        <div className="auth-top">
          <span>PREVENÇÃO QUE CONECTA</span>
          <span className={"service-indicator " + (online ? "is-online" : "")}>
            <span />
            {online === null
              ? "Verificando serviço"
              : online
                ? "Serviço online"
                : "Serviço indisponível"}
          </span>
        </div>
        <div className="login-inner">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="eyebrow">
            <Fingerprint size={15} />
            SEU ACESSO À REDE
          </span>
          <h2>Bem-vindo ao AEGIS.</h2>
          <p className="auth-description">
            Escolha seu perfil e entre para fazer a diferença.
          </p>
          <form onSubmit={submit}>
            <fieldset className="profile-fieldset">
              <legend>Como você quer acessar?</legend>
              <div className="profile-grid">
                {Object.entries(PERFIS).map(([key, p]) => {
                  const Icon = ICONES[key];
                  return (
                    <label
                      key={key}
                      className={
                        "profile-option " + (perfil === key ? "selected" : "")
                      }
                    >
                      <input
                        type="radio"
                        name="perfil"
                        value={key}
                        checked={perfil === key}
                        onChange={() => choose(key)}
                      />
                      <Icon size={21} />
                      <span>
                        <strong>{p.nome}</strong>
                        <small>{p.descricao}</small>
                      </span>
                      <span className="radio-dot" />
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <Alert>{error}</Alert>
            <Field label="E-mail">
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                maxLength={254}
              />
            </Field>
            <Field label="Senha">
              <span className="password-input">
                <input
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha de acesso"
                  required
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </Field>
            <Button className="w-full login-submit" type="submit" busy={busy}>
              Entrar como {PERFIS[perfil].nome}
              <ArrowRight size={18} />
            </Button>
            <p className="signup-line">
              {["CIDADAO", "EMPRESA"].includes(perfil) ? (
                <>
                  Primeira vez por aqui?{" "}
                  <Link to={"/cadastro?perfil=" + perfil}>Crie sua conta</Link>
                </>
              ) : (
                "Seu acesso é disponibilizado pela gestão responsável."
              )}
            </p>
          </form>
          <details className="demo-accounts" open>
            <summary>
              <Sparkles size={16} />
              <strong>Experimente os quatro perfis</strong>
              <span>CONTAS DE TESTE</span>
            </summary>
            <p>Selecione uma conta para preencher o acesso.</p>
            <div className="demo-list">
              {Object.entries(PERFIS).map(([key, p]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => preencher(key)}
                  aria-label={"Usar conta de teste " + p.nome}
                >
                  <span>{p.nome}</span>
                  <code>{p.email}</code>
                  <ArrowRight size={14} />
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  preencher("AGENTE", "agente.sul@demo.aegis.test")
                }
                aria-label="Usar conta de teste Agente Sul"
              >
                <span>Agente Sul</span>
                <code>agente.sul@demo.aegis.test</code>
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="demo-password">
              Senha de todas as contas <code>{SENHA_DEMO}</code>
            </div>
            <p className="demo-note">
              Disponíveis quando a base de demonstração estiver carregada.
            </p>
          </details>
        </div>
        <footer className="auth-footer">
          <span>AEGIS · Rede de proteção contra a dengue</span>
          <span>Projeto acadêmico</span>
        </footer>
      </section>
    </main>
  );
}
