import React, { useState } from 'react';
import { 
  AdvancedVisualEffects, 
  GradientBorder, 
  Hover3D, 
  ParticleEffect, 
  DynamicColorScheme,
  ThemeTransition 
} from '@/components/ui/advanced-visual-effects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AdvancedEffectsShowcase: React.FC = () => {
  const [celebrationTrigger, setCelebrationTrigger] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string>('mesh');

  const triggerCelebration = () => {
    setCelebrationTrigger(true);
    setTimeout(() => setCelebrationTrigger(false), 100);
  };

  const effects = [
    { id: 'mesh', name: 'Gradient Mesh', description: 'Sophisticated gradient overlays with animated patterns' },
    { id: 'orbs', name: 'Floating Orbs', description: 'Dynamic 3D floating elements with parallax motion' },
    { id: 'particles', name: 'Particle System', description: 'Ambient particle effects for enhanced atmosphere' },
    { id: 'glass', name: 'Glass Morphism', description: 'Advanced glassmorphism with backdrop blur effects' },
    { id: 'dynamic', name: 'Dynamic Colors', description: 'Interactive color schemes that respond to user input' }
  ];

  return (
    <ThemeTransition className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Advanced Visual Effects Showcase
          </h1>
          <p className="text-fg-secondary text-lg max-w-2xl mx-auto">
            Experience cutting-edge visual effects including sophisticated gradients, 3D transformations, 
            particle systems, and dynamic color schemes.
          </p>
        </div>

        {/* Effect Selection */}
        <div className="flex flex-wrap gap-2 justify-center">
          {effects.map((effect) => (
            <Button
              key={effect.id}
              variant={selectedEffect === effect.id ? "default" : "outline"}
              onClick={() => setSelectedEffect(effect.id)}
              className="transition-all duration-300"
            >
              {effect.name}
            </Button>
          ))}
        </div>

        {/* Main Showcase Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Primary Effect Display */}
          <AdvancedVisualEffects
            variant={selectedEffect as any}
            intensity="high"
            interactive
            className="h-96 rounded-2xl border border-accent-primary/20 flex items-center justify-center"
          >
            <div className="text-center space-y-4 p-8">
              <h2 className="text-2xl font-bold text-fg-primary">
                {effects.find(e => e.id === selectedEffect)?.name}
              </h2>
              <p className="text-fg-secondary">
                {effects.find(e => e.id === selectedEffect)?.description}
              </p>
              <Badge variant="secondary" className="bg-accent-primary/20 text-accent-primary">
                Interactive Effect
              </Badge>
            </div>
          </AdvancedVisualEffects>

          {/* 3D Hover Effects Demo */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-fg-primary">3D Hover Effects</h3>
            <div className="grid grid-cols-2 gap-4">
              <Hover3D intensity="subtle">
                <Card className="h-32 bg-gradient-card border-accent-primary/20">
                  <CardContent className="p-4 h-full flex items-center justify-center">
                    <span className="text-sm text-fg-secondary">Subtle 3D</span>
                  </CardContent>
                </Card>
              </Hover3D>
              
              <Hover3D intensity="medium">
                <Card className="h-32 bg-gradient-card border-accent-secondary/20">
                  <CardContent className="p-4 h-full flex items-center justify-center">
                    <span className="text-sm text-fg-secondary">Medium 3D</span>
                  </CardContent>
                </Card>
              </Hover3D>
              
              <Hover3D intensity="intense">
                <Card className="h-32 bg-gradient-card border-accent-tertiary/20">
                  <CardContent className="p-4 h-full flex items-center justify-center">
                    <span className="text-sm text-fg-secondary">Intense 3D</span>
                  </CardContent>
                </Card>
              </Hover3D>
              
              <DynamicColorScheme hueShift={45} saturationBoost={0.3}>
                <Card className="h-32 bg-gradient-interactive border-accent-primary/20">
                  <CardContent className="p-4 h-full flex items-center justify-center">
                    <span className="text-sm text-fg-secondary">Color Shift</span>
                  </CardContent>
                </Card>
              </DynamicColorScheme>
            </div>
          </div>
        </div>

        {/* Gradient Border Effects */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-fg-primary">Gradient Border Effects</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GradientBorder>
              <Card className="bg-bg-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Static Border</CardTitle>
                  <CardDescription>Clean gradient border effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-fg-tertiary">
                    A sophisticated gradient border that adds visual depth without animation.
                  </p>
                </CardContent>
              </Card>
            </GradientBorder>

            <GradientBorder animated>
              <Card className="bg-bg-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Animated Border</CardTitle>
                  <CardDescription>Dynamic rotating gradient</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-fg-tertiary">
                    An animated gradient border that rotates and shifts colors continuously.
                  </p>
                </CardContent>
              </Card>
            </GradientBorder>

            <GradientBorder animated thickness={4}>
              <Card className="bg-bg-secondary/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Thick Border</CardTitle>
                  <CardDescription>Enhanced thickness animation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-fg-tertiary">
                    A thicker animated border for more prominent visual impact.
                  </p>
                </CardContent>
              </Card>
            </GradientBorder>
          </div>
        </div>

        {/* Interactive Celebration */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-fg-primary">Particle Celebration Effect</h3>
          <Button 
            onClick={triggerCelebration}
            className="bg-gradient-interactive hover:shadow-glow-hover transition-all duration-300"
            size="lg"
          >
            🎉 Trigger Celebration
          </Button>
          <p className="text-sm text-fg-tertiary">
            Click the button to trigger a particle celebration effect across the screen
          </p>
        </div>

        {/* Glass Morphism Examples */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-fg-primary">Glass Morphism Effects</h3>
          <div className="relative h-64 bg-gradient-mesh rounded-2xl overflow-hidden">
            <div className="absolute inset-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-effect rounded-xl p-6 flex items-center justify-center">
                <div className="text-center">
                  <h4 className="font-semibold text-fg-primary mb-2">Standard Glass</h4>
                  <p className="text-sm text-fg-secondary">Subtle backdrop blur with transparency</p>
                </div>
              </div>
              
              <div className="glass-effect-intense rounded-xl p-6 flex items-center justify-center">
                <div className="text-center">
                  <h4 className="font-semibold text-fg-primary mb-2">Intense Glass</h4>
                  <p className="text-sm text-fg-secondary">Enhanced blur with stronger effects</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Note */}
        <div className="bg-bg-secondary/50 rounded-xl p-6 border border-accent-primary/10">
          <h4 className="font-semibold text-fg-primary mb-2">Performance Optimized</h4>
          <p className="text-sm text-fg-secondary">
            All effects are GPU-accelerated and optimized for 60fps performance. 
            Animations respect user motion preferences and include fallbacks for older browsers.
          </p>
        </div>
      </div>

      {/* Particle Effect Component */}
      <ParticleEffect 
        trigger={celebrationTrigger} 
        type="celebration" 
        count={30}
        duration={3000}
      />
    </ThemeTransition>
  );
};