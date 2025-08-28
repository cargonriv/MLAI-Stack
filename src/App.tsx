import { useEffect, lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useAccessibility } from "@/hooks/use-accessibility";
// import AccessibilityStatus from "@/components/AccessibilityStatus";
import { performanceMonitor } from "@/utils/performance";
import {
  initializeBrowserDetection,
  loadPolyfills,
  needsPolyfills,
} from "@/utils/browser-detection";
import { initializeCompatibilityTesting } from "@/utils/compatibility-testing";
import BrowserCompatibility from "@/components/BrowserCompatibility";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import {
  ErrorBoundary,
  AsyncErrorBoundary,
} from "@/components/ui/error-boundary";
import { OfflineIndicator } from "@/hooks/use-offline";
import { ErrorProvider } from "@/components/ui/global-error-handler";
import AdvancedTokenizedChat from "@/components/AdvancedTokenizedChat";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Resume = lazy(() => import("./pages/Resume"));
const Showcase = lazy(() => import("./pages/Showcase"));
const Projects = lazy(() => import("./pages/Projects"));
const Capstone = lazy(() => import("./pages/Capstone"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdvancedEffectsShowcase = lazy(
  () => import("@/components/AdvancedEffectsShowcase")
);

// Demo pages
const ImageClassification = lazy(() => import("./pages/demos/ImageClassification"));
// Temporarily disable lazy loading for debugging
import SentimentAnalysisPage from "./pages/demos/SentimentAnalysis";
const SentimentAnalysis = () => <SentimentAnalysisPage />;
const MovieRecommendation = lazy(() => import("./pages/demos/MovieRecommendation"));
const ChatBot = lazy(() => import("./pages/demos/ChatBot"));
const TokenizedChatPage = lazy(() => import("./pages/demos/TokenizedChat"));
// Page loading fallback component
const PageSkeleton = () => (
  <div className="min-h-screen bg-background p-4">
    <div className="container mx-auto space-y-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
    },
  },
});

const AppContent = () => {
  const { preferences, announce } = useAccessibility();
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Initialize browser detection and compatibility features
    initializeBrowserDetection();

    // Load polyfills if needed
    if (needsPolyfills()) {
      loadPolyfills().catch((error) => {
        console.warn("Failed to load some polyfills:", error);
      });
    }

    // Run compatibility tests in development
    if (process.env.NODE_ENV === "development") {
      try {
        initializeCompatibilityTesting();
      } catch (error) {
        console.warn("Compatibility testing failed:", error);
      }
    }

    // Announce page changes for screen readers
    const handleHashChange = () => {
      const path = window.location.hash.replace("#/", "");
      const pageName = path || "home";
      announce(`Navigated to ${pageName} page`, "polite");
    };

    window.addEventListener("hashchange", handleHashChange);

    // Performance monitoring setup
    const handleWebVital = (event: CustomEvent) => {
      const { name, value, rating } = event.detail;
      console.log(`[Web Vital] ${name}: ${value.toFixed(2)}ms (${rating})`);
    };

    window.addEventListener("web-vital", handleWebVital as EventListener);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("web-vital", handleWebVital as EventListener);
      performanceMonitor.dispose();
    };
  }, [announce]);

  return (
    <div
      className={`min-h-screen ${preferences.highContrast ? "high-contrast" : ""
        }`}
    >
      <OfflineIndicator />
      <ScrollProgress />
      <Toaster />
      <Sonner />

      <ErrorBoundary
        onError={(error) => {
          console.error("Page content error:", error);
        }}
      >
        <PageTransition>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/showcase" element={<Showcase />} />
              <Route path="/capstone" element={<Capstone />} />
              <Route path="/effects" element={<AdvancedEffectsShowcase />} />
              {/* Demo pages */}
              <Route path="/demos/image-classification" element={<ImageClassification />} />
              <Route path="/demos/sentiment-analysis" element={<SentimentAnalysis />} />
              <Route path="/demos/movie-recommendation" element={<MovieRecommendation />} />
              <Route path="/demos/chatbot" element={<ChatBot />} />
              <Route path="/demos/tokenized-chat" element={<TokenizedChatPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </ErrorBoundary>

      {/* Global Chat Widget */}
      <ErrorBoundary
        onError={(error) => {
          console.error("Chat widget error:", error);
        }}
      >
        <AdvancedTokenizedChat isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
      </ErrorBoundary>

      {/* <AccessibilityStatus /> */}
    </div>
  );
};

const App = () => (
  <AsyncErrorBoundary
    onError={(error, errorInfo) => {
      console.error("Global error caught:", error, errorInfo);
      // In production, send to error tracking service
      if (process.env.NODE_ENV === "production") {
        // Example: errorTrackingService.captureException(error, { extra: errorInfo });
      }
    }}
  >
    <ErrorProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorProvider>
  </AsyncErrorBoundary>
);

export default App;
