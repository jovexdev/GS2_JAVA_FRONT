import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError, loginPerfil } from "../src/api.js";
import { agendamentoIso } from "../src/format.js";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
test("login envia credenciais por POST e preserva a sessão por cookie", async () => {
  let sent;
  globalThis.fetch = async (url, options) => {
    sent = { url, options };
    return Response.json({ id: 1, perfil: "CIDADAO", nome: "Pessoa fictícia" });
  };
  const user = await loginPerfil(
    "pessoa@example.test",
    "senha-ficticia",
    "CIDADAO",
  );
  assert.equal(user.perfil, "CIDADAO");
  assert.equal(sent.url, "/api/sessao");
  assert.equal(sent.options.method, "POST");
  assert.equal(sent.options.credentials, "include");
  assert.deepEqual(JSON.parse(sent.options.body), {
    email: "pessoa@example.test",
    senha: "senha-ficticia",
  });
});
test("conta de outro perfil invalida a sessão antes de recusar a entrada", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([url, options.method]);
    return options.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({ perfil: "GESTOR" });
  };
  await assert.rejects(
    loginPerfil("pessoa@example.test", "senha-ficticia", "CIDADAO"),
    (e) => e instanceof ApiError && e.status === 403,
  );
  assert.deepEqual(calls, [
    ["/api/sessao", "POST"],
    ["/api/sessao", "DELETE"],
  ]);
});
test("mensagem de regra de negócio do backend fica disponível ao formulário", async () => {
  globalThis.fetch = async () =>
    Response.json(
      { detail: "A equipe já tem uma vistoria nesse horário." },
      { status: 409 },
    );
  await assert.rejects(
    api("/vistorias/1/agendamento", { method: "PUT", body: {} }),
    (e) => e.status === 409 && e.message.includes("equipe"),
  );
});
test("falhas de conexão e erros do proxy geram mensagens legíveis", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(
    api("/sessao"),
    (e) => e.status === 0 && e.message.includes("conectar"),
  );
  globalThis.fetch = async () => new Response("proxy error", { status: 502 });
  await assert.rejects(
    api("/sessao"),
    (e) => e.status === 502 && !e.message.includes("proxy error"),
  );
});
test("agendamento converte campos brasileiros e rejeita datas e horas inexistentes", () => {
  assert.equal(agendamentoIso("29/02/2028", "14:30"), "2028-02-29T14:30");
  assert.throws(() => agendamentoIso("31/02/2028", "14:30"));
  assert.throws(() => agendamentoIso("29/02/2027", "14:30"));
  assert.throws(() => agendamentoIso("25/12/2026", "24:00"));
  assert.throws(() => agendamentoIso("25/12/2026", "12:60"));
  assert.throws(() => agendamentoIso("2026-12-25", "14:30"));
});
