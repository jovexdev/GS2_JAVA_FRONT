import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  Map,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../auth";
import { useApi } from "../hooks";
import { PERFIS } from "../constants";
import {
  AttendanceList,
  ErrorState,
  Loading,
  PageTitle,
} from "../components/ui";
export default function Dashboard() {
  const { user } = useAuth();
  const visits = useApi("/vistorias");
  const reports = useApi(user.perfil === "AGENTE" ? null : "/ocorrencias");
  if (visits.loading || reports.loading) return <Loading />;
  if (visits.error || reports.error)
    return (
      <ErrorState
        error={visits.error || reports.error}
        retry={() => {
          visits.reload();
          reports.reload();
        }}
      />
    );
  const list = visits.data || [];
  const occurrences = reports.data || [];
  const done = list.filter((v) =>
    ["CONCLUIDA", "ENCERRADA"].includes(v.status),
  ).length;
  const pending = list.filter((v) => v.status === "PENDENTE").length;
  const scheduled = list.filter((v) =>
    ["AGENDADA", "EM_ANDAMENTO"].includes(v.status),
  ).length;
  const isPublic = ["CIDADAO", "EMPRESA"].includes(user.perfil);
  const action = isPublic
    ? "/app/nova-ocorrencia"
    : user.perfil === "GESTOR"
      ? "/app/ocorrencias"
      : "/app/atendimentos";
  const actionLabel = isPublic
    ? "Registrar ocorrência"
    : user.perfil === "GESTOR"
      ? "Analisar ocorrências"
      : "Ver minhas vistorias";
  const title =
    user.perfil === "GESTOR"
      ? "Cuidado que se transforma em ação."
      : user.perfil === "AGENTE"
        ? "Sua próxima ação faz a diferença."
        : "Juntos, protegemos o que importa.";
  return (
    <>
      <PageTitle
        eyebrow={"MEU ESPAÇO / " + PERFIS[user.perfil].nome.toUpperCase()}
        title={"Olá, " + user.nome.split(" ")[0] + "."}
        description="Acompanhe o que acontece na sua rede de proteção."
      >
        <Link className="button button-secondary" to={action}>
          <FilePlus2 size={17} />
          {actionLabel}
        </Link>
      </PageTitle>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">CONECTADOS PELA PREVENÇÃO</span>
          <h2>{title}</h2>
          <p>
            {isPublic
              ? "Um relato pode iniciar uma mudança. Acompanhe seus registros e participe do cuidado com a comunidade."
              : "Informação organizada para decidir, atender e acompanhar cada etapa do cuidado."}
          </p>
          <Link to={action}>
            {actionLabel}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-mark" aria-hidden="true">
          <ShieldCheck size={120} strokeWidth={1} />
          <span className="welcome-orbit" />
        </div>
      </section>
      <div className="metrics">
        {[
          [
            ClipboardList,
            user.perfil === "AGENTE"
              ? "Vistorias atribuídas"
              : "Ocorrências registradas",
            user.perfil === "AGENTE" ? list.length : occurrences.length,
            "Informações do seu perfil",
          ],
          [
            CalendarDays,
            "Atendimentos em curso",
            scheduled,
            "Agendados ou em andamento",
          ],
          [
            CheckCircle2,
            "Atendimentos finalizados",
            done,
            "Concluídos ou encerrados",
          ],
        ].map(([Icon, label, value, hint]) => (
          <section className="metric-card card" key={label}>
            <div className="metric-label">
              <span>{label}</span>
              <Icon size={20} />
            </div>
            <strong>{value}</strong>
            <small>{hint}</small>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card">
          <div className="card-heading">
            <div>
              <h2>
                {user.perfil === "AGENTE"
                  ? "Seu roteiro de atendimentos"
                  : "Últimos atendimentos"}
              </h2>
              <p>Do primeiro registro à conclusão.</p>
            </div>
            <Link className="text-link" to="/app/atendimentos">
              Ver todos
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <AttendanceList items={list.slice(0, 4)} />
        </section>
        <section className="care-card card">
          <span className="eyebrow">CADA ETAPA IMPORTA</span>
          <h2>
            Prevenir é um
            <br />
            esforço coletivo.
          </h2>
          <div className="care-steps">
            <div>
              <span>01</span>
              <p>
                Observe seu ambiente.<small>O cuidado começa por perto.</small>
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                Compartilhe informações.<small>Relatos conectam a rede.</small>
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                Acompanhe as ações.<small>Cada etapa fica registrada.</small>
              </p>
            </div>
          </div>
          {user.perfil === "CIDADAO" ? (
            <Link className="text-link" to="/app/georadar">
              <Map size={17} />
              Explorar o GeoRadar
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link className="text-link" to="/app/atendimentos">
              Acompanhar atendimentos
              <ArrowRight size={16} />
            </Link>
          )}
        </section>
      </div>
      {user.perfil === "GESTOR" && (
        <p className="muted mt-4">
          {pending} atendimento(s) pendente(s) de organização. A classificação
          preliminar deve ser revisada pela gestão.
        </p>
      )}
    </>
  );
}
