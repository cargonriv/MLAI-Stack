# Project Structure & Architecture

## Root Directory
- `src/` - Main application source code
- `public/` - Static assets (images, favicon, robots.txt)
- `supabase/` - Backend configuration and edge functions
- `scripts/` - Utility scripts (e.g., ONNX conversion)
- `dist/` - Production build output

## Source Code Organization (`src/`)

### Core Application
- `main.tsx` - Application entry point
- `App.tsx` - Root component with routing and providers
- `index.css` - Global styles and CSS variables
- `vite-env.d.ts` - Vite type definitions

### Pages (`src/pages/`)
Each page is a top-level route component:
- `Home.tsx` - Landing page with hero and model showcase
- `About.tsx` - Personal background and expertise
- `Blog.tsx` - Technical blog listing
- `BlogPost.tsx` - Individual blog post viewer
- `Resume.tsx` - Professional CV
- `Projects.tsx` - Past projects showcase
- `Showcase.tsx` - Interactive ML model demonstrations
- `Capstone.tsx` - SIDS prediction project details
- `NotFound.tsx` - 404 error page

### Components (`src/components/`)
- `Header.tsx` - Navigation header with mobile menu
- `Hero.tsx` - Landing page hero section
- `ModelCard.tsx` - Individual model display card
- `ModelsSection.tsx` - Collection of model cards
- `SafeHtml.tsx` - Secure HTML content renderer

#### Demo Components (`src/components/demos/`)
Interactive ML model demonstrations:
- `ImageClassificationDemo.tsx` - Image upload and classification
- `RecommendationDemo.tsx` - Movie recommendation system
- `SentimentAnalysisDemo.tsx` - Text sentiment analysis

#### UI Components (`src/components/ui/`)
Shadcn/ui component library - reusable, accessible components following Radix UI patterns

### Utilities & Integrations
- `src/lib/utils.ts` - Utility functions (cn for className merging)
- `src/hooks/` - Custom React hooks
- `src/integrations/supabase/` - Supabase client and type definitions
- `src/utils/` - ML-specific utilities (ONNX loading, etc.)

### Content (`src/content/`)
- `src/content/blog/` - Static HTML blog posts

## Architecture Patterns

### Component Structure
- Functional components with TypeScript
- Custom hooks for reusable logic
- Props interfaces defined inline or exported
- Consistent import order: React, UI components, utilities, types

### Styling Conventions
- Tailwind CSS classes with semantic naming
- CSS variables for theme colors and gradients
- Responsive design with mobile-first approach
- Custom animations and transitions defined in Tailwind config

### State Management
- React hooks (useState, useEffect) for local state
- TanStack Query for server state and caching
- Context providers for global state (theme, auth)

### File Naming
- PascalCase for React components (`ComponentName.tsx`)
- camelCase for utilities and hooks (`useCustomHook.ts`)
- kebab-case for static assets and config files

### Import Aliases
- `@/` - Points to `src/` directory
- `@/components` - UI components
- `@/lib` - Utility functions
- `@/hooks` - Custom hooks