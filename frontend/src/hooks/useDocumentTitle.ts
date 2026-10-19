import { useEffect } from "react";

const DEFAULT_TITLE = "SmartGuide — Museum & Library Information System";

/** Sets document.title (and optionally the meta description) while the page is mounted. */
export function useDocumentTitle(title?: string | null, description?: string | null) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description.slice(0, 160));
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description]);
}
