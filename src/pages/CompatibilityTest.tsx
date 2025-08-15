import React from 'react';
import { Helmet } from 'react-helmet-async';
import CompatibilityTester from '@/components/CompatibilityTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Monitor, Shield, Zap, Globe } from 'lucide-react';

const CompatibilityTestPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Browser Compatibility & Accessibility Testing - ML Portfolio</title>
        <meta name="description" content="Test cross-browser compatibility, feature support, and accessibility compliance for the ML Engineer portfolio website." />
        <meta name="keywords" content="browser compatibility, accessibility testing, WCAG compliance, cross-browser testing, web standards" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Compatibility & Accessibility Testing
            </h1>
            <p className="text-lg text-fg-secondary max-w-3xl mx-auto">
              Comprehensive testing suite for cross-browser compatibility, feature support, 
              and accessibility compliance to ensure optimal user experience across all platforms.
            </p>
          </div>

          {/* Feature Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-card border-accent-primary/20">
              <CardHeader className="pb-3">
                <Monitor className="h-8 w-8 text-accent-primary mb-2" />
                <CardTitle className="text-lg">Browser Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically detect browser type, version, and capabilities for optimal compatibility.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-accent-secondary/20">
              <CardHeader className="pb-3">
                <Zap className="h-8 w-8 text-accent-secondary mb-2" />
                <CardTitle className="text-lg">Feature Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Test support for modern web features like CSS Grid, WebGL, and JavaScript APIs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-accent-tertiary/20">
              <CardHeader className="pb-3">
                <Shield className="h-8 w-8 text-accent-tertiary mb-2" />
                <CardTitle className="text-lg">Accessibility</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Validate WCAG compliance and accessibility best practices for inclusive design.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-accent-primary/20">
              <CardHeader className="pb-3">
                <Globe className="h-8 w-8 text-accent-primary mb-2" />
                <CardTitle className="text-lg">Cross-Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ensure consistent experience across desktop, tablet, and mobile devices.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Testing Information */}
          <Alert className="bg-gradient-card border-accent-primary/30">
            <Monitor className="h-4 w-4" />
            <AlertDescription className="text-fg-primary">
              <strong>Testing Coverage:</strong> This tool tests for modern browser features, 
              accessibility compliance (WCAG 2.1 AA/AAA), performance optimizations, and 
              cross-browser compatibility issues. Results are logged to the console for detailed analysis.
            </AlertDescription>
          </Alert>

          {/* Main Testing Component */}
          <CompatibilityTester />

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent-primary" />
                  Accessibility Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>WCAG 2.1 Level A</span>
                  <Badge variant="outline">Basic Compliance</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>WCAG 2.1 Level AA</span>
                  <Badge variant="default">Standard Compliance</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>WCAG 2.1 Level AAA</span>
                  <Badge variant="secondary">Enhanced Compliance</Badge>
                </div>
                <p className="text-sm text-fg-secondary mt-4">
                  Tests include color contrast, keyboard navigation, screen reader compatibility, 
                  focus management, and semantic HTML structure.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-accent-secondary" />
                  Browser Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Chrome 88+</span>
                  <Badge variant="default">Fully Supported</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Firefox 85+</span>
                  <Badge variant="default">Fully Supported</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Safari 14+</span>
                  <Badge variant="default">Fully Supported</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Edge 88+</span>
                  <Badge variant="default">Fully Supported</Badge>
                </div>
                <p className="text-sm text-fg-secondary mt-4">
                  Automatic fallbacks and polyfills ensure compatibility with older browsers 
                  while maintaining optimal performance on modern platforms.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Technical Details */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Technical Implementation</CardTitle>
              <CardDescription>
                Advanced testing methodologies and compatibility strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-accent-primary">Feature Detection</h4>
                  <ul className="text-sm text-fg-secondary space-y-1">
                    <li>• CSS.supports() API for feature queries</li>
                    <li>• JavaScript API availability checks</li>
                    <li>• Hardware acceleration detection</li>
                    <li>• Media query capability testing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-accent-secondary">Fallback Strategies</h4>
                  <ul className="text-sm text-fg-secondary space-y-1">
                    <li>• Progressive enhancement approach</li>
                    <li>• Graceful degradation for unsupported features</li>
                    <li>• Polyfill loading for missing APIs</li>
                    <li>• Alternative implementations for legacy browsers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CompatibilityTestPage;