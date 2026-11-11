import { useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api";
import { useApi } from "../hooks";
import { useAuth } from "../auth";
import {
  Alert,
  Button,
  ErrorState,
  Field,
  Loading,
  PageTitle,
} from "../components/ui";
const CAMPOS = [
  ["razaoSocial", "Razão social", 120, true],
  ["nomeFantasia", "Nome fantasia", 120],
  ["atividadeEconomica", "Atividade econômica", 150],
  ["endereco", "Endereço", 250, true],
  ["responsavel", "Responsável", 120, true],
  ["telefone", "Telefone", 30],
];
export default function Establishment() {
  const state = useApi("/empresa/estabelecimento");
  if (state.loading) return <Loading />;
  if (state.error)
    return <ErrorState error={state.error} retry={state.reload} />;
  return <Form data={state.data} />;
}
function Form({ data }) {
  const { setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    try {
      const atual = await api("/empresa/estabelecimento", {
        method: "PUT",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      setUser((u) => ({
        ...u,
        nome: atual.razaoSocial,
        endereco: atual.endereco,
        responsavel: atual.responsavel,
      }));
      setOk("Dados do estabelecimento atualizados.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="REPRESENTANTE EMPRESARIAL"
        title="Meu estabelecimento"
        description="Mantenha as informações institucionais e ambientais atualizadas."
      />
      <form className="card p-7 max-w-4xl" onSubmit={submit}>
        <Alert>{error}</Alert>
        <Alert type="success">{ok}</Alert>
        <div className="form-grid">
          <Field label="CNPJ">
            <input value={data.cnpj} readOnly className="readonly" />
          </Field>
          {CAMPOS.map(([key, label, max, required]) => (
            <Field key={key} label={label}>
              <input
                name={key}
                defaultValue={data[key] || ""}
                maxLength={max}
                required={!!required}
              />
            </Field>
          ))}
          <div className="col-span-full">
            <Field label="Características das instalações">
              <textarea
                name="caracteristicasInstalacoes"
                defaultValue={data.caracteristicasInstalacoes || ""}
                maxLength={500}
                rows={4}
              />
            </Field>
          </div>
        </div>
        <Button busy={busy} type="submit">
          <Save size={16} />
          Salvar informações
        </Button>
      </form>
    </>
  );
}
