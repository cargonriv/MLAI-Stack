# Technology Stack

## Frontend Framework
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and builds
- **React Router DOM** with HashRouter for client-side routing

## UI & Styling
- **Tailwind CSS** with custom design system and CSS variables
- **Shadcn/ui** component library for consistent UI components
- **Radix UI** primitives for accessible, unstyled components
- **Lucide React** for icons
- **Custom gradients and animations** defined in Tailwind config

## ML/AI Integration
- **Hugging Face Transformers.js** for client-side model inference
- **ONNX Runtime** for optimized model performance
- **WebGL acceleration** for computer vision tasks
- Custom model loading and management utilities in `src/utils/`

## Backend & Data
- **Supabase** for backend services and data management
- **Supabase Edge Functions** for serverless ML processing
- **TanStack Query** for data fetching and caching

## Development Tools
- **TypeScript** with strict typing
- **ESLint** with React hooks and refresh plugins
- **PostCSS** with Autoprefixer
- **Lovable Tagger** for development mode component tagging

## Common Commands

```bash
# Development
npm run dev          # Start development server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Deployment
npm run predeploy    # Pre-deployment build
npm run deploy       # Deploy to GitHub Pages
```

## Build Configuration
- **Base path**: `/` (root deployment)
- **Path alias**: `@` points to `./src`
- **Server**: Runs on `::` (all interfaces) port 8080
- **Asset optimization**: Vite handles code splitting and optimization