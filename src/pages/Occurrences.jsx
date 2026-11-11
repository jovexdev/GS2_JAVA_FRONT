import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, FilePlus2, Search, Trash2, Pencil } from "lucide-react";
import { useAuth } from "../auth";
import { api } from "../api";
import { useApi } from "../hooks";
import { dataHora } from "../constants";
import {
  Alert,
  Badge,
  Button,
  Empty,
  ErrorState,
  Field,
  Loading,
  Location,
  PageTitle,
} from "../components/ui";
export function Occurrences() {
  const { user } = useAuth();
  const reports = useApi("/ocorrencias");
  const visits = useApi("/vistorias");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODAS");
  const [decision, setDecision] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function act(path, method, body, next) {
    setBusy(true);
    setError("");
    try {
      const result = await api(path, { method, body });
      if (next) navigate("/app/atendimentos/" + result.id);
      else {
        reports.reload();
        visits.reload();
        setDeleting(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (reports.loading || visits.loading) return <Loading />;
  if (reports.error || visits.error)
    return (
      <ErrorState
        error={reports.error || visits.error}
        retry={() => {
          reports.reload();
          visits.reload();
        }}
      />
    );
  const byOccurrence = new Map(
    (visits.data || []).map((v) => [v.ocorrenciaId, v]),
  );
  const list = (reports.data || []).filter(
    (o) =>
      (o.descricao + " " + o.localizacao + " " + o.id)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "TODAS" ||
        (filter === "SEM_ATENDIMENTO"
          ? !byOccurrence.has(o.id)
          : byOccurrence.get(o.id)?.status === filter)),
  );
  const gestor = user.perfil === "GESTOR";
  return (
    <>
      <PageTitle
        eyebrow={gestor ? "CENTRO DE OPERAÇÕES" : "PARTICIPAÇÃO E CUIDADO"}
        title={
          gestor
            ? "Analisar ocorrências"
            : user.perfil === "EMPRESA"
              ? "Situação ambiental"
              : "Minhas ocorrências"
        }
        description={
          gestor
            ? "Consulte os relatos de cidadãos e empresas e decida os próximos passos."
            : "Seus relatos, classificações e próximos passos em um só lugar."
        }
      >
        {!gestor && (
          <Link className="button button-primary" to="/app/nova-ocorrencia">
            <FilePlus2 size={17} />
            Novo relato
          </Link>
        )}
      </PageTitle>
      <div className="list-toolbar">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Buscar ocorrências"
            placeholder="Buscar por relato, local ou número…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar situação"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="TODAS">Todas as situações</option>
          <option value="SEM_ATENDIMENTO">Aguardando análise</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="AGENDADA">Agendadas</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDA">Concluídas</option>
          <option value="ENCERRADA">Encerradas</option>
        </select>
      </div>
      <Alert>{error}</Alert>
      {!list.length ? (
        <div className="card">
          <Empty
            title="Nenhuma ocorrência encontrada"
            text="Ajuste a busca ou registre uma nova ocorrência."
          />
        </div>
      ) : (
        <div className="occurrence-list">
          {list.map((o) => {
            const v = byOccurrence.get(o.id);
            return (
              <article key={o.id} className="card occurrence-card">
                <div className="occurrence-top">
                  <span className="record-number">OCORRÊNCIA #{o.id}</span>
                  <Badge value={v?.status} />
                </div>
                <h2>{o.descricao}</h2>
                <Location>{o.localizacao}</Location>
                <p className="record-date">
                  Registrada em {dataHora(o.criadaEm)}
                </p>
                {o.prioridadePreliminar && (
                  <div className="classification">
                    <div>
                      <span className="label-caps">
                        CLASSIFICAÇÃO PRELIMINAR
                      </span>
                      <Badge priority value={o.prioridadePreliminar} />
                    </div>
                    <p>{o.justificativa}</p>
                    <small>
                      Resultado a partir dos fatores declarados, sujeito à
                      análise do gestor.
                    </small>
                  </div>
                )}
                <div className="occurrence-actions">
                  {v ? (
                    <Link
                      className="text-link"
                      to={"/app/atendimentos/" + v.id}
                    >
                      Acompanhar atendimento #{v.id}
                      <ArrowRight size={17} />
                    </Link>
                  ) : gestor ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setDecision({ id: o.id, realizarVistoria: true })
                        }
                      >
                        Encaminhar para vistoria
                      </Button>
                      <Button
                        variant="text"
                        onClick={() =>
                          setDecision({ id: o.id, realizarVistoria: false })
                        }
                      >
                        Encerrar sem vistoria
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        className="text-link"
                        to={"/app/nova-ocorrencia?id=" + o.id}
                      >
                        <Pencil size={15} />
                        Editar relato
                      </Link>
                      <Button variant="text" onClick={() => setDeleting(o.id)}>
                        <Trash2 size={15} />
                        Excluir
                      </Button>
                      {user.perfil === "EMPRESA" && (
                        <Button
                          busy={busy}
                          onClick={() =>
                            act(
                              "/ocorrencias/" + o.id + "/vistoria",
                              "POST",
                              undefined,
                              true,
                            )
                          }
                        >
                          Solicitar vistoria
                          <ArrowRight size={16} />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                {decision?.id === o.id && (
                  <form
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      act(
                        "/ocorrencias/" + o.id + "/analise",
                        "POST",
                        {
                          realizarVistoria: decision.realizarVistoria,
                          justificativa: new FormData(e.currentTarget).get(
                            "justificativa",
                          ),
                        },
                        true,
                      );
                    }}
                  >
                    <h3>
                      {decision.realizarVistoria
                        ? "Encaminhar ocorrência"
                        : "Encerrar sem vistoria"}
                    </h3>
                    <Field label="Justificativa da decisão">
                      <textarea
                        name="justificativa"
                        required
                        maxLength={1000}
                        rows={3}
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" busy={busy}>
                        Confirmar decisão
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => setDecision(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
                {deleting === o.id && (
                  <div className="inline-form">
                    <p>Excluir este relato? Essa ação remove o registro.</p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        busy={busy}
                        onClick={() => act("/ocorrencias/" + o.id, "DELETE")}
                      >
                        Confirmar exclusão
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setDeleting(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
export function NewOccurrence() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const id = params.get("id");
  const existing = useApi(id ? "/ocorrencias/" + encodeURIComponent(id) : null);
  if (existing.loading) return <Loading />;
  if (existing.error)
    return <ErrorState error={existing.error} retry={existing.reload} />;
  return (
    <OccurrenceForm key={id || "new"} user={user} existing={existing.data} />
  );
}
function OccurrenceForm({ user, existing }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      descricao: f.get("descricao"),
      localizacao: f.get("localizacao"),
    };
    if (user.perfil === "EMPRESA")
      Object.assign(body, {
        aguaParada: f.has("aguaParada"),
        reservatorioAberto: f.has("reservatorioAberto"),
        materiaisExpostos: f.has("materiaisExpostos"),
      });
    setBusy(true);
    setError("");
    try {
      await api("/ocorrencias" + (existing ? "/" + existing.id : ""), {
        method: existing ? "PUT" : "POST",
        body,
      });
      navigate("/app/ocorrencias");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="UM NOVO PASSO PELA PREVENÇÃO"
        title={existing ? "Editar ocorrência" : "Conte o que você observou."}
        description="Descreva a situação e indique o local para ajudar a rede a agir."
      />
      <div className="form-page-grid">
        <form className="card p-7" onSubmit={submit}>
          <Alert>{error}</Alert>
          <Field label="Descrição da situação">
            <textarea
              name="descricao"
              required
              maxLength={1000}
              rows={5}
              defaultValue={existing?.descricao}
              placeholder="O que você observou no ambiente?"
            />
          </Field>
          <Field label="Localização da ocorrência">
            <input
              name="localizacao"
              required
              maxLength={250}
              defaultValue={existing?.localizacao}
              placeholder="Endereço ou ponto de referência fictício"
            />
          </Field>
          {user.perfil === "EMPRESA" && (
            <fieldset className="environment-fieldset">
              <legend>Condições ambientais observadas</legend>
              <p>Marque apenas as condições presentes no estabelecimento.</p>
              {[
                ["aguaParada", "Há água parada"],
                ["reservatorioAberto", "Há reservatório aberto"],
                ["materiaisExpostos", "Há materiais expostos"],
              ].map(([key, label]) => (
                <label className="checkbox-row" key={key}>
                  <input
                    type="checkbox"
                    name={key}
                    defaultChecked={existing?.[key] || false}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button busy={busy} type="submit">
              {existing ? "Salvar alterações" : "Registrar ocorrência"}
              <ArrowRight size={16} />
            </Button>
            <Link className="button button-secondary" to="/app/ocorrencias">
              Cancelar
            </Link>
          </div>
        </form>
        <aside className="care-card card">
          <span className="eyebrow">COMO FUNCIONA</span>
          <h2>
            Seu relato
            <br />
            conecta o cuidado.
          </h2>
          <ol className="simple-steps">
            <li>Registre o que você observou e informe a localização.</li>
            <li>
              A gestão analisa as informações e decide os próximos passos.
            </li>
            <li>Acompanhe o atendimento e as orientações pelo seu perfil.</li>
          </ol>
          <p className="form-note">Utilize dados fictícios neste protótipo.</p>
        </aside>
      </div>
    </>
  );
}
