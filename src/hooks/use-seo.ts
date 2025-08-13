import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
}

export function useSeo({ title, description, canonical }: SEOProps) {
  useEffect(() => {
    if (title) {
      document.title = title.length > 60 ? `${title.slice(0, 57)}...` : title;
    }

    if (description) {
      const metaName = "description";
      let meta = document.querySelector(`meta[name="${metaName}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", metaName);
        document.head.appendChild(meta);
      }
      const truncated = description.length > 160 ? `${description.slice(0, 157)}...` : description;
      meta.setAttribute("content", truncated);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }
  }, [title, description, canonical]);
}
