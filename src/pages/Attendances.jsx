import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Play,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../auth";
import { api } from "../api";
import { useApi } from "../hooks";
import { ACOES, STATUS, dataHora } from "../constants";
import { agendamentoIso } from "../format";
import {
  Alert,
  AttendanceList,
  Badge,
  Button,
  Empty,
  ErrorState,
  Field,
  Loading,
  Location,
  PageTitle,
} from "../components/ui";

export function Attendances() {
  const { user } = useAuth();
  const state = useApi("/vistorias");
  const [status, setStatus] = useState("TODAS");
  const [search, setSearch] = useState("");
  if (state.loading) return <Loading />;
  if (state.error)
    return <ErrorState error={state.error} retry={state.reload} />;
  const list = (state.data || []).filter(
    (v) =>
      (status === "TODAS" || v.status === status) &&
      String(v.id + " " + v.ocorrenciaId + " " + (v.equipeNome || ""))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow={
          user.perfil === "GESTOR" ? "GESTÃO DE ATENDIMENTOS" : "ACOMPANHAMENTO"
        }
        title={
          user.perfil === "GESTOR"
            ? "Centro de Operações"
            : user.perfil === "AGENTE"
              ? "Minhas vistorias"
              : "Meus atendimentos"
        }
        description={
          user.perfil === "AGENTE"
            ? "Consulte seus atendimentos e registre cada etapa da inspeção."
            : "Acompanhe a situação, a equipe responsável e o histórico de cada atendimento."
        }
      />
      <div className="list-toolbar">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Buscar atendimentos"
            placeholder="Buscar por número ou equipe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar atendimentos"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="TODAS">Todas as situações</option>
          {Object.entries(STATUS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <section className="card">
        <AttendanceList items={list} />
      </section>
    </>
  );
}
export function AttendanceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const state = useApi("/vistorias/" + encodeURIComponent(id));
  const history = useApi("/vistorias/" + encodeURIComponent(id) + "/historico");
  const local = useApi("/vistorias/" + encodeURIComponent(id) + "/local");
  const agents = useApi(user.perfil === "GESTOR" ? "/agentes" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function mutate(route, body) {
    setBusy(true);
    setError("");
    try {
      await api("/vistorias/" + id + "/" + route, { method: "PUT", body });
      state.reload();
      history.reload();
      local.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (state.loading || history.loading || local.loading) return <Loading />;
  if (state.error || history.error || local.error)
    return (
      <ErrorState
        error={state.error || history.error || local.error}
        retry={() => {
          state.reload();
          history.reload();
          local.reload();
        }}
      />
    );
  const v = state.data;
  const place = local.data;
  const isAgent = user.perfil === "AGENTE";
  const gestor = user.perfil === "GESTOR";
  return (
    <>
      <Link className="text-link mb-5" to="/app/atendimentos">
        <ArrowLeft size={16} />
        Voltar aos atendimentos
      </Link>
      <PageTitle
        eyebrow={"OCORRÊNCIA #" + v.ocorrenciaId}
        title={"Atendimento #" + v.id}
        description="Cada etapa registrada. Cada cuidado acompanhado."
      >
        <Badge value={v.status} />
      </PageTitle>
      <Alert>{error}</Alert>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="card p-7">
            <span className="eyebrow">LOCAL E RELATO</span>
            <h2>{place.estabelecimento || "Ocorrência ambiental"}</h2>
            {place.endereco && <Location>{place.endereco}</Location>}
            <p className="detail-description">{place.ocorrencia.descricao}</p>
            <Location>{place.ocorrencia.localizacao}</Location>
            {place.ocorrencia.prioridadePreliminar && (
              <div className="classification">
                <div>
                  <span className="label-caps">CLASSIFICAÇÃO PRELIMINAR</span>
                  <Badge
                    priority
                    value={place.ocorrencia.prioridadePreliminar}
                  />
                </div>
                <p>{place.ocorrencia.justificativa}</p>
              </div>
            )}
          </section>
          <section className="card p-7">
            <h2>Organização do atendimento</h2>
            <dl className="details-list">
              <div>
                <dt>Prioridade revisada</dt>
                <dd>
                  <Badge priority value={v.prioridade} />
                </dd>
              </div>
              <div>
                <dt>Equipe responsável</dt>
                <dd>{v.equipeNome || "A designar"}</dd>
              </div>
              {v.agenteNome && (
                <div>
                  <dt>Agente designado</dt>
                  <dd>{v.agenteNome}</dd>
                </div>
              )}
              <div>
                <dt>Agendamento</dt>
                <dd>{dataHora(v.agendadaPara)}</dd>
              </div>
            </dl>
          </section>
          {(v.inspecao || v.recomendacoes || v.resultado) && (
            <section className="card p-7">
              <span className="eyebrow">REGISTROS DA VISTORIA</span>
              <h2>Inspeção e orientações</h2>
              {[
                ["Inspeção", v.inspecao],
                ["Recomendações", v.recomendacoes],
                ["Resultado", v.resultado],
              ].map(
                ([label, text]) =>
                  text && (
                    <div className="result-block" key={label}>
                      <h3>{label}</h3>
                      <p>{text}</p>
                    </div>
                  ),
              )}
            </section>
          )}
          {gestor && v.status === "PENDENTE" && (
            <section className="card p-7">
              <span className="eyebrow">ORGANIZAR O ATENDIMENTO</span>
              <h2>Da análise à ação</h2>
              <details className="action-step" open={!v.prioridade}>
                <summary>
                  <span>01</span>Revisar prioridade
                </summary>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    mutate("prioridade", {
                      prioridade: f.get("prioridade"),
                      justificativa: f.get("justificativa"),
                    });
                  }}
                >
                  <Field label="Prioridade">
                    <select
                      name="prioridade"
                      defaultValue={v.prioridade || "INSTAVEL"}
                    >
                      <option value="CRITICA">Crítica</option>
                      <option value="INSTAVEL">Instável</option>
                      <option value="OK">OK</option>
                    </select>
                  </Field>
                  <Field label="Justificativa da revisão">
                    <textarea
                      name="justificativa"
                      required
                      maxLength={950}
                      rows={3}
                    />
                  </Field>
                  <Button busy={busy} type="submit">
                    Salvar revisão
                  </Button>
                </form>
              </details>
              <details
                className="action-step"
                open={!!v.prioridade && !v.agenteId}
              >
                <summary>
                  <span>02</span>Designar agente
                </summary>
                {agents.error ? (
                  <ErrorState error={agents.error} retry={agents.reload} />
                ) : agents.loading ? (
                  <Loading />
                ) : !agents.data?.length ? (
                  <p className="muted">Nenhum agente disponível no cadastro.</p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      mutate("designacao", {
                        agenteId: Number(
                          new FormData(e.currentTarget).get("agenteId"),
                        ),
                      });
                    }}
                  >
                    <Field label="Agente / equipe">
                      <select
                        name="agenteId"
                        required
                        defaultValue={v.agenteId || ""}
                      >
                        <option value="" disabled>
                          Selecione o profissional
                        </option>
                        {agents.data.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nome + " · " + a.equipeNome}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Button busy={busy} disabled={!v.prioridade} type="submit">
                      Designar agente
                    </Button>
                    {!v.prioridade && (
                      <p className="muted mt-2">
                        Revise a prioridade primeiro.
                      </p>
                    )}
                  </form>
                )}
              </details>
              <details className="action-step" open={!!v.agenteId}>
                <summary>
                  <span>03</span>Agendar vistoria
                </summary>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    try {
                      mutate("agendamento", {
                        equipeId: v.equipeId,
                        agendadaPara: agendamentoIso(
                          f.get("data"),
                          f.get("hora"),
                        ),
                      });
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  <div className="form-grid">
                    <Field label="Data (DD/MM/AAAA)">
                      <input
                        name="data"
                        placeholder="25/12/2026"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                      />
                    </Field>
                    <Field label="Hora (HH:MM)">
                      <input
                        name="hora"
                        placeholder="14:30"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{2}:[0-9]{2}"
                      />
                    </Field>
                  </div>
                  <p className="form-note">
                    Informe uma data e hora futuras, no horário de São Paulo. O
                    sistema verifica a disponibilidade da equipe.
                  </p>
                  <Button busy={busy} disabled={!v.agenteId} type="submit">
                    <CalendarDays size={16} />
                    Confirmar agendamento
                  </Button>
                </form>
              </details>
            </section>
          )}
          {isAgent && v.status === "AGENDADA" && (
            <section className="card p-7">
              <h2>Pronto para iniciar?</h2>
              <p className="muted mb-5">
                Confira o endereço e o relato antes de registrar o início da
                vistoria.
              </p>
              <Button busy={busy} onClick={() => mutate("inicio")}>
                <Play size={16} />
                Iniciar vistoria
              </Button>
            </section>
          )}
          {isAgent && v.status === "EM_ANDAMENTO" && (
            <section className="card p-7">
              <span className="eyebrow">ATENDIMENTO EM CAMPO</span>
              <h2>Registre sua inspeção</h2>
              {[
                ["inspecao", "Condições observadas", v.inspecao],
                ["recomendacoes", "Orientações fornecidas", v.recomendacoes],
              ].map(([route, label, value]) => (
                <form
                  className="action-form"
                  key={route}
                  onSubmit={(e) => {
                    e.preventDefault();
                    mutate(route, {
                      texto: new FormData(e.currentTarget).get("texto"),
                    });
                  }}
                >
                  <Field label={label}>
                    <textarea
                      name="texto"
                      defaultValue={value || ""}
                      rows={4}
                      required
                      maxLength={1000}
                    />
                  </Field>
                  <Button variant="secondary" busy={busy} type="submit">
                    <ClipboardCheck size={16} />
                    Salvar {route === "inspecao" ? "inspeção" : "recomendações"}
                  </Button>
                </form>
              ))}
              <form
                className="action-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate("conclusao", {
                    resultado: new FormData(e.currentTarget).get("resultado"),
                  });
                }}
              >
                <Field label="Resumo final (opcional)">
                  <textarea
                    name="resultado"
                    rows={3}
                    maxLength={1000}
                    placeholder="Se ficar vazio, será usado o texto da inspeção."
                  />
                </Field>
                <Button busy={busy} disabled={!v.inspecao} type="submit">
                  <CheckCircle2 size={16} />
                  Concluir vistoria
                </Button>
                {!v.inspecao && (
                  <p className="muted mt-3">
                    Salve a inspeção antes de concluir.
                  </p>
                )}
              </form>
            </section>
          )}
          {gestor && ["PENDENTE", "CONCLUIDA"].includes(v.status) && (
            <section className="card p-7">
              <h2>Encerramento administrativo</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate("encerramento", {
                    texto: new FormData(e.currentTarget).get("texto"),
                  });
                }}
              >
                <Field label="Justificativa do encerramento">
                  <textarea name="texto" rows={3} maxLength={1000} required />
                </Field>
                <Button variant="secondary" busy={busy} type="submit">
                  Encerrar solicitação
                </Button>
              </form>
            </section>
          )}
        </div>
        <aside className="card history-card">
          <div className="history-title">
            <ShieldCheck size={20} />
            <h2>Histórico do cuidado</h2>
          </div>
          <p className="muted">O caminho deste atendimento.</p>
          {!history.data?.length ? (
            <Empty text="O histórico aparecerá aqui." />
          ) : (
            <ol className="timeline">
              {history.data.map((h) => (
                <li key={h.id}>
                  <span className="timeline-point" />
                  <small>{dataHora(h.registradoEm)}</small>
                  <h3>{ACOES[h.acao] || h.acao}</h3>
                  <p>{h.detalhe}</p>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </>
  );
}
