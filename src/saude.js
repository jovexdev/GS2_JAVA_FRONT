import { normalizarBusca } from "./georadar.js";
export function coordenadasValidas(unidade) {
  return (
    Number.isFinite(unidade.latitude) &&
    Number.isFinite(unidade.longitude) &&
    Math.abs(unidade.latitude) <= 90 &&
    Math.abs(unidade.longitude) <= 180 &&
    unidade.latitude !== 0 &&
    unidade.longitude !== 0
  );
}
export function distanciaKm(origem, unidade) {
  if (!origem || !coordenadasValidas(unidade)) return null;
  const rad = (v) => (v * Math.PI) / 180;
  const dlat = rad(unidade.latitude - origem.latitude),
    dlon = rad(unidade.longitude - origem.longitude);
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(origem.latitude)) *
      Math.cos(rad(unidade.latitude)) *
      Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}
export function filtrarUnidades(unidades, busca, origem) {
  const termos = normalizarBusca(busca).split(" ").filter(Boolean);
  return unidades
    .filter((u) =>
      termos.every((t) =>
        normalizarBusca(u.nome + " " + (u.bairro || "")).includes(t),
      ),
    )
    .map((u) => ({ ...u, distancia: distanciaKm(origem, u) }))
    .sort((a, b) =>
      origem
        ? (a.distancia ?? Infinity) - (b.distancia ?? Infinity) ||
          a.nome.localeCompare(b.nome, "pt-BR")
        : a.nome.localeCompare(b.nome, "pt-BR"),
    );
}
export function rotaUnidade(unidade, municipio, origem, modo = "driving") {
  const destino = coordenadasValidas(unidade)
    ? unidade.latitude + "," + unidade.longitude
    : [
        unidade.nome,
        unidade.endereco,
        unidade.bairro,
        municipio.nome,
        municipio.uf,
        unidade.cep,
      ]
        .filter(Boolean)
        .join(", ");
  const params = new URLSearchParams({
    api: "1",
    destination: destino,
    travelmode: modo === "walking" ? "walking" : "driving",
  });
  if (origem) params.set("origin", origem.latitude + "," + origem.longitude);
  return "https://www.google.com/maps/dir/?" + params;
}
