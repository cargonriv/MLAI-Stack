import { Button } from "@/components/ui/button";
import { ArrowDown, Mail, Github, Linkedin, Twitter, Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { AdvancedVisualEffects, Hover3D, DynamicColorScheme, ThemeTransition } from "@/components/ui/advanced-visual-effects";

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
    <ThemeTransition>
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Advanced gradient mesh background */}
        <AdvancedVisualEffects 
          variant="mesh" 
          intensity="high" 
          interactive={false}
          className="absolute inset-0"
        />
        
        {/* Enhanced floating orbs with advanced effects */}
        <AdvancedVisualEffects 
          variant="orbs" 
          intensity="medium" 
          interactive={false}
          className="absolute inset-0"
        />
      
        {/* Particle effects for ambient atmosphere */}
        <AdvancedVisualEffects 
          variant="particles" 
          intensity="low" 
          interactive={false}
          className="absolute inset-0"
        />
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced gradient text with typewriter animation - mobile optimized */}
          <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 leading-tight transition-all duration-1000 motion-reduce:transition-none ${
            isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_200%] motion-reduce:animate-none">
              Carlos F. González Rivera
            </span>
          </h1>
          
          <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 sm:mb-6 transition-all duration-1000 delay-300 motion-reduce:transition-none ${
            isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-text-reverse bg-[length:200%_200%] motion-reduce:animate-none">
              M.E.C.E., B.S.B.M.E.
            </span>
          </h2>
          
          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-500 motion-reduce:transition-none ${
            isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <span className="font-medium bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Neuroengineer
            </span>
            <span className="mx-2 sm:mx-3 text-foreground/60">||</span>
            <span className="font-medium bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
              Data Scientist
            </span>
          </p>
          
          <p className={`text-sm sm:text-base md:text-lg text-foreground/60 mb-8 sm:mb-12 max-w-2xl mx-auto transition-all duration-1000 delay-700 motion-reduce:transition-none ${
            isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Welcome to my ML/AI Showcase: a curated collection of my most impactful projects.
          </p>
          
          {/* Enhanced interactive social links with advanced effects */}
          <div className={`flex justify-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-12 transition-all duration-1000 delay-900 motion-reduce:transition-none ${
            isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <DynamicColorScheme hueShift={20} saturationBoost={0.3}>
              <Hover3D intensity="subtle">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group relative overflow-hidden border-purple-500/30 hover:border-purple-400/50 bg-background/10 backdrop-blur-sm hover:bg-purple-500/10 transition-all duration-300 hover:shadow-glow-interactive touch-manipulation active:scale-95 p-2 sm:p-3" 
                  onClick={() => window.open('mailto:cargonriv@pm.me', '_blank')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all duration-300 relative z-10" />
                </Button>
              </Hover3D>
            </DynamicColorScheme>
            
            <DynamicColorScheme hueShift={25} saturationBoost={0.3}>
              <Hover3D intensity="subtle">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group relative overflow-hidden border-cyan-500/30 hover:border-cyan-400/50 bg-background/10 backdrop-blur-sm hover:bg-cyan-500/10 transition-all duration-300 hover:shadow-glow-interactive touch-manipulation active:scale-95 p-2 sm:p-3" 
                  onClick={() => window.open('https://www.github.com/cargonriv', '_blank')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Github className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all duration-300 relative z-10" />
                </Button>
              </Hover3D>
            </DynamicColorScheme>
            
            <DynamicColorScheme hueShift={30} saturationBoost={0.3}>
              <Hover3D intensity="subtle">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group relative overflow-hidden border-blue-500/30 hover:border-blue-400/50 bg-background/10 backdrop-blur-sm hover:bg-blue-500/10 transition-all duration-300 hover:shadow-glow-interactive touch-manipulation active:scale-95 p-2 sm:p-3" 
                  onClick={() => window.open('https://www.linkedin.com/in/cargonriv', '_blank')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all duration-300 relative z-10" />
                </Button>
              </Hover3D>
            </DynamicColorScheme>
            
            <DynamicColorScheme hueShift={35} saturationBoost={0.3}>
              <Hover3D intensity="subtle">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group relative overflow-hidden border-pink-500/30 hover:border-pink-400/50 bg-background/10 backdrop-blur-sm hover:bg-pink-500/10 transition-all duration-300 hover:shadow-glow-interactive touch-manipulation active:scale-95 p-2 sm:p-3" 
                  onClick={() => window.open('https://www.instagram.com/cargonriv', '_blank')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/10 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all duration-300 relative z-10" />
                </Button>
              </Hover3D>
            </DynamicColorScheme>
            
            <DynamicColorScheme hueShift={40} saturationBoost={0.3}>
              <Hover3D intensity="subtle">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group relative overflow-hidden border-indigo-500/30 hover:border-indigo-400/50 bg-background/10 backdrop-blur-sm hover:bg-indigo-500/10 transition-all duration-300 hover:shadow-glow-interactive touch-manipulation active:scale-95 p-2 sm:p-3" 
                  onClick={() => window.open('https://www.x.com/luffyswhale', '_blank')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-all duration-300 relative z-10" />
                </Button>
              </Hover3D>
            </DynamicColorScheme>
          </div>
          
          {/* Enhanced CTA Button with advanced effects */}
          <div className={`transition-all duration-1000 delay-1100 motion-reduce:transition-none ${
            isTyping ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <DynamicColorScheme hueShift={15} saturationBoost={0.2} brightnessBoost={0.1}>
              <Hover3D intensity="medium">
                <Button 
                  onClick={scrollToModels}
                  size="lg" 
                  className="relative overflow-hidden bg-gradient-interactive hover:bg-gradient-interactive-hover text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 group transition-all duration-300 hover:shadow-glow-hover border-0 touch-manipulation active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10 flex items-center">
                    Explore Models
                    <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-y-1 group-hover:scale-110 transition-all duration-300" />
                  </span>
                </Button>
              </Hover3D>
            </DynamicColorScheme>
          </div>
        </div>
        </div>
        
        {/* Enhanced modern scroll indicator with advanced effects */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2">
          <DynamicColorScheme hueShift={10} saturationBoost={0.1}>
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 animate-bounce-slow motion-reduce:animate-none">
              <div className="w-5 sm:w-6 h-8 sm:h-10 border-2 border-purple-400/50 rounded-full flex justify-center relative overflow-hidden backdrop-blur-sm">
                <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-gradient-primary rounded-full mt-1.5 sm:mt-2 animate-scroll-indicator motion-reduce:animate-none"></div>
              </div>
              <div className="text-xs text-foreground/40 font-medium tracking-wider uppercase hidden sm:block">
                Scroll
              </div>
            </div>
          </DynamicColorScheme>
        </div>
      </section>
    </ThemeTransition>
  );
};

export default Hero;