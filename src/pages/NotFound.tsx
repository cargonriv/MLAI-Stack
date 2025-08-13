import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
      <a 
                href="https://linkedin.com/in/cargonriv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/174/174857.png" 
                  alt="LinkedIn" 
                  className="w-12 h-12 hover:opacity-80"
                />
              </a>
              <a 
                href="https://github.com/cargonriv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                  <img 
                  src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" 
                  alt="GitHub" 
                  className="w-12 h-12 hover:opacity-80"
                />
              </a>
              <a 
                href="https://www.instagram.com/cargonriv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-colors"
              >
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" 
                  alt="Instagram" 
                  className="w-12 h-12 hover:opacity-80"
                />
              </a>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
