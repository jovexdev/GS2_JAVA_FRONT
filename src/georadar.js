// Regra acadêmica do AEGIS. Estes limites não reproduzem o modelo do InfoDengue.
export const LIMITES_AEGIS = Object.freeze({ instavel: 100, critico: 300 });
export const SITUACOES = Object.freeze({
  OK: {
    codigo: "OK",
    nome: "OK",
    cor: "#50a45b",
    faixa: "0 a " + (LIMITES_AEGIS.instavel - 1) + " casos",
  },
  INSTAVEL: {
    codigo: "INSTAVEL",
    nome: "Instável",
    cor: "#e5a42b",
    faixa:
      LIMITES_AEGIS.instavel + " a " + (LIMITES_AEGIS.critico - 1) + " casos",
  },
  CRITICO: {
    codigo: "CRITICO",
    nome: "Crítico",
    cor: "#d65a51",
    faixa: LIMITES_AEGIS.critico + " casos ou mais",
  },
  SEM_DADOS: {
    codigo: "SEM_DADOS",
    nome: "Sem dados",
    cor: "#9aa7a1",
    faixa: "Sem classificação",
  },
});
export function classificarCasos(casos) {
  if (typeof casos !== "number" || !Number.isFinite(casos) || casos < 0)
    return SITUACOES.SEM_DADOS;
  if (casos >= LIMITES_AEGIS.critico) return SITUACOES.CRITICO;
  if (casos >= LIMITES_AEGIS.instavel) return SITUACOES.INSTAVEL;
  return SITUACOES.OK;
}
export function normalizarBusca(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function normalizarMunicipios(dados) {
  if (!Array.isArray(dados))
    throw new Error("Não foi possível ler a lista de municípios.");
  return dados
    .map((item) => ({
      id: Number(item.id),
      nome: item.nome,
      uf:
        item.microrregiao?.mesorregiao?.UF?.sigla ||
        item["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla,
    }))
    .filter((item) => /^\d{7}$/.test(String(item.id)) && item.nome && item.uf)
    .sort(
      (a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR") || a.uf.localeCompare(b.uf),
    );
}
export const nomeMunicipio = (municipio) =>
  municipio.nome + " / " + municipio.uf;
export function buscarMunicipios(municipios, termo, limite = 8) {
  const busca = normalizarBusca(termo);
  if (busca.length < 2) return [];
  const partes = busca.split(" ");
  return municipios
    .filter((m) => {
      const texto = normalizarBusca(m.nome + " " + m.uf);
      return partes.every((parte) => texto.includes(parte));
    })
    .sort((a, b) => {
      const score = (m) =>
        normalizarBusca(m.nome) === busca
          ? 0
          : normalizarBusca(m.nome).startsWith(busca)
            ? 1
            : 2;
      return score(a) - score(b);
    })
    .slice(0, limite);
}
export function normalizarMalha(dados) {
  const features =
    dados?.type === "FeatureCollection"
      ? dados.features
      : dados?.type === "Feature"
        ? [dados]
        : [];
  const poligonos = (features || []).filter((f) =>
    ["Polygon", "MultiPolygon"].includes(f.geometry?.type),
  );
  if (!poligonos.length)
    throw new Error("O limite municipal não está disponível neste momento.");
  return { type: "FeatureCollection", features: poligonos };
}
export function ultimaSemana(indicadores = []) {
  return indicadores.length
    ? indicadores.reduce((ultima, atual) =>
        String(atual.inicioDaSemana || "") > String(ultima.inicioDaSemana || "")
          ? atual
          : ultima,
      )
    : null;
}
export function semanaEpidemiologica(valor) {
  return String(valor).length === 6 ? String(valor).slice(4) : String(valor);
}
