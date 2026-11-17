import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "../src/api.js";
import { aguardarServico, despertarServico } from "../src/servicoLogin.js";

const PRONTO = { status: "OK", aplicacao: "AEGIS" };

test("aguarda o Java após 502 e confirma o JSON antes de liberar o login", async () => {
  let consultas = 0;
  let chamadas = 0;
  await aguardarServico(
    async () => {
      consultas++;
      if (consultas === 1) throw new ApiError("proxy indisponível", 502);
      if (consultas === 2) throw new ApiError("HTML de inicialização", 200);
      return PRONTO;
    },
    {
      signal: new AbortController().signal,
      despertar: async () => {
        chamadas++;
      },
      intervalo: 0,
    },
  );
  assert.equal(consultas, 3);
  assert.equal(chamadas, 1);
});

test("serviço pronto ou erro de configuração não dispara a inicialização direta", async () => {
  const opts = {
    signal: new AbortController().signal,
    despertar: async () => assert.fail("A consulta direta não é necessária."),
  };
  await aguardarServico(async () => PRONTO, opts);
  await assert.rejects(
    aguardarServico(async () => {
      throw new ApiError("rota ausente", 404);
    }, opts),
    (e) => e.status === 404,
  );
});

test("sair da tela cancela a espera e impede novas consultas", async () => {
  const controle = new AbortController();
  let consultas = 0;
  const esperando = aguardarServico(
    async () => {
      consultas++;
      throw new ApiError("ainda frio", 503);
    },
    { signal: controle.signal, despertar: async () => controle.abort() },
  );
  await assert.rejects(esperando, { name: "AbortError" });
  assert.equal(consultas, 1);
});

test("a requisição direta de inicialização não envia cookies", async (t) => {
  const signal = new AbortController().signal;
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: false }));
  await despertarServico(
    "https://aegis-demo-fiap.onrender.com/demo/api/saude",
    signal,
  );
  assert.deepEqual(mock.mock.calls[0].arguments[1], {
    mode: "no-cors",
    credentials: "omit",
    cache: "no-store",
    signal,
  });
});
