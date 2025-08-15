import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff, Keyboard, Volume2 } from 'lucide-react';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';

interface AccessibilityStatusProps {
  className?: string;
}

export const AccessibilityStatus: React.FC<AccessibilityStatusProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { preferences, announce, getAriaProps } = useAccessibility();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    announce(isExpanded ? "Accessibility panel collapsed" : "Accessibility panel expanded", "polite");
  };

  const statusItems = [
    {
      key: 'reducedMotion',
      label: 'Reduced Motion',
      icon: Eye,
      active: preferences.reducedMotion,
      description: 'Animations and transitions are reduced'
    },
    {
      key: 'highContrast',
      label: 'High Contrast',
      icon: EyeOff,
      active: preferences.highContrast,
      description: 'High contrast colors are enabled'
    },
    {
      key: 'keyboardNavigation',
      label: 'Keyboard Navigation',
      icon: Keyboard,
      active: preferences.keyboardNavigation,
      description: 'Keyboard navigation is active'
    },
    {
      key: 'screenReader',
      label: 'Screen Reader',
      icon: Volume2,
      active: preferences.screenReader,
      description: 'Screen reader support is detected'
    }
  ];

  const activePreferences = statusItems.filter(item => item.active);

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <div className="bg-bg-secondary/90 backdrop-blur-lg border border-accent-primary/20 rounded-lg shadow-elevated">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          className="w-full p-3 justify-between focus-gradient-ring"
          {...getAriaProps('button', {
            label: `Accessibility status: ${activePreferences.length} preferences active. ${isExpanded ? 'Collapse' : 'Expand'} panel`,
            expanded: isExpanded
          })}
        >
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">A11y</span>
            {activePreferences.length > 0 && (
              <span className="bg-accent-primary text-bg-primary text-xs px-1.5 py-0.5 rounded-full">
                {activePreferences.length}
              </span>
            )}
          </div>
          <div className={cn(
            "transition-transform duration-200",
            isExpanded ? "rotate-180" : ""
          )}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Button>

        {/* Expanded Panel */}
        {isExpanded && (
          <div 
            className="border-t border-accent-primary/20 p-3 space-y-2"
            {...getAriaProps('region', { label: 'Accessibility preferences status' })}
          >
            <h3 className="text-sm font-semibold text-fg-primary mb-2">
              Active Accessibility Features
            </h3>
            
            {activePreferences.length === 0 ? (
              <p className="text-sm text-fg-secondary">
                No accessibility preferences detected
              </p>
            ) : (
              <div className="space-y-2">
                {activePreferences.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center space-x-2 p-2 bg-bg-tertiary/50 rounded-md"
                    >
                      <Icon className="w-4 h-4 text-accent-primary" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg-primary">
                          {item.label}
                        </p>
                        <p className="text-xs text-fg-secondary">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-accent-primary/20">
              <p className="text-xs text-fg-secondary mb-2">
                Quick Actions
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 py-1 h-auto focus-gradient-ring"
                  onClick={() => {
                    const mainContent = document.getElementById('main-content');
                    if (mainContent) {
                      mainContent.focus();
                      mainContent.scrollIntoView({ behavior: 'smooth' });
                      announce("Focused main content", "polite");
                    }
                  }}
                  {...getAriaProps('button', { label: 'Skip to main content' })}
                >
                  Skip to Main
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 py-1 h-auto focus-gradient-ring"
                  onClick={() => {
                    const navigation = document.getElementById('navigation');
                    if (navigation) {
                      navigation.focus();
                      navigation.scrollIntoView({ behavior: 'smooth' });
                      announce("Focused navigation", "polite");
                    }
                  }}
                  {...getAriaProps('button', { label: 'Skip to navigation' })}
                >
                  Skip to Nav
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessibilityStatus;