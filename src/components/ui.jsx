import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PRIORIDADE, STATUS, dataHora } from "../constants";
export function Brand({ light = false, compact = false }) {
  return (
    <div className={"brand " + (light ? "brand-light" : "")}>
      <span className="brand-symbol">
        <img src="/aegis-original.png" alt="" />
      </span>
      <div>
        <span className="brand-word">AEGIS</span>
        {!compact && <span className="brand-caption">REDE DE PROTEÇÃO</span>}
      </div>
    </div>
  );
}
export function Button({
  children,
  variant = "primary",
  busy,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={"button button-" + variant + " " + className}
      disabled={busy || props.disabled}
    >
      {busy && <LoaderCircle size={17} className="animate-spin" />}
      {children}
    </button>
  );
}
export function Alert({ children, type = "error" }) {
  return children ? (
    <div
      role={type === "error" ? "alert" : "status"}
      className={"alert alert-" + type}
    >
      {type === "error" ? (
        <AlertCircle size={18} />
      ) : (
        <CheckCircle2 size={18} />
      )}
      <span>{children}</span>
    </div>
  ) : null;
}
export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="animate-spin" size={22} /> Carregando
      informações…
    </div>
  );
}
export function Empty({
  title = "Tudo começa com um primeiro passo",
  text = "Seus registros aparecerão aqui.",
  children,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <ShieldCheck size={30} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div className="card p-6">
      <Alert>{error}</Alert>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          <RefreshCw size={16} />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow || "REDE AEGIS"}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
export function Badge({ value, priority = false }) {
  return (
    <span className={"badge badge-" + (value || "default").toLowerCase()}>
      <span />
      {(priority ? PRIORIDADE : STATUS)[value] ||
        (priority ? "A definir" : "Aguardando análise")}
    </span>
  );
}
export function AttendanceList({ items = [], emptyText }) {
  if (!items.length)
    return (
      <Empty
        title="Nenhum atendimento por aqui"
        text={
          emptyText || "Os atendimentos disponíveis aparecerão nesta lista."
        }
      />
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Atendimento</th>
            <th>Situação</th>
            <th>Prioridade</th>
            <th>Equipe / agendamento</th>
            <th>
              <span className="sr-only">Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id}>
              <td>
                <strong>Vistoria #{v.id}</strong>
                <small>Ocorrência #{v.ocorrenciaId}</small>
              </td>
              <td>
                <Badge value={v.status} />
              </td>
              <td>
                <Badge value={v.prioridade} priority />
              </td>
              <td>
                {v.equipeNome || "Equipe a definir"}
                <small>{dataHora(v.agendadaPara)}</small>
              </td>
              <td>
                <Link
                  className="icon-link"
                  to={"/app/atendimentos/" + v.id}
                  aria-label={"Abrir atendimento " + v.id}
                >
                  <ArrowRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Location({ children }) {
  return (
    <span className="location">
      <MapPin size={14} />
      {children}
    </span>
  );
}
