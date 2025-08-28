import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Home, User, BookOpen, FileText, Folder, Brain, GraduationCap, ExternalLink, ChevronDown, Camera, MessageSquare, Star, Hash } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAccessibility } from "@/hooks/use-accessibility";
import DevTools from "@/components/DevTools";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { preferences, handleKeyboardNavigation, getAriaProps, announce } = useAccessibility();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "#/", icon: Home },
    { name: "About", href: "#/about", icon: User },
    { name: "Blog", href: "#/blog", icon: BookOpen },
    { name: "Resume", href: "#/resume", icon: FileText },
    { name: "Projects", href: "#/projects", icon: Folder },
    { name: "Capstone", href: "#/capstone", icon: GraduationCap },
  ];

  const showcaseItems = [
    { name: "Showcase Overview", href: "#/showcase", icon: Brain },
    { name: "Image Classification", href: "#/demos/image-classification", icon: Camera },
    { name: "Sentiment Analysis", href: "#/demos/sentiment-analysis", icon: MessageSquare },
    { name: "Movie Recommendation", href: "#/demos/movie-recommendation", icon: Star },
    { name: "Tokenized Chat", href: "#/demos/tokenized-chat", icon: Hash },
  ];

  return (
    <>
      {/* Skip Links */}
      <a 
        href="#main-content" 
        className="skip-link focus-gradient-ring"
        onFocus={() => announce("Skip to main content link focused")}
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="skip-link focus-gradient-ring"
        onFocus={() => announce("Skip to navigation link focused")}
      >
        Skip to navigation
      </a>

      <header 
        {...getAriaProps('banner', { label: 'Main navigation' })}
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          preferences.reducedMotion ? '' : 'duration-slow ease-out-quart'
        } ${
          isScrolled 
            ? 'bg-bg-secondary/70 backdrop-blur-xl border-b border-accent-primary/20 shadow-elevated' 
            : 'bg-bg-primary/40 backdrop-blur-lg border-b border-border/30'
        }`}
      >
      <div className="container mx-auto px-4 sm:px-6">
        <div className={`flex items-center justify-between transition-all ${
          preferences.reducedMotion ? '' : 'duration-normal ease-out-quart'
        } ${
          isScrolled ? 'h-12 sm:h-14' : 'h-14 sm:h-16'
        }`}>
          {/* Logo */}
          <a 
            href="#/"
            className="flex items-center space-x-2 sm:space-x-3 group focus-gradient-ring rounded-lg p-1"
            {...getAriaProps('link', { label: 'Carlos Gonzalez Rivera - ML Engineer Portfolio Home' })}
            onKeyDown={(e) => handleKeyboardNavigation(e, {
              onEnter: () => window.location.hash = '/',
              onSpace: () => window.location.hash = '/'
            })}
          >
            <div className={`relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center overflow-hidden transition-all ${
              preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:scale-105 group-hover:shadow-glow-sm'
            }`}>
              <div className={`absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity ${
                preferences.reducedMotion ? '' : 'animate-gradient-shift duration-normal'
              }`}></div>
              <img 
                src="/avatar.png" 
                alt="Carlos Gonzalez Rivera avatar" 
                className={`w-7 h-12 sm:w-9 sm:h-15 relative z-10 transition-all ${
                  preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:brightness-110'
                }`}
              />
            </div>
            <span className={`font-bold text-base sm:text-lg text-fg-primary transition-all ${
              preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:text-accent-primary group-hover:drop-shadow-sm'
            } hidden xs:block`}>
              cargonriv's domain
            </span>
            <span className={`font-bold text-sm text-fg-primary transition-all ${
              preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:text-accent-primary group-hover:drop-shadow-sm'
            } block xs:hidden`}>
              cargonriv
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav 
            id="navigation"
            {...getAriaProps('navigation', { label: 'Main navigation menu' })}
            className="hidden lg:flex items-center space-x-6 xl:space-x-8"
          >
            {navItems.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                className={`group relative text-fg-secondary hover:text-accent-primary transition-all ${
                  preferences.reducedMotion ? '' : 'duration-normal ease-out-quart'
                } flex items-center space-x-2 py-2 px-2 xl:px-3 rounded-lg hover:bg-bg-secondary/50 hover:backdrop-blur-sm focus-gradient-ring touch-target`}
                {...getAriaProps('link', { 
                  label: `Navigate to ${item.name} page`,
                  current: window.location.hash === item.href ? 'page' : undefined
                })}
                onKeyDown={(e) => handleKeyboardNavigation(e, {
                  onEnter: () => window.location.hash = item.href.replace('#', ''),
                  onSpace: () => window.location.hash = item.href.replace('#', '')
                })}
                onFocus={() => announce(`${item.name} navigation link focused`)}
              >
                <item.icon 
                  className={`w-4 h-4 transition-all ${
                    preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:scale-110 group-hover:text-accent-primary'
                  }`}
                  aria-hidden="true"
                />
                <span className="relative text-sm xl:text-base">
                  {item.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all ${
                    preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:w-full'
                  }`}></span>
                </span>
              </a>
            ))}
            
            {/* Showcase Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`group relative text-fg-secondary hover:text-accent-primary transition-all ${
                    preferences.reducedMotion ? '' : 'duration-normal ease-out-quart'
                  } flex items-center space-x-2 py-2 px-2 xl:px-3 rounded-lg hover:bg-bg-secondary/50 hover:backdrop-blur-sm focus-gradient-ring touch-target`}
                >
                  <Brain 
                    className={`w-4 h-4 transition-all ${
                      preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:scale-110 group-hover:text-accent-primary'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative text-sm xl:text-base">
                    Showcase
                    <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all ${
                      preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:w-full'
                    }`}></span>
                  </span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {showcaseItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <a
                      href={item.href}
                      className="flex items-center space-x-2 w-full"
                      onClick={() => announce(`Navigating to ${item.name}`)}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="secondary"
              size="sm"
              className={`relative overflow-hidden bg-bg-secondary/50 border border-accent-primary/20 text-fg-primary hover:text-accent-primary hover:border-accent-primary/40 hover:bg-bg-secondary/70 hover:shadow-glow-sm transition-all ${
                preferences.reducedMotion ? '' : 'duration-normal ease-out-quart hover:scale-105'
              } text-sm xl:text-base focus-gradient-ring touch-target`}
              onClick={() => {
                window.open("https://linkedin.com/in/cargonriv", "_blank");
                announce("Opening LinkedIn profile in new tab");
              }}
              onKeyDown={(e) => handleKeyboardNavigation(e, {
                onEnter: () => {
                  window.open("https://linkedin.com/in/cargonriv", "_blank");
                  announce("Opening LinkedIn profile in new tab");
                },
                onSpace: () => {
                  window.open("https://linkedin.com/in/cargonriv", "_blank");
                  announce("Opening LinkedIn profile in new tab");
                }
              })}
              {...getAriaProps('button', { 
                label: 'Contact Carlos via LinkedIn - Opens in new tab'
              })}
            >
              <div className={`absolute inset-0 bg-gradient-primary opacity-0 hover:opacity-10 transition-opacity ${
                preferences.reducedMotion ? '' : 'duration-normal'
              }`}></div>
              <ExternalLink className="w-4 h-4 mr-2 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Contact</span>
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                className={`relative p-1.5 sm:p-2 rounded-lg bg-bg-secondary/30 border border-accent-primary/20 hover:bg-bg-secondary/50 hover:border-accent-primary/40 hover:shadow-glow-sm transition-all ${
                  preferences.reducedMotion ? '' : 'duration-normal ease-out-quart hover:scale-105'
                } touch-manipulation focus-gradient-ring`}
                {...getAriaProps('button', { 
                  label: isOpen ? 'Close navigation menu' : 'Open navigation menu',
                  expanded: isOpen
                })}
                onKeyDown={(e) => handleKeyboardNavigation(e, {
                  onEnter: () => setIsOpen(!isOpen),
                  onSpace: () => setIsOpen(!isOpen),
                  onEscape: () => setIsOpen(false)
                })}
                onClick={() => {
                  setIsOpen(!isOpen);
                  announce(isOpen ? "Navigation menu closed" : "Navigation menu opened");
                }}
              >
                <Menu 
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-fg-secondary hover:text-accent-primary transition-colors ${
                    preferences.reducedMotion ? '' : 'duration-normal'
                  }`}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  {isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-[280px] sm:w-[320px] bg-bg-primary/95 backdrop-blur-xl border-l border-accent-primary/20 safe-area-inset-right"
              {...getAriaProps('navigation', { label: 'Mobile navigation menu' })}
            >
              <div className="flex flex-col space-y-1 sm:space-y-2 mt-6 sm:mt-8 px-2">
                <h2 className="sr-only">Navigation Menu</h2>
                {navItems.map((item, index) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center space-x-3 sm:space-x-4 text-fg-secondary hover:text-accent-primary transition-all ${
                      preferences.reducedMotion ? '' : 'duration-normal ease-out-quart animate-slide-right'
                    } p-3 sm:p-4 rounded-xl hover:bg-bg-secondary/50 hover:backdrop-blur-sm hover:shadow-glow-sm touch-manipulation active:scale-95 focus-gradient-ring`}
                    style={{ animationDelay: preferences.reducedMotion ? '0ms' : `${index * 50}ms` }}
                    onClick={() => {
                      setIsOpen(false);
                      announce(`Navigating to ${item.name}`);
                    }}
                    onKeyDown={(e) => handleKeyboardNavigation(e, {
                      onEnter: () => {
                        setIsOpen(false);
                        window.location.hash = item.href.replace('#', '');
                        announce(`Navigating to ${item.name}`);
                      },
                      onSpace: () => {
                        setIsOpen(false);
                        window.location.hash = item.href.replace('#', '');
                        announce(`Navigating to ${item.name}`);
                      }
                    })}
                    {...getAriaProps('link', { 
                      label: `Navigate to ${item.name} page`,
                      current: window.location.hash === item.href ? 'page' : undefined
                    })}
                  >
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-bg-secondary/50 border border-accent-primary/20 group-hover:border-accent-primary/40 group-hover:shadow-glow-sm transition-all ${
                      preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:scale-110'
                    }`}>
                      <item.icon 
                        className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:text-accent-primary transition-colors ${
                          preferences.reducedMotion ? '' : 'duration-normal'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-base sm:text-lg font-medium">{item.name}</span>
                  </a>
                ))}
                
                {/* Showcase Section */}
                <div className="mt-4 pt-4 border-t border-accent-primary/20">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                    Showcase & Demos
                  </h3>
                  {showcaseItems.map((item, index) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center space-x-3 sm:space-x-4 text-fg-secondary hover:text-accent-primary transition-all ${
                        preferences.reducedMotion ? '' : 'duration-normal ease-out-quart animate-slide-right'
                      } p-3 sm:p-4 rounded-xl hover:bg-bg-secondary/50 hover:backdrop-blur-sm hover:shadow-glow-sm touch-manipulation active:scale-95 focus-gradient-ring`}
                      style={{ animationDelay: preferences.reducedMotion ? '0ms' : `${(navItems.length + index) * 50}ms` }}
                      onClick={() => {
                        setIsOpen(false);
                        announce(`Navigating to ${item.name}`);
                      }}
                      onKeyDown={(e) => handleKeyboardNavigation(e, {
                        onEnter: () => {
                          setIsOpen(false);
                          window.location.hash = item.href.replace('#', '');
                          announce(`Navigating to ${item.name}`);
                        },
                        onSpace: () => {
                          setIsOpen(false);
                          window.location.hash = item.href.replace('#', '');
                          announce(`Navigating to ${item.name}`);
                        }
                      })}
                      {...getAriaProps('link', { 
                        label: `Navigate to ${item.name} page`,
                        current: window.location.hash === item.href ? 'page' : undefined
                      })}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-bg-secondary/50 border border-accent-primary/20 group-hover:border-accent-primary/40 group-hover:shadow-glow-sm transition-all ${
                        preferences.reducedMotion ? '' : 'duration-normal ease-out-quart group-hover:scale-110'
                      }`}>
                        <item.icon 
                          className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:text-accent-primary transition-colors ${
                            preferences.reducedMotion ? '' : 'duration-normal'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-base sm:text-lg font-medium">{item.name}</span>
                    </a>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  className={`justify-start mt-4 sm:mt-6 mx-2 sm:mx-4 bg-gradient-primary text-bg-primary hover:shadow-glow-md transition-all ${
                    preferences.reducedMotion ? '' : 'hover:scale-105 duration-normal ease-out-quart animate-slide-right'
                  } touch-manipulation active:scale-95 focus-gradient-ring`}
                  style={{ animationDelay: preferences.reducedMotion ? '0ms' : `${navItems.length * 50}ms` }}
                  onClick={() => {
                    window.open("https://linkedin.com/in/cargonriv", "_blank");
                    setIsOpen(false);
                    announce("Opening LinkedIn profile in new tab");
                  }}
                  onKeyDown={(e) => handleKeyboardNavigation(e, {
                    onEnter: () => {
                      window.open("https://linkedin.com/in/cargonriv", "_blank");
                      setIsOpen(false);
                      announce("Opening LinkedIn profile in new tab");
                    },
                    onSpace: () => {
                      window.open("https://linkedin.com/in/cargonriv", "_blank");
                      setIsOpen(false);
                      announce("Opening LinkedIn profile in new tab");
                    }
                  })}
                  {...getAriaProps('button', { 
                    label: 'Contact Carlos via LinkedIn - Opens in new tab'
                  })}
                >
                  <ExternalLink className="w-4 h-4 mr-3" aria-hidden="true" />
                  <span className="font-medium">Contact</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <DevTools showInProduction={false} />
    </header>
    </>
  );
};

export default Header;