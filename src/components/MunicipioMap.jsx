import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, LoaderCircle, MapPin } from "lucide-react";
import { nomeMunicipio, SITUACOES } from "../georadar";
import { numero } from "../constants";
import { Button } from "./ui";

function popupMunicipio(municipio, situacao, casos) {
  const box = document.createElement("div");
  box.className = "municipio-popup";
  const titulo = document.createElement("strong");
  titulo.textContent = nomeMunicipio(municipio);
  const status = document.createElement("p");
  status.textContent = "Classificação AEGIS: " + situacao.nome;
  const quantidade = document.createElement("p");
  quantidade.textContent =
    casos == null
      ? "Casos não disponíveis no período."
      : numero(casos) + " casos notificados na semana.";
  box.append(titulo, status, quantidade);
  return box;
}
export default function MunicipioMap({
  municipio,
  malha,
  situacao,
  casos,
  carregandoDados,
}) {
  const host = useRef(null),
    map = useRef(null),
    layer = useRef(null),
    lastGeometry = useRef(null);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const instance = L.map(host.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([-14.2, -51.9], 4);
    map.current = instance;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      },
    ).addTo(instance);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("loading", () => setTileError(false));
    L.control
      .zoom({
        position: "topright",
        zoomInTitle: "Aproximar",
        zoomOutTitle: "Afastar",
      })
      .addTo(instance);
    L.control
      .scale({ imperial: false, position: "bottomleft" })
      .addTo(instance);
    const observer = new ResizeObserver(() => {
      instance.invalidateSize({ pan: false });
      if (layer.current)
        instance.fitBounds(layer.current.getBounds(), {
          padding: [35, 45],
          maxZoom: 12,
          animate: false,
        });
    });
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
      layer.current = null;
      lastGeometry.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    if (layer.current) {
      map.current.removeLayer(layer.current);
      layer.current = null;
    }
    if (!malha.data) {
      lastGeometry.current = null;
      return;
    }
    const geo = L.geoJSON(malha.data, {
      style: {
        color: "#2385ad",
        weight: 2.5,
        opacity: 1,
        fillColor: situacao.cor,
        fillOpacity: 0.48,
      },
      onEachFeature: (_, featureLayer) => {
        featureLayer.bindPopup(popupMunicipio(municipio, situacao, casos));
        featureLayer.on("mouseover", () =>
          featureLayer.setStyle({ weight: 4, fillOpacity: 0.6 }),
        );
        featureLayer.on("mouseout", () =>
          featureLayer.setStyle({ weight: 2.5, fillOpacity: 0.48 }),
        );
      },
    }).addTo(map.current);
    layer.current = geo;
    if (lastGeometry.current !== malha.data) {
      map.current.fitBounds(geo.getBounds(), {
        padding: [35, 45],
        maxZoom: 12,
        animate: false,
      });
      lastGeometry.current = malha.data;
    }
  }, [malha.data, situacao, casos, municipio]);
  function centralizar() {
    if (map.current && layer.current)
      map.current.fitBounds(layer.current.getBounds(), {
        padding: [35, 45],
        maxZoom: 12,
        animate: false,
      });
  }
  return (
    <section className="card municipio-map-card">
      <div className="card-heading">
        <div>
          <span className="eyebrow">TERRITÓRIO EM FOCO</span>
          <h2>{nomeMunicipio(municipio)}</h2>
          <p>Limite municipal oficial, preenchido pela classificação AEGIS.</p>
        </div>
        <Button
          variant="secondary"
          onClick={centralizar}
          disabled={!malha.data}
          aria-label="Centralizar município"
        >
          <LocateFixed size={17} />
          <span>Centralizar</span>
        </Button>
      </div>
      <div className="municipio-map-frame">
        <div
          ref={host}
          className="municipio-map"
          role="region"
          aria-label={
            "Mapa interativo do município de " + nomeMunicipio(municipio)
          }
        />
        {malha.loading ? (
          <div className="map-message" role="status">
            <LoaderCircle size={18} className="animate-spin" />
            Carregando limite municipal…
          </div>
        ) : malha.error ? (
          <div className="map-message map-message-error" role="alert">
            <MapPin size={22} />
            <p>{malha.error}</p>
            <button type="button" onClick={malha.reload}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div
            className="map-status"
            style={{ "--situacao": situacao.cor }}
            aria-live="polite"
          >
            <span />
            {carregandoDados ? "Consultando casos…" : situacao.nome}
            <small>Classificação AEGIS</small>
          </div>
        )}
        {tileError && (
          <p className="tile-warning">
            O mapa base está indisponível. O limite municipal continua visível.
          </p>
        )}
      </div>
      <div
        className="municipio-map-legend"
        aria-label="Legenda da classificação"
      >
        {Object.values(SITUACOES).map((s) => (
          <span key={s.codigo}>
            <i style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
        <small>Contorno azul: município selecionado</small>
      </div>
      <div className="map-footer">
        <span>Limites: IBGE · Base cartográfica: OpenStreetMap</span>
        <span>Clique na área preenchida para ver o resumo.</span>
      </div>
    </section>
  );
}
