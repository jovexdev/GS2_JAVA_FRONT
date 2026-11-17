export const BASE_DEMO = "/demo";
const caminho = typeof window === "undefined" ? "" : window.location.pathname;
export const modoDemo =
  caminho === BASE_DEMO || caminho.startsWith(BASE_DEMO + "/");
