import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Users } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Alert, Brand, Button, Field } from "../components/ui";
export default function Register() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(
    params.get("perfil") === "EMPRESA" ? "EMPRESA" : "CIDADAO",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/app" replace />;
  async function submit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      await api("/usuarios", { method: "POST", body: { ...data, perfil } });
      await login(data.email, data.senha, perfil);
      navigate("/app");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="register-page">
      <header>
        <Brand />
        <Link to="/entrar" className="text-link">
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>
      </header>
      <div className="register-intro">
        <p className="eyebrow">FAÇA PARTE DA REDE</p>
        <h1>O cuidado começa com você.</h1>
        <p>
          Crie sua conta para acompanhar informações e participar da prevenção.
        </p>
      </div>
      <div className="register-card card">
        <div className="segmented">
          <button
            type="button"
            className={perfil === "CIDADAO" ? "active" : ""}
            onClick={() => {
              setPerfil("CIDADAO");
              setError("");
            }}
          >
            <Users size={18} />
            Sou cidadão
          </button>
          <button
            type="button"
            className={perfil === "EMPRESA" ? "active" : ""}
            onClick={() => {
              setPerfil("EMPRESA");
              setError("");
            }}
          >
            <Building2 size={18} />
            Represento uma empresa
          </button>
        </div>
        <form onSubmit={submit} key={perfil}>
          <Alert>{error}</Alert>
          <div className="form-grid">
            <Field
              label={perfil === "EMPRESA" ? "Razão social" : "Nome completo"}
            >
              <input name="nome" required maxLength={120} autoComplete="name" />
            </Field>
            <Field
              label={perfil === "EMPRESA" ? "CNPJ fictício" : "CPF fictício"}
            >
              <input
                name="documento"
                required
                maxLength={24}
                placeholder={
                  perfil === "EMPRESA" ? "00.000.000/0000-00" : "000.000.000-00"
                }
              />
            </Field>
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
              />
            </Field>
            <Field label="Telefone (opcional)">
              <input name="telefone" maxLength={30} autoComplete="tel" />
            </Field>
            <div className="col-span-full">
              <Field label="Endereço">
                <input
                  name="endereco"
                  required
                  maxLength={250}
                  autoComplete="street-address"
                />
              </Field>
            </div>
            {perfil === "CIDADAO" ? (
              <Field label="Profissão / ocupação (opcional)">
                <input name="ocupacao" maxLength={100} />
              </Field>
            ) : (
              <>
                <Field label="Responsável">
                  <input name="responsavel" required maxLength={120} />
                </Field>
                <Field label="Nome fantasia (opcional)">
                  <input name="nomeFantasia" maxLength={120} />
                </Field>
                <Field label="Atividade econômica (opcional)">
                  <input name="atividadeEconomica" maxLength={150} />
                </Field>
                <Field label="Características das instalações (opcional)">
                  <input name="caracteristicasInstalacoes" maxLength={500} />
                </Field>
              </>
            )}
            <Field label="Crie uma senha" hint="Use entre 8 e 128 caracteres.">
              <input
                name="senha"
                type="password"
                minLength={8}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </Field>
          </div>
          <p className="form-note">
            Este é um protótipo acadêmico. Utilize dados fictícios.
          </p>
          <Button type="submit" busy={busy}>
            Criar conta e acessar
            <ArrowRight size={17} />
          </Button>
        </form>
      </div>
    </main>
  );
}
