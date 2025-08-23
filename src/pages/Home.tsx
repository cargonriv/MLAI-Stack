import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Brain,
  Code,
  BookOpen,
  User,
  Briefcase,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccessibility } from "@/hooks/use-accessibility";

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { preferences, getAriaProps } = useAccessibility();

  // Track mouse position for subtle parallax effects (disabled for reduced motion)
  useEffect(() => {
    if (preferences.reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [preferences.reducedMotion]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main
        id="main-content"
        {...getAriaProps("main", {
          label: "Carlos Gonzalez Rivera - ML Engineer Portfolio",
        })}
        className="pt-16"
      >
        {/* Enhanced About Section - mobile optimized */}
        <section className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
          {/* Background elements - mobile optimized */}
          <div className="absolute inset-0">
            <div
              className="absolute top-10 sm:top-20 left-4 sm:left-20 w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl sm:blur-2xl motion-reduce:animate-none"
              style={{
                transform: `translate(${mousePosition.x * 0.005}px, ${
                  mousePosition.y * 0.005
                }px)`,
              }}
            ></div>
            <div
              className="absolute bottom-10 sm:bottom-20 right-4 sm:right-20 w-24 sm:w-32 lg:w-40 h-24 sm:h-32 lg:h-40 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-xl sm:blur-2xl motion-reduce:animate-none"
              style={{
                transform: `translate(${mousePosition.x * -0.008}px, ${
                  mousePosition.y * 0.01
                }px)`,
              }}
            ></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl shadow-lg shadow-purple-500/25">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  About Me
                </span>
              </h2>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 p-4 sm:p-6 md:p-8 lg:p-12 shadow-xl">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-foreground/80 mb-6 sm:mb-8 leading-relaxed text-center">
                  I'm a dynamic and versatile{" "}
                  <span class="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Data Scientist
                  </span>{" "}
                  and{" "}
                  <span class="font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Biomedical Engineer
                  </span>{" "}
                  bridging the gap between healthcare innovation and artificial
                  intelligence. My expertise lies in developing robust machine
                  learning models, from{" "}
                  <span class="font-semibold text-cyan-400">
                    multimodal neuromorphic computing
                  </span>{" "}
                  and{" "}
                  <span class="font-semibold text-purple-400">
                    remote sensing foundation models
                  </span>{" "}
                  to{" "}
                  <span class="font-semibold text-pink-400">
                    full-stack web applications
                  </span>{" "}
                  and data-driven solutions that enhance human performance while
                  ensuring privacy and security.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
                  <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg sm:rounded-xl border border-purple-500/20 touch-manipulation hover:bg-purple-500/15 transition-colors duration-200">
                    <Code className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-purple-300">
                      Engineering
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">
                      Full-stack ML solutions from research to production
                    </p>
                  </div>

                  <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg sm:rounded-xl border border-cyan-500/20 touch-manipulation hover:bg-cyan-500/15 transition-colors duration-200">
                    <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-cyan-300">
                      Research
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">
                      Neuromorphic computing and advanced AI architectures
                    </p>
                  </div>

                  <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg sm:rounded-xl border border-pink-500/20 touch-manipulation hover:bg-pink-500/15 transition-colors duration-200 sm:col-span-2 md:col-span-1">
                    <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-pink-300">
                      Education
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">
                      Teaching and mentoring the next generation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Quick Links Section - mobile optimized */}
        <section className="py-12 sm:py-16 lg:py-24 relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5"></div>

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Explore My Work
                </span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-foreground/60 max-w-2xl mx-auto leading-relaxed">
                Dive into my portfolio, read my latest insights, or get in touch
                for collaborations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Portfolio Card - mobile optimized */}
              <div className="group relative overflow-hidden touch-manipulation">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-hover:blur-xl sm:group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-500 group-hover:scale-[1.02] lg:group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-purple-500/10">
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                      <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Portfolio
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-foreground/60 mb-4 sm:mb-6 text-center leading-relaxed">
                    Discover my favorite machine learning models and AI projects
                    with interactive demonstrations
                  </p>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      className="group/btn relative overflow-hidden border-purple-500/30 hover:border-purple-400/50 bg-background/10 backdrop-blur-sm hover:bg-purple-500/10 transition-all duration-300 touch-manipulation active:scale-95 text-sm sm:text-base w-full sm:w-auto"
                      onClick={() => (window.location.href = "#/showcase")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative z-10">View Models</span>
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2 relative z-10 group-hover/btn:scale-110 transition-all duration-300" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Blog Card - mobile optimized */}
              <div className="group relative overflow-hidden touch-manipulation">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-hover:blur-xl sm:group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 p-4 sm:p-6 lg:p-8 hover:border-cyan-500/30 transition-all duration-500 group-hover:scale-[1.02] lg:group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-cyan-500/10">
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-300">
                      <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Blog
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-foreground/60 mb-4 sm:mb-6 text-center leading-relaxed">
                    Insights and tutorials on AI/ML topics, from neural networks
                    to real-world applications
                  </p>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      className="group/btn relative overflow-hidden border-cyan-500/30 hover:border-cyan-400/50 bg-background/10 backdrop-blur-sm hover:bg-cyan-500/10 transition-all duration-300 touch-manipulation active:scale-95 text-sm sm:text-base w-full sm:w-auto"
                      onClick={() => (window.location.href = "#/blog")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative z-10">Read Posts</span>
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2 relative z-10 group-hover/btn:scale-110 transition-all duration-300" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contact Card - mobile optimized */}
              <div className="group relative overflow-hidden touch-manipulation md:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl group-hover:blur-xl sm:group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 p-4 sm:p-6 lg:p-8 hover:border-pink-500/30 transition-all duration-500 group-hover:scale-[1.02] lg:group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-pink-500/10">
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-pink-500/25 transition-all duration-300">
                      <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-center bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Contact
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-foreground/60 mb-4 sm:mb-6 text-center leading-relaxed">
                    Get in touch for collaborations, opportunities, or just to
                    discuss AI and technology
                  </p>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      className="group/btn relative overflow-hidden border-pink-500/30 hover:border-pink-400/50 bg-background/10 backdrop-blur-sm hover:bg-pink-500/10 transition-all duration-300 touch-manipulation active:scale-95 text-sm sm:text-base w-full sm:w-auto"
                      onClick={() => {
                        window.open(
                          "https://linkedin.com/in/cargonriv",
                          "_blank"
                        );
                        setIsOpen(false);
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/10 to-pink-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative z-10">Let's Connect</span>
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2 relative z-10 group-hover/btn:scale-110 transition-all duration-300" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
