import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModelsSection from "@/components/ModelsSection";
import { useEffect, useState, Suspense } from "react";
import { LazyComponent } from "@/components/ui/lazy-component";
import { Skeleton } from "@/components/ui/skeleton";
import { useReducedMotion } from "@/hooks/use-optimized-animation";

const Showcase = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  // Track mouse position for subtle parallax effects (disabled for reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-10 w-40 h-40 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.025}px)`,
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-2xl"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * -0.02}px)`,
          }}
        ></div>
      </div>
      
      <Header />
      <div className="pt-16 relative z-10">
        <Hero />
        <LazyComponent
          fallback={
            <div className="container mx-auto px-4 py-16">
              <div className="text-center mb-12">
                <Skeleton className="h-12 w-64 mx-auto mb-4" />
                <Skeleton className="h-6 w-96 mx-auto" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-96 w-full" />
                ))}
              </div>
            </div>
          }
          minHeight="600px"
        >
          <Suspense fallback={
            <div className="container mx-auto px-4 py-16">
              <Skeleton className="h-96 w-full" />
            </div>
          }>
            <ModelsSection />
          </Suspense>
        </LazyComponent>
      </div>
    </div>
  );
};

export default Showcase;