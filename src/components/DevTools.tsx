/**
 * Development Tools Component
 * Provides toggle-able Performance Monitor and Browser Compatibility Testing
 */

import React, { useState } from 'react';
import PerformanceMonitor from './PerformanceMonitor';
import BrowserCompatibility from './BrowserCompatibility';
import { Settings, Activity, Shield } from 'lucide-react';

interface DevToolsProps {
  showInProduction?: boolean;
}

export const DevTools: React.FC<DevToolsProps> = ({
  showInProduction = false
}) => {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [showBrowserCompatibility, setShowBrowserCompatibility] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  // Only show in development mode unless explicitly enabled for production
  const isDevelopment = import.meta.env.DEV;
  if (!isDevelopment && !showInProduction) {
    return null;
  }

  return (
    <>
      {/* Dev Tools Toggle Button */}
      <div className="absolute top-24 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setIsDevToolsOpen(!isDevToolsOpen)}
            className="p-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg hover:bg-muted/50 transition-colors"
            title="Development Tools"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Dev Tools Menu */}
          {isDevToolsOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-3">Development Tools</h3>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPerformanceMonitor}
                    onChange={(e) => setShowPerformanceMonitor(e.target.checked)}
                    className="rounded border-border"
                  />
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Performance Monitor</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBrowserCompatibility}
                    onChange={(e) => setShowBrowserCompatibility(e.target.checked)}
                    className="rounded border-border"
                  />
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Browser Compatibility</span>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Toggle monitoring tools for development and testing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Monitor */}
      {showPerformanceMonitor && (
        <PerformanceMonitor
          defaultOpen={true}
          position="bottom-right"
          updateInterval={2000}
        />
      )}

      {/* Browser Compatibility Testing */}
      {showBrowserCompatibility && (
        <BrowserCompatibility
          defaultOpen={true}
          position="bottom-left"
          showTestResults={true}
          autoRunTests={false}
        />
      )}
    </>
  );
};

export default DevTools;