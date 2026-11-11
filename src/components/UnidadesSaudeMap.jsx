import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { coordenadasValidas } from "../saude";
export default function UnidadesSaudeMap({
  unidades,
  origem,
  selecionada,
  onSelect,
  municipio,
}) {
  const host = useRef(null),
    map = useRef(null),
    camada = useRef(null);
  useEffect(() => {
    const instancia = L.map(host.current, { scrollWheelZoom: false }).setView(
      [-14.2, -51.9],
      4,
    );
    map.current = instancia;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(instancia);
    const observer = new ResizeObserver(() => {
      instancia.invalidateSize({ pan: false });
      if (camada.current?.getLayers().length)
        instancia.fitBounds(camada.current.getBounds(), {
          padding: [35, 35],
          maxZoom: 13,
          animate: false,
        });
    });
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      instancia.remove();
      map.current = null;
      camada.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    if (camada.current) map.current.removeLayer(camada.current);
    const grupo = L.featureGroup().addTo(map.current);
    camada.current = grupo;
    for (const u of unidades.filter(coordenadasValidas)) {
      const marker = L.circleMarker([u.latitude, u.longitude], {
        radius: u.codigoCnes === selecionada ? 11 : 8,
        color: "#fff",
        weight: 2,
        fillColor: u.codigoCnes === selecionada ? "#c77b3d" : "#24786b",
        fillOpacity: 1,
      }).addTo(grupo);
      const box = document.createElement("div");
      box.className = "municipio-popup";
      const titulo = document.createElement("strong");
      titulo.textContent = u.nome;
      const endereco = document.createElement("p");
      endereco.textContent = [u.endereco, u.bairro].filter(Boolean).join(" · ");
      box.append(titulo, endereco);
      marker.bindPopup(box);
      marker.on("click", () => onSelect(u.codigoCnes));
      if (u.codigoCnes === selecionada) marker.openPopup();
    }
    if (origem)
      L.circleMarker([origem.latitude, origem.longitude], {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#3476ba",
        fillOpacity: 1,
      })
        .bindTooltip("Sua localização aproximada")
        .addTo(grupo);
    if (grupo.getLayers().length)
      map.current.fitBounds(grupo.getBounds(), {
        padding: [35, 35],
        maxZoom: 13,
        animate: false,
      });
  }, [unidades, origem, selecionada, onSelect]);
  return (
    <div className="health-map-wrap">
      <div
        ref={host}
        className="municipio-map health-map"
        role="region"
        aria-label={"Mapa de unidades de saúde em " + municipio.nome}
      />
      {!unidades.some(coordenadasValidas) && (
        <p className="health-map-empty">
          Sem coordenadas cadastradas para os resultados desta busca. Consulte
          os endereços na lista.
        </p>
      )}
    </div>
  );
}
