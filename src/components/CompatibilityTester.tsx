import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  runCompatibilityTests, 
  logCompatibilityReport,
  type CompatibilityReport 
} from '@/utils/compatibility-testing';
import { 
  runAccessibilityTests, 
  logAccessibilityReport,
  type AccessibilityReport 
} from '@/utils/accessibility-testing';
import { 
  initializeBrowserDetection, 
  getBrowserInfo, 
  getFeatureSupport,
  type BrowserInfo,
  type FeatureSupport 
} from '@/utils/browser-detection';
import { CheckCircle, XCircle, AlertTriangle, Info, Monitor, Accessibility } from 'lucide-react';

interface CompatibilityTesterProps {
  className?: string;
}

export function CompatibilityTester({ className }: CompatibilityTesterProps) {
  const [compatibilityReport, setCompatibilityReport] = useState<CompatibilityReport | null>(null);
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport | null>(null);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [featureSupport, setFeatureSupport] = useState<FeatureSupport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize browser detection on component mount
    initializeBrowserDetection();
    setBrowserInfo(getBrowserInfo());
    setFeatureSupport(getFeatureSupport());
  }, []);

  const runTests = async () => {
    setIsLoading(true);
    
    try {
      // Run compatibility tests
      const compatReport = runCompatibilityTests();
      setCompatibilityReport(compatReport);
      logCompatibilityReport(compatReport);
      
      // Run accessibility tests
      const a11yReport = runAccessibilityTests();
      setAccessibilityReport(a11yReport);
      logAccessibilityReport(a11yReport);
      
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Cross-Browser Compatibility & Accessibility Tester
          </CardTitle>
          <CardDescription>
            Test browser compatibility, feature support, and accessibility compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Running Tests...' : 'Run Compatibility Tests'}
          </Button>

          {browserInfo && (
            <Alert className="mb-4">
              <Monitor className="h-4 w-4" />
              <AlertDescription>
                <strong>Browser:</strong> {browserInfo.name} {browserInfo.version} ({browserInfo.engine}) on {browserInfo.platform}
                <br />
                <strong>Device:</strong> {browserInfo.isMobile ? 'Mobile' : browserInfo.isTablet ? 'Tablet' : 'Desktop'}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="compatibility" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compatibility">Browser Compatibility</TabsTrigger>
              <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
              <TabsTrigger value="features">Feature Support</TabsTrigger>
            </TabsList>

            <TabsContent value="compatibility" className="space-y-4">
              {compatibilityReport ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Overall Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{compatibilityReport.overallScore}%</div>
                        <Progress value={compatibilityReport.overallScore} className="mt-2" />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Critical Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          {compatibilityReport.criticalIssues}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                          {compatibilityReport.warnings}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {compatibilityReport.tests.map((test, index) => (
                      <Card key={index} className={`${test.passed ? 'border-green-200' : 'border-red-200'}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {test.passed ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                              ) : (
                                getSeverityIcon(test.severity)
                              )}
                              <div>
                                <h4 className="font-medium">{test.testName}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                                {test.recommendation && (
                                  <p className="text-sm text-blue-600 mt-2">
                                    <strong>Recommendation:</strong> {test.recommendation}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge variant={test.passed ? 'default' : getSeverityColor(test.severity)}>
                              {test.passed ? 'Pass' : test.severity}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Run tests to see compatibility results
                </div>
              )}
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-4">
              {accessibilityReport ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">A11y Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{accessibilityReport.score}%</div>
                        <Progress value={accessibilityReport.score} className="mt-2" />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">WCAG AA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${accessibilityReport.wcagCompliance.levelAA ? 'text-green-500' : 'text-red-500'}`}>
                          {accessibilityReport.wcagCompliance.levelAA ? '✓' : '✗'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          {accessibilityReport.errors.length}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                          {accessibilityReport.warnings.length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {[...accessibilityReport.errors, ...accessibilityReport.warnings, ...accessibilityReport.info]
                      .slice(0, 10) // Show first 10 issues
                      .map((issue, index) => (
                      <Card key={index} className="border-orange-200">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Accessibility className="h-5 w-5 text-blue-500 mt-0.5" />
                              <div>
                                <h4 className="font-medium">{issue.rule}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{issue.message}</p>
                                <p className="text-sm text-blue-600 mt-2">
                                  <strong>Recommendation:</strong> {issue.recommendation}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  WCAG {issue.wcagLevel}: {issue.wcagCriterion}
                                </p>
                              </div>
                            </div>
                            <Badge variant={getSeverityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Run tests to see accessibility results
                </div>
              )}
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              {featureSupport ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(featureSupport).map(([feature, supported]) => (
                    <Card key={feature}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium capitalize">
                              {feature.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {supported ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <Badge variant={supported ? 'default' : 'secondary'}>
                              {supported ? 'Supported' : 'Not Supported'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Feature support information not available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompatibilityTester;