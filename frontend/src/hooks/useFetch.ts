import { useEffect, useState } from "react";
import { getJson } from "@/lib/api";

/** Loads JSON for a page. `data` is null while loading; `notFound` is set on a 404. */
export function useFetch<T>(url: string | null) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; notFound: boolean; error: boolean }>({
    data: null,
    loading: true,
    notFound: false,
    error: false,
  });

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, notFound: false, error: false }));
    getJson<T>(url, ctrl.signal)
      .then((data) => setState({ data, loading: false, notFound: data === null, error: false }))
      .catch((e) => {
        if (e?.name !== "AbortError") setState({ data: null, loading: false, notFound: false, error: true });
      });
    return () => ctrl.abort();
  }, [url]);

  return state;
}
