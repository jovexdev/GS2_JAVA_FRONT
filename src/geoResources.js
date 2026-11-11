import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { normalizarMalha, normalizarMunicipios } from "./georadar";

export const CATALOGO_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome";
export const malhaUrl = (id) =>
  "https://servicodados.ibge.gov.br/api/v3/malhas/municipios/" +
  id +
  "?formato=application/vnd.geo+json&qualidade=intermediaria";
const cache = new Map();

async function buscarJson(url, { signal } = {}) {
  if (cache.has(url)) return cache.get(url);
  try {
    const resposta = await fetch(url, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    });
    if (!resposta.ok)
      throw new Error("Falha ao consultar o serviço geográfico.");
    const dados = await resposta.json();
    const resultado =
      url === CATALOGO_URL
        ? normalizarMunicipios(dados)
        : normalizarMalha(dados);
    cache.set(url, resultado);
    return resultado;
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Não foi possível consultar a geografia do município. Verifique a conexão e tente novamente.",
    );
  }
}
// A chave acompanha cada resposta para impedir que dados de outra cidade apareçam durante uma troca.
export function useGeoResource(chave, carregador = api) {
  const [versao, setVersao] = useState(0);
  const [estado, setEstado] = useState({
    chave: null,
    data: null,
    loading: true,
    error: "",
  });
  const reload = useCallback(() => {
    if (chave) cache.delete(chave);
    setVersao((v) => v + 1);
  }, [chave]);
  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;
    setEstado({ chave, data: null, loading: true, error: "" });
    carregador(chave, { signal: controller.signal })
      .then((data) => {
        if (ativo) setEstado({ chave, data, loading: false, error: "" });
      })
      .catch((error) => {
        if (ativo && error.name !== "AbortError")
          setEstado({
            chave,
            data: null,
            loading: false,
            error: error.message,
          });
      });
    return () => {
      ativo = false;
      controller.abort();
    };
  }, [chave, carregador, versao]);
  const atual =
    estado.chave === chave ? estado : { data: null, loading: true, error: "" };
  return { ...atual, reload };
}
export const useMunicipios = () => useGeoResource(CATALOGO_URL, buscarJson);
export const useMalha = (id) => useGeoResource(malhaUrl(id), buscarJson);
