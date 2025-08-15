import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { serviceWorkerManager } from './utils/service-worker'

// Register service worker for offline functionality
if (process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register().catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
