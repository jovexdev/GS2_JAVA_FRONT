import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: "" });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((e) => {
        if (e.name !== "AbortError")
          setState({ data: null, loading: false, error: e.message });
      });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, reload };
}
