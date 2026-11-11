export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api(
  path,
  { method = "GET", body, signal, quiet401 = false } = {},
) {
  let response;
  try {
    response = await fetch("/api" + path, {
      method,
      credentials: "include",
      signal,
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "Não foi possível conectar ao serviço. Tente novamente em instantes.",
      0,
    );
  }
  if (response.status === 204) return null;
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    if (response.status === 401 && !quiet401 && typeof window !== "undefined")
      window.dispatchEvent(new Event("aegis:session-expired"));
    throw new ApiError(
      data?.detail ||
        data?.message ||
        (response.status >= 500
          ? "O serviço está indisponível. Tente novamente em instantes."
          : "Não foi possível concluir esta ação."),
      response.status,
    );
  }
  if (data === null && text)
    throw new ApiError(
      "O serviço retornou uma resposta inesperada.",
      response.status,
    );
  return data;
}

export async function loginPerfil(email, senha, perfil) {
  const user = await api("/sessao", {
    method: "POST",
    body: { email, senha },
    quiet401: true,
  });
  if (user.perfil !== perfil) {
    await api("/sessao", { method: "DELETE", quiet401: true });
    throw new ApiError(
      "Esta conta pertence a outro perfil. Confira o perfil escolhido e tente novamente.",
      403,
    );
  }
  return user;
}
