import Header from "@/components/Header";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">Carlos Gonzalez-Rivera</h1>
            <h2 className="text-2xl text-muted-foreground mb-8">
              Machine Learning Engineer & Data Scientist
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Passionate about leveraging artificial intelligence and machine learning to solve complex problems. 
              Currently pursuing my Master's in Computer Science with a focus on AI/ML applications.
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="https://linkedin.com/in/cargonriv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                LinkedIn
              </a>
              <a 
                href="https://github.com/cargonriv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">About Me</h2>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-muted-foreground mb-6">
                I'm a dedicated Machine Learning Engineer with expertise in developing and deploying 
                AI solutions across various domains. My work spans from computer vision and natural 
                language processing to reinforcement learning and predictive analytics.
              </p>
              <p className="text-lg text-muted-foreground">
                Currently pursuing my Master's degree while working on cutting-edge ML projects 
                that bridge the gap between research and practical applications.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Explore</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-background rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Portfolio</h3>
                <p className="text-muted-foreground mb-4">
                  Discover my favorite machine learning models and projects
                </p>
                <a 
                  href="/portfolio/favorite-models" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  View Models →
                </a>
              </div>
              <div className="text-center p-6 bg-background rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Blog</h3>
                <p className="text-muted-foreground mb-4">
                  Insights and tutorials on AI/ML topics
                </p>
                <span className="text-muted-foreground">Coming Soon</span>
              </div>
              <div className="text-center p-6 bg-background rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Contact</h3>
                <p className="text-muted-foreground mb-4">
                  Get in touch for collaborations
                </p>
                <span className="text-muted-foreground">Coming Soon</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;