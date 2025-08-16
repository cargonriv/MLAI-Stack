import { Button } from "@/components/ui/button";
import { ArrowDown, Mail, Github, Linkedin, Twitter, Instagram } from "lucide-react";
import { useEffect, useState } from "react";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);

  const scrollToModels = () => {
    const modelsSection = document.getElementById('models');
    if (modelsSection) {
      modelsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Track mouse position for parallax effects
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

  // Typewriter effect trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Static background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5"></div>
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced gradient text with typewriter animation - mobile optimized */}
          <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 leading-tight transition-all duration-1000 motion-reduce:transition-none ${isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Carlos F. González Rivera
            </span>
          </h1>

          <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 sm:mb-6 transition-all duration-1000 delay-300 motion-reduce:transition-none ${isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              M.E.C.E., B.S.B.M.E.
            </span>
          </h2>

          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-500 motion-reduce:transition-none ${isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <span className="font-medium bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Neuroengineer
            </span>
            <span className="mx-2 sm:mx-3 text-foreground/60">||</span>
            <span className="font-medium bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
              Data Scientist
            </span>
          </p>

          <p className={`text-sm sm:text-base md:text-lg text-foreground/60 mb-8 sm:mb-12 max-w-2xl mx-auto transition-all duration-1000 delay-700 motion-reduce:transition-none ${isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            Welcome to my ML/AI Showcase: a curated collection of my most impactful projects.
          </p>

          {/* Social links */}
          <div className={`flex justify-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-12 transition-all duration-1000 delay-900 motion-reduce:transition-none ${isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 hover:border-purple-400/50 bg-background/10 backdrop-blur-sm hover:bg-purple-500/10 transition-all duration-300 touch-manipulation p-2 sm:p-3"
              onClick={() => window.open('mailto:cargonriv@pm.me', '_blank')}
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-cyan-500/30 hover:border-cyan-400/50 bg-background/10 backdrop-blur-sm hover:bg-cyan-500/10 transition-all duration-300 touch-manipulation p-2 sm:p-3"
              onClick={() => window.open('https://www.github.com/cargonriv', '_blank')}
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-blue-500/30 hover:border-blue-400/50 bg-background/10 backdrop-blur-sm hover:bg-blue-500/10 transition-all duration-300 touch-manipulation p-2 sm:p-3"
              onClick={() => window.open('https://www.linkedin.com/in/cargonriv', '_blank')}
            >
              <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-pink-500/30 hover:border-pink-400/50 bg-background/10 backdrop-blur-sm hover:bg-pink-500/10 transition-all duration-300 touch-manipulation p-2 sm:p-3"
              onClick={() => window.open('https://www.instagram.com/cargonriv', '_blank')}
            >
              <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-indigo-500/30 hover:border-indigo-400/50 bg-background/10 backdrop-blur-sm hover:bg-indigo-500/10 transition-all duration-300 touch-manipulation p-2 sm:p-3"
              onClick={() => window.open('https://www.x.com/luffyswhale', '_blank')}
            >
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* CTA Button */}
          <div className={`transition-all duration-1000 delay-1100 motion-reduce:transition-none ${isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
            <Button
              onClick={scrollToModels}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 transition-all duration-300 touch-manipulation"
            >
              <span className="flex items-center">
                Explore Models
                <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center space-y-1 sm:space-y-2">
          <div className="w-5 sm:w-6 h-8 sm:h-10 border-2 border-purple-400/50 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-primary rounded-full mt-1.5 sm:mt-2"></div>
          </div>
          <div className="text-xs text-foreground/40 font-medium tracking-wider uppercase hidden sm:block">
            Scroll
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;