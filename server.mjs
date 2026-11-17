import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("./dist/", import.meta.url));
function origem(valor, nome) {
  const url = new URL(valor);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.href !== url.origin + "/"
  ) {
    throw new Error(nome + " deve ser uma origem HTTP ou HTTPS.");
  }
  return url;
}
const api = origem(
  process.env.API_TARGET || "http://127.0.0.1:8080",
  "API_TARGET",
);
const apiDemo = process.env.DEMO_API_TARGET
  ? origem(process.env.DEMO_API_TARGET, "DEMO_API_TARGET")
  : null;
const sessaoPrincipal = "JSESSIONID";
const sessaoDemo = "AEGIS_DEMO_SESSION";
const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function encaminhar(req, res, destino, caminho, sessao) {
  const headers = {};
  for (const nome of ["accept", "content-type", "content-length"]) {
    if (req.headers[nome] !== undefined) headers[nome] = req.headers[nome];
  }
  const cookies = req.headers.cookie?.split(";").map((cookie) => cookie.trim());
  const cookieSessao = cookies?.find((cookie) =>
    cookie.startsWith(sessao + "="),
  );
  if (cookieSessao) headers.cookie = cookieSessao;
  const request = destino.protocol === "https:" ? httpsRequest : httpRequest;
  const upstream = request(
    destino,
    { path: caminho, method: req.method, headers },
    (retorno) => {
      const resposta = { "cache-control": "no-store" };
      for (const nome of ["content-type", "content-length", "vary"]) {
        if (retorno.headers[nome] !== undefined)
          resposta[nome] = retorno.headers[nome];
      }
      const cookiesSessao = retorno.headers["set-cookie"]?.filter((cookie) =>
        cookie.startsWith(sessao + "="),
      );
      if (cookiesSessao?.length) resposta["set-cookie"] = cookiesSessao;
      res.writeHead(retorno.statusCode, resposta);
      retorno.on("error", () => res.destroy());
      retorno.pipe(res);
    },
  );
  upstream.setTimeout(110_000, () => upstream.destroy());
  upstream.on("error", () => {
    if (res.destroyed) return;
    if (res.headersSent) return res.destroy();
    res.writeHead(502, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(
      JSON.stringify({
        detail: "O servidor AEGIS está indisponível. Tente novamente.",
      }),
    );
  });
  res.on("close", () => upstream.destroy());
  req.pipe(upstream);
}

async function servir(req, res) {
  const url = new URL(req.url, "http://localhost");
  if (url.origin !== "http://localhost") return res.writeHead(400).end();
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    encaminhar(req, res, api, url.pathname + url.search, sessaoPrincipal);
    return;
  }
  if (url.pathname === "/demo/api" || url.pathname.startsWith("/demo/api/")) {
    if (!apiDemo) {
      res.writeHead(503, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      return res.end(
        JSON.stringify({ detail: "A demonstração está indisponível." }),
      );
    }
    encaminhar(req, res, apiDemo, url.pathname + url.search, sessaoDemo);
    return;
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    return res.writeHead(405, { allow: "GET, HEAD" }).end();
  }
  const caminho = decodeURIComponent(url.pathname);
  const extensao = extname(caminho);
  const arquivo = resolve(dist, extensao ? "." + caminho : "index.html");
  if (!arquivo.startsWith(resolve(dist) + sep)) return res.writeHead(403).end();
  const info = await stat(arquivo).catch(() => null);
  if (!info?.isFile()) return res.writeHead(404).end();
  res.writeHead(200, {
    "content-length": info.size,
    "content-type": tipos[extname(arquivo)] ?? "application/octet-stream",
    "cache-control":
      caminho.startsWith("/assets/") && extensao
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    "x-content-type-options": "nosniff",
  });
  if (req.method === "HEAD") return res.end();
  const stream = createReadStream(arquivo);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}

createServer((req, res) => {
  servir(req, res).catch((erro) => {
    if (res.headersSent) return res.destroy();
    res
      .writeHead(
        erro instanceof URIError || erro.code === "ERR_INVALID_URL" ? 400 : 500,
      )
      .end();
  });
}).listen(Number(process.env.PORT || 4173), "0.0.0.0");
