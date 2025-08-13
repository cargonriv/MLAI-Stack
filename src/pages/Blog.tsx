import Header from "@/components/Header";

const Blog = () => {
  const blogPosts = [
    {
      title: "Automating Healthcare Diagnostics",
      excerpt: "When I first dove into the project of predicting Sudden Infant Death Syndrome (SIDS), I had no idea how deeply personal it would become. Our capstone began in January 2024, the last full-time semester of my master's at Rice University. At the same time, my wife and I were preparing to welcome our first child...",
      date: "2024",
      link: "/blog/automating-healthcare-diagnostics"
    },
    {
      title: "Segmenting the Invisible",
      excerpt: "In biological imaging, we often deal with the 'invisible' – microscopic cells, bacterial colonies, or subtle patterns that evade easy detection. Traditional image analysis required painstaking tuning of algorithms or training models from scratch on limited data. Today, a new wave of foundation models is changing everything...",
      date: "2024",
      link: "/blog/segmenting-the-invisible"
    },
    {
      title: "Cracking the Mind's Code",
      excerpt: "Today, we're diving deep—like 'Alice in Wonderland'-rabbit-hole deep—into the fascinating world of neural networks. But we're adding a twist. Ever heard of Locally Competitive Algorithms (LCAs) with accumulator neurons? No? Buckle up!",
      date: "2024",
      link: "/blog/cracking-the-minds-code"
    },
    {
      title: "Data Science Tutorials",
      excerpt: "Here are a few tutorials, FOR FREE, about the Python programming language that hint towards data science basics: AI Engineering Certificate (from Coursera), Python Crash Course (aka 'Python For Dummies' book), Corey Schafer's YouTube Playlists...",
      date: "2024",
      link: "/blog/data-science-tutorials"
    },
    {
      title: "Navigating Neurons",
      excerpt: "I'm excited to take you today on a delightful little expedition into the fascinating world of data science and its collaboration with neuroengineering. Trust me, it's less intimidating than it might sound. In fact, it's quite a thrilling and self-motivating tale!",
      date: "2024",
      link: "/blog/navigating-neurons"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-12">Blog</h1>
            <div className="max-w-4xl mx-auto">
              <div className="grid gap-8">
                {blogPosts.map((post, index) => (
                  <div key={index} className="bg-card p-6 rounded-lg shadow-sm border">
                    <h2 className="text-2xl font-semibold mb-4">
                      <a 
                        href={post.link} 
                        className="hover:text-primary transition-colors"
                      >
                        {post.title}
                      </a>
                    </h2>
                    <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{post.date}</span>
                      <a 
                        href={post.link}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        Read More →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Blog;