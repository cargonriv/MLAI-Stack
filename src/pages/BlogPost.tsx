import { useMemo } from "react";
import { useParams } from "react-router-dom";
import SafeHtml from "@/components/SafeHtml";

import postA from "@/content/blog/automating-healthcare-diagnostics.html?raw";
import postB from "@/content/blog/segmenting-the-invisible.html?raw";
import postC from "@/content/blog/cracking-the-minds-code.html?raw";
import postD from "@/content/blog/data-science-tutorials.html?raw";
import postE from "@/content/blog/navigating-neurons.html?raw";

const posts = {
  "automating-healthcare-diagnostics": {
    title: "Automating Healthcare Diagnostics | cargonriv.com Blog",
    description: "Lessons from the SIDS project and building ML for healthcare.",
    html: postA,
  },
  "segmenting-the-invisible": {
    title: "Segmenting the Invisible | cargonriv.com Blog",
    description: "SAM, DINO, and the future of image analysis.",
    html: postB,
  },
  "cracking-the-minds-code": {
    title: "Cracking the Mind's Code | cargonriv.com Blog",
    description: "LCAs, neural networks, and insights from neuroscience.",
    html: postC,
  },
  "data-science-tutorials": {
    title: "Data Science Tools & Tutorials | cargonriv.com Blog",
    description: "Curated free resources for Python and ML fundamentals.",
    html: postD,
  },
  "navigating-neurons": {
    title: "Navigating our Neurons Highways | cargonriv.com Blog",
    description: "A friendly journey into data science and neuroengineering.",
    html: postE,
  },
} as const;

const BlogPost = () => {
  const { slug } = useParams<{ slug: keyof typeof posts }>();

  const post = useMemo(() => (slug && posts[slug]) || null, [slug]);

  if (!post) {
    return (
      <SafeHtml
        title="Post not found | cargonriv.com"
        description="The blog post you are looking for could not be found."
        html={`<h1>Post not found</h1><p>We couldn't find this article. Please go back to the <a href='#/blog'>blog</a>.</p>`}
        canonical={window.location.href}
      />
    );
  }

  return (
    <SafeHtml
      title={post.title}
      description={post.description}
      html={post.html}
      canonical={window.location.href}
    />
  );
};

export default BlogPost;
