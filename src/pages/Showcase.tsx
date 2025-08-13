import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModelsSection from "@/components/ModelsSection";

const Showcase = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <Hero />
        <ModelsSection />
      </div>
    </div>
  );
};

export default Showcase;