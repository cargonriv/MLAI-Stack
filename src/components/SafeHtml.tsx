import Header from "@/components/Header";
import DOMPurify from "dompurify";
import { useSeo } from "@/hooks/use-seo";
import React from "react";

interface SafeHtmlProps {
  html: string;
  title: string;
  description?: string;
  canonical?: string;
}

const SafeHtml: React.FC<SafeHtmlProps> = ({ html, title, description, canonical }) => {
  useSeo({ title, description, canonical });
  const clean = React.useMemo(() => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }), [html]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <section className="py-12">
          <div className="container mx-auto px-4">
            <article className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: clean }} />
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SafeHtml;
