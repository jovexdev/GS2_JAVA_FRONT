export const PERFIS = {
  GESTOR: {
    nome: "Gestor",
    descricao: "Organize o cuidado",
    detalhe: "Análise, equipes e vistorias",
    email: "gestor@demo.aegis.test",
  },
  AGENTE: {
    nome: "Agente",
    descricao: "Atue em campo",
    detalhe: "Inspeções e recomendações",
    email: "agente.norte@demo.aegis.test",
  },
  CIDADAO: {
    nome: "Cidadão",
    descricao: "Faça parte da prevenção",
    detalhe: "Informação e participação",
    email: "cidadao@demo.aegis.test",
  },
  EMPRESA: {
    nome: "Empresa",
    descricao: "Cuide do seu espaço",
    detalhe: "Estabelecimento e atendimento",
    email: "empresa@demo.aegis.test",
  },
};
export const SENHA_DEMO = "AegisDemo2026";
export const STATUS = {
  PENDENTE: "Pendente",
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  ENCERRADA: "Encerrada",
};
export const PRIORIDADE = {
  CRITICA: "Crítica",
  INSTAVEL: "Instável",
  OK: "OK",
};
export const ACOES = {
  SOLICITADA: "Solicitação recebida",
  ENCAMINHADA: "Ocorrência encaminhada",
  REVISADA: "Prioridade revisada",
  DESIGNADA: "Agente designado",
  AGENDADA: "Vistoria agendada",
  INICIADA: "Vistoria iniciada",
  INSPECAO: "Inspeção registrada",
  RECOMENDACOES: "Recomendações registradas",
  CONCLUIDA: "Inspeção concluída",
  ENCERRADA: "Encerramento administrativo",
};
export function dataHora(value) {
  if (!value) return "A definir";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
export const numero = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(
        value,
      );
