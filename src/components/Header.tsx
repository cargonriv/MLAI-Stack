import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Home, User, BookOpen, FileText, Folder, Brain, GraduationCap, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "#/", icon: Home },
    { name: "About", href: "#/about", icon: User },
    { name: "Blog", href: "#/blog", icon: BookOpen },
    { name: "Resume", href: "#/resume", icon: FileText },
    { name: "Projects", href: "#/projects", icon: Folder },
    { name: "Showcase", href: "#/showcase", icon: Brain },
    { name: "Capstone", href: "#/capstone", icon: GraduationCap },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <img 
                src="public/avatar.png" 
                alt="avatar" 
                className="w-9 h-15 hover:opacity-80"
              />
            </div>
            <span className="font-bold text-lg text-foreground">cargonriv's domain</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center space-x-2"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </a>
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="opacity-70 hover:opacity-100 transition-opacity"
              onClick={() => window.open("https://linkedin.com/in/cargonriv", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Contact
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-6">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-colors duration-200 p-3 rounded-lg hover:bg-secondary/50"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-lg">{item.name}</span>
                  </a>
                ))}
                <Button
                  variant="secondary"
                  className="justify-start mt-4"
                  onClick={() => {
                    window.open("https://linkedin.com/in/cargonriv", "_blank");
                    setIsOpen(false);
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;