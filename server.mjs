import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("./dist/", import.meta.url));
const api = new URL(process.env.API_TARGET || "http://127.0.0.1:8080");
if (
  !["http:", "https:"].includes(api.protocol) ||
  api.origin !== api.href.slice(0, -1)
) {
  throw new Error("API_TARGET deve ser uma origem HTTP ou HTTPS.");
}
const request = api.protocol === "https:" ? httpsRequest : httpRequest;
const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function encaminhar(req, res, caminho) {
  const headers = {};
  for (const nome of ["accept", "content-type", "content-length", "cookie"]) {
    if (req.headers[nome] !== undefined) headers[nome] = req.headers[nome];
  }
  const upstream = request(
    api,
    { path: caminho, method: req.method, headers },
    (retorno) => {
      const resposta = { "cache-control": "no-store" };
      for (const nome of [
        "content-type",
        "content-length",
        "set-cookie",
        "vary",
      ]) {
        if (retorno.headers[nome] !== undefined)
          resposta[nome] = retorno.headers[nome];
      }
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
    encaminhar(req, res, url.pathname + url.search);
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
