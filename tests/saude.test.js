import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coordenadasValidas,
  distanciaKm,
  filtrarUnidades,
  rotaUnidade,
} from "../src/saude.js";
const a = {
  codigoCnes: 1,
  nome: "UPA Demonstração",
  bairro: "São José",
  endereco: "Rua Fictícia, 10",
  latitude: -23.5,
  longitude: -46.6,
};
const b = {
  codigoCnes: 2,
  nome: "PA Exemplo",
  bairro: "Centro",
  endereco: "Rua Exemplo, 20",
  latitude: null,
  longitude: null,
};
test("busca por bairro ignora acentos sem excluir unidades sem coordenadas", () => {
  assert.deepEqual(
    filtrarUnidades([a, b], "sao jose", null).map((u) => u.codigoCnes),
    [1],
  );
  assert.equal(filtrarUnidades([a, b], "centro", null)[0].latitude, null);
});
test("proximidade é distância em linha reta e não inventa distância para unidade sem ponto", () => {
  const origem = { latitude: -23.5, longitude: -46.6 };
  assert.equal(distanciaKm(origem, a), 0);
  assert.equal(distanciaKm(origem, b), null);
  assert.deepEqual(
    filtrarUnidades([b, a], "", origem).map((u) => u.codigoCnes),
    [1, 2],
  );
  assert.equal(coordenadasValidas({ ...a, latitude: 0 }), false);
});
test("rota usa link de navegação sem chave de API e não inclui respostas de saúde", () => {
  const cidade = { nome: "São Paulo", uf: "SP" };
  const url = new URL(rotaUnidade(a, cidade, null));
  assert.equal(url.hostname, "www.google.com");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("destination"), "-23.5,-46.6");
  assert.equal(url.searchParams.has("origin"), false);
  assert.equal(url.searchParams.has("key"), false);
  const semCoordenadas = new URL(
    rotaUnidade(b, cidade, { latitude: -23.5, longitude: -46.6 }, "walking"),
  );
  assert.ok(semCoordenadas.searchParams.get("destination").includes("Centro"));
  assert.equal(semCoordenadas.searchParams.get("origin"), "-23.5,-46.6");
  assert.equal(semCoordenadas.searchParams.get("travelmode"), "walking");
  assert.deepEqual([...url.searchParams.keys()].sort(), [
    "api",
    "destination",
    "travelmode",
  ]);
});
