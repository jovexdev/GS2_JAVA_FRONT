import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  MapPin,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useApi } from "../hooks";
import { numero } from "../constants";
import {
  Button,
  ErrorState,
  Field,
  Loading,
  PageTitle,
} from "../components/ui";
const semana = (valor) =>
  String(valor).length === 6 ? String(valor).slice(4) : String(valor);
export default function GeoRadar() {
  const current = new Date().getFullYear();
  const [year, setYear] = useState(current - 1);
  const [draft, setDraft] = useState(current - 1);
  const state = useApi(
    "/epidemiologia/historico?municipio=3550308&ano=" + year,
  );
  const forecast = useApi(
    "/epidemiologia/previsao?municipio=3550308&ano=" + year,
  );
  const series = state.data?.indicadores || [];
  const latest = series.at(-1);
  const weeks = series.slice(-12);
  const maximum = Math.max(1, ...weeks.map((s) => s.casosNotificados || 0));
  return (
    <>
      <PageTitle
        eyebrow="INFORMAÇÃO PARA PREVENIR"
        title="GeoRadar"
        description="Um olhar sobre os indicadores epidemiológicos de São Paulo."
      />
      <form
        className="geo-filters card"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft === year) {
            state.reload();
            forecast.reload();
          } else setYear(Number(draft));
        }}
      >
        <Field label="Município">
          <input value="São Paulo · IBGE 3550308" readOnly />
        </Field>
        <Field label="Ano de referência">
          <select
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
          >
            {Array.from({ length: current - 2009 }, (_, i) => (
              <option key={current - i} value={current - i}>
                {current - i}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit">
          <RefreshCw size={16} />
          Consultar
        </Button>
      </form>
      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <ErrorState error={state.error} retry={state.reload} />
      ) : !series.length ? (
        <div className="card p-7">
          <p>Nenhum indicador disponível nesse período.</p>
        </div>
      ) : (
        <>
          <div className="metrics">
            {[
              [BarChart3, "Casos notificados", latest.casosNotificados],
              [TrendingUp, "Casos estimados", latest.casosEstimados],
              [MapPin, "Incidência por 100 mil", latest.incidenciaPor100Mil],
            ].map(([Icon, label, value]) => (
              <div key={label} className="metric-card card">
                <div className="metric-label">
                  <span>{label}</span>
                  <Icon size={20} />
                </div>
                <strong>{numero(value)}</strong>
                <small>
                  Última semana disponível · SE{" "}
                  {semana(latest.semanaEpidemiologica)}
                </small>
              </div>
            ))}
          </div>
          <div className="geo-grid">
            <section className="card map-card">
              <div className="card-heading">
                <div>
                  <h2>São Paulo no mapa</h2>
                  <p>
                    Visão municipal · a base cartográfica não representa focos
                    individuais.
                  </p>
                </div>
              </div>
              <iframe
                title="Mapa de São Paulo no OpenStreetMap"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-46.86%2C-23.73%2C-46.36%2C-23.36&layer=mapnik"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="map-footer">
                <span>Fonte cartográfica: OpenStreetMap</span>
                <a
                  className="text-link"
                  href="https://info.dengue.mat.br/alerta/3550308/dengue"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mapa epidemiológico InfoDengue
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </section>
            <section className="card p-6">
              <span className="eyebrow">LEITURA DO PERÍODO</span>
              <h2>Alerta municipal</h2>
              <div
                className={"alert-level level-" + (latest.nivelDeAlerta || 0)}
              >
                <span />
                {{ 1: "Verde", 2: "Amarelo", 3: "Laranja", 4: "Vermelho" }[
                  latest.nivelDeAlerta
                ] || "Sem informação"}
              </div>
              <p className="muted">
                Nível informado pelo InfoDengue na semana epidemiológica{" "}
                {semana(latest.semanaEpidemiologica)} de {year}.
              </p>
              <hr className="my-6 border-[var(--line)]" />
              <h3>Estimativa para a semana seguinte</h3>
              {forecast.loading ? (
                <Loading />
              ) : forecast.error ? (
                <p className="muted mt-3">{forecast.error}</p>
              ) : (
                <>
                  <strong className="forecast-number">
                    {numero(forecast.data?.casosEstimados)}
                  </strong>
                  <p className="muted">
                    casos ·{" "}
                    {forecast.data?.inicioDaSemana
                      ?.split("-")
                      .reverse()
                      .join("/")}
                  </p>
                  <p className="form-note">
                    {forecast.data?.metodo}. {forecast.data?.limitacoes}
                  </p>
                </>
              )}
            </section>
          </div>
          <section className="card chart-card">
            <div className="card-heading">
              <div>
                <h2>Evolução de casos notificados</h2>
                <p>
                  Últimas {weeks.length} semanas disponíveis de {year} · Fonte:{" "}
                  {state.data.fonte}
                </p>
              </div>
              <BarChart3 size={22} />
            </div>
            <div
              className="bar-chart"
              role="img"
              aria-label="Gráfico de casos notificados por semana epidemiológica"
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
                        semana(w.semanaEpidemiologica) +
                        ": " +
                        numero(w.casosNotificados) +
                        " casos"
                      }
                      className="chart-bar"
                      style={{
                        height:
                          (w.casosNotificados == null
                            ? 0
                            : Math.max(
                                1,
                                (w.casosNotificados / maximum) * 100,
                              )) + "%",
                      }}
                    />
                  </div>
                  <small>SE {semana(w.semanaEpidemiologica)}</small>
                </div>
              ))}
            </div>
            <p className="form-note px-6 pb-4">
              Os dados correspondem ao ano selecionado e podem sofrer
              atualizações na fonte.
            </p>
          </section>
        </>
      )}
    </>
  );
}
