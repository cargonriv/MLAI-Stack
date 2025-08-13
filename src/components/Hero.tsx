import { Button } from "@/components/ui/button";
import { ArrowDown, Mail, Github, Linkedin, Twitter, Instagram } from "lucide-react";

const Hero = () => {
  const scrollToModels = () => {
    const modelsSection = document.getElementById('models');
    if (modelsSection) {
      modelsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-20 animate-gradient-shift bg-[length:400%_400%]"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-32 right-20 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Carlos F. González Rivera
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-primary">
            M.E.C.E., B.S.B.M.E.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Neuroengineer || Data Scientist
          </p>
          <p className="text-base md:text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
            Welcome to my ML/AI Showcase: a curated collection of my most impactful projects.
          </p>
          
          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-12">
            <Button variant="secondary" size="lg" className="group" onClick={() => window.open('mailto:cargonriv@pm.me', '_blank')}>
              <Mail className="w-12 h-12 group-hover:scale-110 transition-transform" />
            </Button>
            <Button variant="secondary" size="lg" className="group" onClick={() => window.open('https://www.github.com/cargonriv', '_blank')}>
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
            <Button variant="secondary" size="lg" className="group" onClick={() => window.open('https://www.linkedin.com/in/cargonriv', '_blank')}>
              <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
            <Button variant="secondary" size="lg" className="group" onClick={() => window.open('https://www.instagram.com/cargonriv', '_blank')}>
              <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
            <Button variant="secondary" size="lg" className="group" onClick={() => window.open('https://www.x.com/luffyswhale', '_blank')}>
              <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
          
          {/* CTA Button */}
          <Button 
            onClick={scrollToModels}
            size="lg" 
            className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-lg px-8 py-6 group"
          >
            Explore Models
            <ArrowDown className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
          </Button>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;