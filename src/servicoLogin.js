const STATUS_TEMPORARIOS = new Set([0, 200, 408, 429, 502, 503, 504]);

function pausa(ms, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    function cancelar() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancelar);
      resolve();
    }, ms);
    signal.addEventListener("abort", cancelar, { once: true });
  });
}

export function despertarServico(url, signal) {
  // Solicita o início da instância. A confirmação vem do endpoint na origem do site.
  return fetch(url, {
    mode: "no-cors",
    credentials: "omit",
    cache: "no-store",
    signal,
  });
}

export async function aguardarServico(
  consultar,
  { signal, despertar, prazo = 100_000, intervalo = 3500 },
) {
  const limite = Date.now() + prazo;
  let despertou = false;
  for (let restante = prazo; restante > 0; restante = limite - Date.now()) {
    signal.throwIfAborted();
    try {
      const sinalConsulta = AbortSignal.any([
        signal,
        AbortSignal.timeout(Math.min(7000, restante)),
      ]);
      const resposta = await consultar(sinalConsulta);
      if (resposta?.status === "OK" && resposta.aplicacao === "AEGIS") return;
    } catch (erro) {
      signal.throwIfAborted();
      if (!despertar || !STATUS_TEMPORARIOS.has(erro.status)) throw erro;
    }
    if (!despertar) break;
    if (!despertou) {
      despertou = true;
      // A inicialização pode demorar. As consultas continuam enquanto ela ocorre.
      void despertar(signal).catch(() => {});
    }
    const espera = Math.min(intervalo, limite - Date.now());
    if (espera > 0) await pausa(espera, signal);
  }
  throw new Error(
    "O serviço ainda está indisponível. Tente entrar novamente em instantes.",
  );
}
