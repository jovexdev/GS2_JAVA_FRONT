import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  MapPin,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { numero } from "../constants";
import {
  classificarCasos,
  nomeMunicipio,
  SITUACOES,
  ultimaSemana,
  semanaEpidemiologica,
} from "../georadar";
import { useGeoResource, useMalha, useMunicipios } from "../geoResources";
import MunicipioSearch from "../components/MunicipioSearch";
import MunicipioMap from "../components/MunicipioMap";
import { Alert, Button, Field, PageTitle } from "../components/ui";

const INICIAL = { id: 3550308, nome: "São Paulo", uf: "SP" };
const NOMES_ALERTA = { 1: "Verde", 2: "Amarelo", 3: "Laranja", 4: "Vermelho" };
export default function GeoRadar() {
  const current = new Date().getFullYear();
  const [municipio, setMunicipio] = useState(INICIAL);
  const [year, setYear] = useState(current);
  const catalogo = useMunicipios();
  const malha = useMalha(municipio.id);
  const query = "?municipio=" + municipio.id + "&ano=" + year;
  const historico = useGeoResource("/epidemiologia/historico" + query);
  const previsao = useGeoResource("/epidemiologia/previsao" + query);
  const series = [...(historico.data?.indicadores || [])].sort((a, b) =>
    String(a.inicioDaSemana).localeCompare(String(b.inicioDaSemana)),
  );
  const latest = ultimaSemana(series);
  const situacao = classificarCasos(latest?.casosNotificados);
  const weeks = series.slice(-12);
  const maximum = Math.max(1, ...weeks.map((s) => s.casosNotificados || 0));
  const periodo = latest
    ? "SE " +
      semanaEpidemiologica(latest.semanaEpidemiologica) +
      " · semana iniciada em " +
      latest.inicioDaSemana.split("-").reverse().join("/")
    : "Ano de referência: " + year;
  function atualizar() {
    historico.reload();
    previsao.reload();
    malha.reload();
  }
  return (
    <>
      <PageTitle
        eyebrow="INFORMAÇÃO PARA PREVENIR"
        title="GeoRadar"
        description="Encontre seu município e acompanhe os casos no território."
      />
      <div className="geo-filters card geo-filters-dynamic">
        <MunicipioSearch
          value={municipio}
          onChange={setMunicipio}
          catalogo={catalogo}
        />
        <Field label="Ano dos dados">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: current - 2009 }, (_, i) => (
              <option key={current - i} value={current - i}>
                {current - i}
              </option>
            ))}
          </select>
        </Field>
        <Button type="button" variant="secondary" onClick={atualizar}>
          <RefreshCw size={16} />
          Atualizar
        </Button>
      </div>
      <p className="geo-selection-note">
        <MapPin size={14} />
        <strong>{nomeMunicipio(municipio)}</strong>
        <span>{periodo}</span>
      </p>
      {historico.error && <Alert>{historico.error}</Alert>}
      {!historico.loading && !historico.error && !series.length && (
        <div className="geo-info-note" role="status">
          Não há indicadores disponíveis para esse município no ano selecionado.
          O mapa permanece sem classificação.
        </div>
      )}
      <div className="metrics geo-metrics">
        {[
          [BarChart3, "Casos notificados", latest?.casosNotificados],
          [TrendingUp, "Casos estimados", latest?.casosEstimados],
          [MapPin, "Incidência por 100 mil", latest?.incidenciaPor100Mil],
        ].map(([Icon, label, value]) => (
          <div key={label} className="metric-card card">
            <div className="metric-label">
              <span>{label}</span>
              <Icon size={20} />
            </div>
            <strong>{historico.loading ? "…" : numero(value)}</strong>
            <small>
              {historico.loading
                ? "Consultando o município…"
                : "Última semana disponível do ano selecionado"}
            </small>
          </div>
        ))}
      </div>
      <div className="geo-territory-grid">
        <MunicipioMap
          municipio={municipio}
          malha={malha}
          situacao={situacao}
          casos={latest?.casosNotificados}
          carregandoDados={historico.loading}
        />
        <aside className="card geo-risk-card">
          <span className="eyebrow">CLASSIFICAÇÃO AEGIS</span>
          <h2>Situação no período</h2>
          <span className="academic-chip">Métrica acadêmica</span>
          <div
            className="risk-state"
            style={{ "--situacao": situacao.cor }}
            aria-live="polite"
          >
            <span />
            {historico.loading ? "Consultando…" : situacao.nome}
          </div>
          <p className="risk-number">
            {historico.loading ? "…" : numero(latest?.casosNotificados)}
            <small>casos notificados na última semana disponível</small>
          </p>
          <p className="muted">{periodo}</p>
          <div className="risk-rule-note">
            <strong>Como a cor é definida?</strong>
            <p>
              A classificação usa a quantidade de casos notificados nessa
              semana.
            </p>
            {[SITUACOES.OK, SITUACOES.INSTAVEL, SITUACOES.CRITICO].map((s) => (
              <div key={s.codigo}>
                <span style={{ background: s.cor }} />
                <strong>{s.nome}</strong>
                <small>{s.faixa}</small>
              </div>
            ))}
          </div>
          <p className="form-note">
            Escala de demonstração do protótipo. Sem dados disponíveis, o
            município fica cinza e sem classificação.
          </p>
          <div className="official-alert">
            <span className="label-caps">ALERTA PUBLICADO PELO INFODENGUE</span>
            <strong>
              {NOMES_ALERTA[latest?.nivelDeAlerta] || "Sem informação"}
            </strong>
            <p>
              O alerta da fonte segue seus próprios critérios epidemiológicos.
            </p>
            <a
              className="text-link"
              href={
                "https://info.dengue.mat.br/alerta/" + municipio.id + "/dengue"
              }
              target="_blank"
              rel="noreferrer"
            >
              Consultar InfoDengue
              <ArrowUpRight size={14} />
            </a>
          </div>
        </aside>
      </div>
      <section className="card geo-forecast-card">
        <div>
          <span className="eyebrow">PRÓXIMA SEMANA DO PERÍODO</span>
          <h2>Estimativa de casos</h2>
          <p className="muted">{nomeMunicipio(municipio)}</p>
        </div>
        <div>
          {previsao.loading ? (
            <p className="muted" role="status">
              Calculando estimativa…
            </p>
          ) : previsao.error ? (
            <p className="muted">{previsao.error}</p>
          ) : (
            <>
              <strong className="forecast-number">
                {numero(previsao.data?.casosEstimados)}
              </strong>
              <p className="muted">
                Semana iniciada em{" "}
                {previsao.data?.inicioDaSemana?.split("-").reverse().join("/")}
              </p>
            </>
          )}
        </div>
        {previsao.data && (
          <p className="form-note">
            {previsao.data.metodo}. {previsao.data.limitacoes}
          </p>
        )}
      </section>
      <section className="card chart-card">
        <div className="card-heading">
          <div>
            <h2>Evolução de casos notificados</h2>
            <p>
              {nomeMunicipio(municipio)} · {year} · Fonte: InfoDengue
            </p>
          </div>
          <BarChart3 size={22} />
        </div>
        {historico.loading ? (
          <div className="geo-chart-placeholder" role="status">
            Consultando a evolução de casos…
          </div>
        ) : !weeks.length ? (
          <div className="geo-chart-placeholder">
            Gráfico indisponível para esse período.
          </div>
        ) : (
          <div
            className="bar-chart"
            role="img"
            aria-label={
              "Casos notificados por semana em " + nomeMunicipio(municipio)
            }
          >
            {weeks.map((w) => (
              <div className="chart-column" key={w.semanaEpidemiologica}>
                <span className="chart-value">
                  {numero(w.casosNotificados)}
                </span>
                <div className="chart-bar-space">
                  <div
                    title={
                      "Semana " +
                      semanaEpidemiologica(w.semanaEpidemiologica) +
                      ": " +
                      numero(w.casosNotificados) +
                      " casos"
                    }
                    className="chart-bar"
                    style={{
                      height:
                        (w.casosNotificados == null || w.casosNotificados <= 0
                          ? 0
                          : Math.max(1, (w.casosNotificados / maximum) * 100)) +
                        "%",
                    }}
                  />
                </div>
                <small>SE {semanaEpidemiologica(w.semanaEpidemiologica)}</small>
              </div>
            ))}
          </div>
        )}
        <p className="form-note px-6 pb-4">
          Os dados correspondem ao ano selecionado e podem ser revisados pelo
          InfoDengue. Os casos exibidos não indicam a localização individual de
          cada ocorrência.
        </p>
      </section>
    </>
  );
}
