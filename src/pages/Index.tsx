import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ModelsSection from "@/components/ModelsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16"> {/* Add padding to account for fixed header */}
        <Hero />
        <ModelsSection />
      </div>
    </div>
  );
};

export default Index;
