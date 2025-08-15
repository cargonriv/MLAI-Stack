import Header from "@/components/Header";
import { Calendar, Clock, ArrowRight, BookOpen, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Blog = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for subtle parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const blogPosts = [
    {
      title: "Automating Healthcare Diagnostics",
      excerpt: "When I first dove into the project of predicting Sudden Infant Death Syndrome (SIDS), I had no idea how deeply personal it would become. Our capstone began in January 2024, the last full-time semester of my master's at Rice University. At the same time, my wife and I were preparing to welcome our first child...",
      date: "2025",
      readTime: "8 min read",
      category: "Healthcare AI",
      featured: true,
      link: "/blog/automating-healthcare-diagnostics"
    },
    {
      title: "Segmenting the Invisible",
      excerpt: "In biological imaging, we often deal with the 'invisible' – microscopic cells, bacterial colonies, or subtle patterns that evade easy detection. Traditional image analysis required painstaking tuning of algorithms or training models from scratch on limited data. Today, a new wave of foundation models is changing everything...",
      date: "2025",
      readTime: "6 min read",
      category: "Computer Vision",
      link: "/blog/segmenting-the-invisible"
    },
    {
      title: "Cracking the Mind's Code",
      excerpt: "Today, we're diving deep—like 'Alice in Wonderland'-rabbit-hole deep—into the fascinating world of neural networks. But we're adding a twist. Ever heard of Locally Competitive Algorithms (LCAs) with accumulator neurons? No? Buckle up!",
      date: "2024",
      readTime: "10 min read",
      category: "Neural Networks",
      link: "/blog/cracking-the-minds-code"
    },
    {
      title: "Data Science Tutorials",
      excerpt: "Here are a few tutorials, FOR FREE, about the Python programming language that hint towards data science basics: AI Engineering Certificate (from Coursera), Python Crash Course (aka 'Python For Dummies' book), Corey Schafer's YouTube Playlists...",
      date: "2024",
      readTime: "5 min read",
      category: "Education",
      link: "/blog/data-science-tutorials"
    },
    {
      title: "Navigating Neurons",
      excerpt: "I'm excited to take you today on a delightful little expedition into the fascinating world of data science and its collaboration with neuroengineering. Trust me, it's less intimidating than it might sound. In fact, it's quite a thrilling and self-motivating tale!",
      date: "2024",
      readTime: "7 min read",
      category: "Neuroengineering",
      link: "/blog/navigating-neurons"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-500/8 to-pink-500/8 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-cyan-500/8 to-blue-500/8 rounded-full blur-2xl"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.025}px)`,
          }}
        ></div>
        <div 
          className="absolute top-1/2 right-1/4 w-28 h-28 bg-gradient-to-br from-pink-500/6 to-purple-500/6 rounded-full blur-xl"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * -0.02}px)`,
          }}
        ></div>
      </div>
      
      <Header />
      <div className="pt-16 relative z-10">
        <section className="py-24">
          <div className="container mx-auto px-6">
            {/* Enhanced Header */}
            <div className="text-center mb-20">
              <div className="flex justify-center mb-8">
                <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl shadow-purple-500/25">
                  <BookOpen className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Blog
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/60 max-w-3xl mx-auto leading-relaxed">
                Insights, tutorials, and deep dives into machine learning, AI, and neuroengineering. 
                Sharing knowledge from research to real-world applications.
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="grid gap-8">
                {blogPosts.map((post, index) => (
                  <article 
                    key={index} 
                    className={`group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
                      post.featured ? 'lg:col-span-2' : ''
                    }`}
                  >
                    {/* Card glow effect */}
                    <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
                      post.featured 
                        ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 group-hover:blur-2xl' 
                        : 'bg-gradient-to-br from-cyan-600/15 to-blue-600/15 group-hover:blur-xl'
                    }`}></div>
                    
                    {/* Main card */}
                    <div className={`relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-2xl border p-8 md:p-10 shadow-xl transition-all duration-500 ${
                      post.featured 
                        ? 'border-purple-500/30 hover:border-purple-400/50 group-hover:shadow-2xl group-hover:shadow-purple-500/10' 
                        : 'border-border/50 hover:border-cyan-500/30 group-hover:shadow-2xl group-hover:shadow-cyan-500/10'
                    }`}>
                      {/* Featured badge */}
                      {post.featured && (
                        <div className="absolute top-6 right-6">
                          <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                            <BookOpen className="w-3 h-3" />
                            <span>Featured</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Category and metadata */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-foreground/60" />
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                            post.featured
                              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {post.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-foreground/60">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Article title */}
                      <h2 className={`text-2xl md:text-3xl font-bold mb-4 transition-colors duration-300 ${
                        post.featured 
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent' 
                          : 'text-foreground group-hover:text-cyan-400'
                      }`}>
                        <a 
                          href={`#${post.link}`} 
                          className="hover:opacity-80 transition-opacity"
                        >
                          {post.title}
                        </a>
                      </h2>
                      
                      {/* Excerpt */}
                      <p className="text-foreground/70 mb-6 leading-relaxed text-lg">
                        {post.excerpt}
                      </p>
                      
                      {/* Read more button */}
                      <div className="flex justify-between items-center">
                        <div className="flex-1"></div>
                        <Button
                          variant="outline"
                          className={`group/btn relative overflow-hidden transition-all duration-300 ${
                            post.featured
                              ? 'border-purple-500/30 hover:border-purple-400/50 bg-background/10 backdrop-blur-sm hover:bg-purple-500/10'
                              : 'border-cyan-500/30 hover:border-cyan-400/50 bg-background/10 backdrop-blur-sm hover:bg-cyan-500/10'
                          }`}
                          onClick={() => window.location.href = `#${post.link}`}
                        >
                          <div className={`absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ${
                            post.featured
                              ? 'bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0'
                              : 'bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0'
                          }`}></div>
                          <span className="relative z-10 flex items-center">
                            Read Article
                            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </article>
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