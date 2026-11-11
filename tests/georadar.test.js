import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buscarMunicipios,
  classificarCasos,
  nomeMunicipio,
  normalizarMalha,
  normalizarMunicipios,
  ultimaSemana,
} from "../src/georadar.js";

test("as faixas de casos têm limites claros, inclusive zero e as transições", () => {
  for (const [casos, esperado] of [
    [0, "OK"],
    [99, "OK"],
    [100, "INSTAVEL"],
    [299, "INSTAVEL"],
    [300, "CRITICO"],
    [10000, "CRITICO"],
  ]) {
    assert.equal(classificarCasos(casos).codigo, esperado);
  }
});
test("ausência ou invalidade de casos mantém o município sem classificação", () => {
  for (const casos of [null, undefined, NaN, Infinity, -1, "0", ""])
    assert.equal(classificarCasos(casos).codigo, "SEM_DADOS");
});
const cidades = [
  { id: 3550308, nome: "São Paulo", uf: "SP" },
  { id: 3509502, nome: "Campinas", uf: "SP" },
  { id: 1501402, nome: "Belém", uf: "PA" },
  { id: 2501906, nome: "Belém", uf: "PB" },
];
test("busca usa o nome sem acento e diferencia cidades homônimas pela UF", () => {
  assert.equal(buscarMunicipios(cidades, "sao paulo")[0].id, 3550308);
  assert.equal(buscarMunicipios(cidades, "BELEM / pb")[0].id, 2501906);
  assert.equal(buscarMunicipios(cidades, "belém").length, 2);
  assert.equal(buscarMunicipios(cidades, "3550308").length, 0);
  assert.equal(nomeMunicipio(cidades[0]), "São Paulo / SP");
});
test("normalização aceita a divisão regional atual e descarta cadastros incompletos", () => {
  const catalogo = normalizarMunicipios([
    {
      id: 3509502,
      nome: "Campinas",
      microrregiao: { mesorregiao: { UF: { sigla: "SP" } } },
    },
    {
      id: 1501402,
      nome: "Belém",
      microrregiao: null,
      "regiao-imediata": { "regiao-intermediaria": { UF: { sigla: "PA" } } },
    },
    { id: 123, nome: "Inválido" },
  ]);
  assert.equal(catalogo.length, 2);
  assert.deepEqual(catalogo[0], { id: 1501402, nome: "Belém", uf: "PA" });
});
test("mapa aceita polígonos reais e não inventa contorno quando o serviço falha", () => {
  const feature = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-47, -23],
          [-46, -23],
          [-46, -24],
          [-47, -23],
        ],
      ],
    },
  };
  assert.equal(normalizarMalha(feature).features.length, 1);
  assert.equal(
    normalizarMalha({ type: "FeatureCollection", features: [feature] })
      .features[0],
    feature,
  );
  assert.throws(() =>
    normalizarMalha({ type: "FeatureCollection", features: [] }),
  );
  assert.throws(() =>
    normalizarMalha({
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
    }),
  );
});
test("a classificação usa a última semana do período, sem substituir uma lacuna por dados antigos", () => {
  const series = [
    { inicioDaSemana: "2026-02-15", casosNotificados: null },
    { inicioDaSemana: "2026-02-01", casosNotificados: 400 },
  ];
  assert.equal(ultimaSemana(series).inicioDaSemana, "2026-02-15");
  assert.equal(
    classificarCasos(ultimaSemana(series).casosNotificados).codigo,
    "SEM_DADOS",
  );
  assert.equal(ultimaSemana([]), null);
});
