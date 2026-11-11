import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  HeartPulse,
  LocateFixed,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { api } from "../api";
import { useGeoResource, useMunicipios } from "../geoResources";
import { filtrarUnidades, rotaUnidade } from "../saude";
import { numero } from "../constants";
import MunicipioSearch from "../components/MunicipioSearch";
import UnidadesSaudeMap from "../components/UnidadesSaudeMap";
import {
  Alert,
  Button,
  Empty,
  ErrorState,
  Field,
  Loading,
  PageTitle,
} from "../components/ui";
const FONTE = "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/dengue";
const INICIAL = { id: 3550308, nome: "São Paulo", uf: "SP" };
const TEXTO_URGENCIA =
  "Procure um serviço de urgência agora. Não aguarde a LIA para buscar atendimento.";

export default function MinhaSaude() {
  return (
    <>
      <PageTitle
        eyebrow="CUIDADO DO CIDADÃO"
        title="Minha saúde"
        description="Orientação inicial sobre sintomas e unidades SUS para procurar atendimento."
      />
      <div className="health-intro">
        <div>
          <span className="lia-avatar">
            <HeartPulse size={25} />
          </span>
          <div>
            <h2>Informação para dar o próximo passo.</h2>
            <p>
              A LIA ajuda a organizar o que você está sentindo. A avaliação de
              um profissional é necessária para confirmar ou descartar dengue.
            </p>
          </div>
        </div>
        <a className="button button-secondary" href="#unidades-saude">
          <MapPin size={17} />
          Encontrar atendimento
        </a>
      </div>
      <OrientacaoSintomas />
      <UnidadesProximas />
    </>
  );
}
function OrientacaoSintomas() {
  const [alerta, setAlerta] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const pedido = useRef(0);
  useEffect(
    () => () => {
      pedido.current++;
    },
    [],
  );
  function descartar() {
    pedido.current++;
    setBusy(false);
    setResultado(null);
    setError("");
  }
  const urgente = alerta === "SIM" || alerta === "NAO_SEI";
  async function submit(e) {
    e.preventDefault();
    setError("");
    setResultado(null);
    setBusy(true);
    const atual = ++pedido.current;
    const f = new FormData(e.currentTarget);
    try {
      const resposta = await api("/cidadao/orientacao", {
        method: "POST",
        body: {
          alerta,
          sintomas: f.get("sintomas"),
          inicio: f.get("inicio"),
          evolucao: f.get("evolucao"),
          consentimento: f.has("consentimento"),
        },
      });
      if (atual === pedido.current) setResultado(resposta);
    } catch (e) {
      if (atual === pedido.current) setError(e.message);
    } finally {
      if (atual === pedido.current) setBusy(false);
    }
  }
  return (
    <section className="card health-questionnaire">
      <div className="card-heading">
        <div>
          <span className="eyebrow">ORIENTAÇÃO COM A LIA</span>
          <h2>Como você está se sentindo?</h2>
          <p>
            Responda com suas palavras, sem incluir documentos, nome completo ou
            endereço.
          </p>
        </div>
        <Sparkles size={22} />
      </div>
      <form
        onSubmit={submit}
        onReset={() => {
          setAlerta("");
          descartar();
        }}
      >
        <div className="health-alarm-reference">
          <TriangleAlert size={21} />
          <div>
            <h3>Primeiro, verifique sinais de alarme</h3>
            <p>
              Dor forte e contínua na barriga, vômitos persistentes,
              sangramento, desmaio, falta de ar ou confusão precisam de atenção
              imediata.
            </p>
            <a
              className="text-link"
              href={FONTE}
              target="_blank"
              rel="noreferrer"
            >
              Orientações do Ministério da Saúde
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
        <fieldset className="health-alarm-choice">
          <legend>
            Você apresenta algum desses sinais ou não consegue reconhecê-los?
          </legend>
          {[
            ["SIM", "Sim, tenho algum desses sinais"],
            ["NAO", "Não identifiquei esses sinais"],
            ["NAO_SEI", "Não sei reconhecer"],
          ].map(([v, label]) => (
            <label key={v}>
              <input
                type="radio"
                name="alerta"
                value={v}
                checked={alerta === v}
                onChange={() => {
                  setAlerta(v);
                  descartar();
                }}
                required
              />
              {label}
            </label>
          ))}
        </fieldset>
        {urgente ? (
          <div className="health-urgent" role="alert">
            <TriangleAlert size={24} />
            <div>
              <h3>Priorize atendimento presencial</h3>
              <p>{TEXTO_URGENCIA}</p>
              <p>
                Se você não consegue reconhecer os sinais, procure avaliação
                presencial para esclarecer a situação.
              </p>
              <a className="button button-danger" href="#unidades-saude">
                Ver unidades de atendimento
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="health-answer-grid">
              <Field label="1. O que você está sentindo?">
                <textarea
                  name="sintomas"
                  maxLength={1200}
                  rows={4}
                  required
                  placeholder="Descreva os sintomas que você percebeu."
                />
              </Field>
              <Field label="2. Quando os sintomas começaram?">
                <textarea
                  name="inicio"
                  maxLength={200}
                  rows={4}
                  required
                  placeholder="Conte há quanto tempo isso começou."
                />
              </Field>
            </div>
            <Field label="3. Como você está agora?">
              <textarea
                name="evolucao"
                maxLength={600}
                rows={3}
                required
                placeholder="Conte se houve melhora, piora ou mudança nos sintomas."
              />
            </Field>
            <label className="checkbox-row health-consent">
              <input type="checkbox" name="consentimento" required />
              Autorizo o envio destas respostas à OpenAI para receber orientação
              da LIA.
            </label>
            <p className="form-note">
              As respostas não são gravadas no banco do AEGIS. A LIA usa a chave
              GPT do backend e pode consumir os créditos já contratados.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button busy={busy} disabled={!alerta} type="submit">
                <Sparkles size={17} />
                {busy ? "Organizando seu relato…" : "Receber orientação"}
              </Button>
              <Button disabled={busy} variant="secondary" type="reset">
                Limpar respostas
              </Button>
            </div>
          </>
        )}
        <Alert>{error}</Alert>
        {resultado && (
          <div
            className={
              "health-result " + (resultado.urgente ? "is-urgent" : "")
            }
            role={resultado.urgente ? "alert" : "status"}
          >
            <span className="eyebrow">
              {resultado.iaUtilizada
                ? "LIA · ORIENTAÇÃO INICIAL"
                : "ORIENTAÇÃO DE REFERÊNCIA"}
            </span>
            <h3>{resultado.titulo}</h3>
            <p>{resultado.orientacao}</p>
            {resultado.trechosDoRelato?.length > 0 && (
              <>
                <h4>Informações do seu relato para levar à consulta</h4>
                <ul>
                  {resultado.trechosDoRelato.map((t) => (
                    <li key={t}>“{t}”</li>
                  ))}
                </ul>
              </>
            )}
            <p className="health-result-limit">{resultado.limite}</p>
            {resultado.aviso && <p className="muted">{resultado.aviso}</p>}
            <div className="flex flex-wrap gap-4 mt-4">
              <a className="text-link" href="#unidades-saude">
                Encontrar atendimento
                <ArrowRight size={16} />
              </a>
              <a
                className="text-link"
                href={resultado.fonte}
                target="_blank"
                rel="noreferrer"
              >
                Fonte: Ministério da Saúde
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
function UnidadesProximas() {
  const [municipio, setMunicipio] = useState(INICIAL);
  const catalogo = useMunicipios();
  const state = useGeoResource(
    "/cidadao/unidades-saude?municipio=" + municipio.id,
  );
  const [busca, setBusca] = useState("");
  const [origem, setOrigem] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [selecionada, setSelecionada] = useState(null);
  const [modo, setModo] = useState("driving");
  const unidades = useMemo(
    () => filtrarUnidades(state.data?.unidades || [], busca, origem),
    [state.data, busca, origem],
  );
  function escolherCidade(m) {
    setMunicipio(m);
    setSelecionada(null);
    setBusca("");
  }
  function localizar() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError(
        "A localização não está disponível. Você pode continuar buscando por bairro.",
      );
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setOrigem({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setGeoBusy(false);
      },
      () => {
        setGeoError(
          "Não foi possível obter sua localização. A busca por município e bairro continua disponível.",
        );
        setGeoBusy(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  return (
    <section id="unidades-saude" className="health-units-section">
      <PageTitle
        eyebrow="ACESSO AO ATENDIMENTO SUS"
        title="UPAs e pronto atendimento"
        description="Encontre unidades de pronto atendimento SUS cadastradas no CNES no município escolhido."
      />
      <div className="card health-filters">
        <MunicipioSearch
          value={municipio}
          onChange={escolherCidade}
          catalogo={catalogo}
          instrucao="Selecione um resultado para consultar as unidades de saúde."
        />
        <Button variant="secondary" busy={geoBusy} onClick={localizar}>
          <LocateFixed size={17} />
          Usar minha localização
        </Button>
        {origem && (
          <Button variant="text" onClick={() => setOrigem(null)}>
            Remover localização
          </Button>
        )}
      </div>
      <p className="form-note">
        Sua localização ordena as unidades por distância em linha reta dentro do
        município selecionado. Ela fica no navegador até você abrir uma rota.
        Sem localização, busque pelo bairro.
      </p>
      <Alert>{geoError}</Alert>
      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <ErrorState error={state.error} retry={state.reload} />
      ) : (
        <>
          <div className="list-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                aria-label="Buscar unidade por bairro ou nome"
                placeholder="Digite o bairro ou o nome da unidade…"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setSelecionada(null);
                }}
              />
            </label>
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value)}
              aria-label="Meio de transporte"
            >
              <option value="driving">Trajeto de carro</option>
              <option value="walking">Trajeto a pé</option>
            </select>
          </div>
          <div className="health-results-summary">
            <strong>{unidades.length} unidade(s) encontrada(s)</strong>
            <span>
              {origem
                ? "Ordenadas por distância em linha reta"
                : "Organizadas por nome"}{" "}
              · {municipio.nome} / {municipio.uf}
            </span>
          </div>
          <div className="health-unit-grid">
            <section className="card health-unit-map">
              <div className="card-heading">
                <div>
                  <h2>Atendimento no território</h2>
                  <p>
                    Pontos verdes: unidades SUS · Ponto azul: sua localização,
                    quando autorizada.
                  </p>
                </div>
                <MapPin size={21} />
              </div>
              <UnidadesSaudeMap
                unidades={unidades}
                origem={origem}
                selecionada={selecionada}
                onSelect={setSelecionada}
                municipio={municipio}
              />
              <div className="map-footer">
                <span>
                  Cadastro: CNES / Ministério da Saúde · Mapa: OpenStreetMap
                </span>
              </div>
            </section>
            <div className="health-unit-list">
              {!unidades.length ? (
                <div className="card">
                  <Empty
                    title="Nenhuma unidade encontrada"
                    text={
                      busca
                        ? "Altere o bairro ou limpe a busca para ver o município inteiro."
                        : "Não há pronto atendimento SUS ativo retornado pelo CNES nesta consulta."
                    }
                  />
                </div>
              ) : (
                unidades.map((u) => (
                  <article
                    className={
                      "card health-unit " +
                      (selecionada === u.codigoCnes
                        ? "health-unit-selected"
                        : "")
                    }
                    key={u.codigoCnes}
                  >
                    <span className="role-chip">{u.tipo}</span>
                    <h3>{u.nome}</h3>
                    <p>
                      <MapPin size={14} />
                      {[u.endereco, u.bairro].filter(Boolean).join(" · ") ||
                        "Endereço não informado"}
                    </p>
                    {u.telefone && (
                      <p>
                        <Phone size={13} />
                        <a
                          href={
                            "tel:" +
                            u.telefone.split(/[\/;]/)[0].replace(/[^0-9+]/g, "")
                          }
                        >
                          {u.telefone}
                        </a>
                      </p>
                    )}
                    {u.distancia != null && (
                      <p className="health-distance">
                        {numero(u.distancia)} km em linha reta
                      </p>
                    )}
                    <small>
                      Horário informado no cadastro:{" "}
                      {u.turnoCadastrado || "Não informado"}
                      <br />
                      Atualização do cadastro:{" "}
                      {u.atualizadoEm || "Não informada"}
                    </small>
                    <div className="health-unit-actions">
                      {u.latitude != null && u.longitude != null ? (
                        <Button
                          variant="text"
                          onClick={() => setSelecionada(u.codigoCnes)}
                        >
                          Ver no mapa
                        </Button>
                      ) : (
                        <span className="muted">
                          Sem coordenadas cadastradas
                        </span>
                      )}
                      <a
                        className="button button-secondary"
                        target="_blank"
                        rel="noreferrer"
                        href={rotaUnidade(u, municipio, origem, modo)}
                      >
                        Traçar rota
                        <ArrowUpRight size={15} />
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
          <div className="health-source-note">
            <ShieldCheck size={18} />
            <p>
              O CNES informa o cadastro, sem confirmar funcionamento, vagas ou
              espera em tempo real. O botão de rota abre a navegação no Google
              Maps, sem chave de API paga para o AEGIS. As respostas sobre
              sintomas não são enviadas ao mapa.
              <br />
              <a
                href="https://apidadosabertos.saude.gov.br/"
                target="_blank"
                rel="noreferrer"
              >
                Consultar a fonte CNES
              </a>
            </p>
          </div>
        </>
      )}
    </section>
  );
}
