import React from 'react';
import { AnimatedSection, AnimatedContainer } from '@/components/ui/animated-section';
import { AnimatedButton } from '@/components/ui/animated-button';
import { MagneticButton, TiltCard, MorphButton, RippleEffect, FloatingLabelInput } from '@/components/ui/micro-interactions';
import { FloatingElements, AnimatedOrbs, ParticleSystem } from '@/components/ui/floating-elements';
import { ScrollProgress, CircularScrollProgress } from '@/components/ui/scroll-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Star, Zap, Rocket, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AnimationShowcase: React.FC = () => {
  const [email, setEmail] = React.useState('');

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-tertiary overflow-hidden">
      {/* Background Effects */}
      <FloatingElements count={8} size="md" opacity={0.1} speed={0.2} />
      <AnimatedOrbs count={3} />
      <ParticleSystem particleCount={15} speed="slow" />
      
      {/* Scroll Progress Indicators */}
      <ScrollProgress position="top" color="primary" />
      <CircularScrollProgress position="bottom-right" />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        {/* Hero Section with Scroll Animation */}
        <AnimatedSection animation="fadeInUp" className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary bg-clip-text text-transparent">
            Animation Showcase
          </h1>
          <p className="text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
            Experience the comprehensive animation system with scroll-triggered animations, 
            parallax effects, micro-interactions, and gesture-based animations.
          </p>
        </AnimatedSection>

        {/* Animated Container with Staggered Children */}
        <AnimatedContainer staggerDelay={150} className="mb-20">
          <Card className="bg-background-secondary/50 backdrop-blur-sm border-accent-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-primary" />
                Scroll-Triggered Animations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-secondary">
                These elements animate into view as you scroll down the page.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background-secondary/50 backdrop-blur-sm border-accent-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-secondary" />
                Parallax Effects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-secondary">
                Background elements move at different speeds creating depth.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background-secondary/50 backdrop-blur-sm border-accent-tertiary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-accent-tertiary" />
                Micro-Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-secondary">
                Subtle animations that enhance user engagement and feedback.
              </p>
            </CardContent>
          </Card>
        </AnimatedContainer>

        {/* Interactive Buttons Section */}
        <AnimatedSection animation="fadeInLeft" className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Interactive Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Animated Button */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Animated Button</h3>
              <AnimatedButton
                variant="primary"
                size="lg"
                icon={<Play className="w-4 h-4" />}
                glow
                ripple
              >
                Click Me!
              </AnimatedButton>
            </div>

            {/* Magnetic Button */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Magnetic Button</h3>
              <MagneticButton
                magneticStrength={0.4}
                className="px-6 py-3 bg-gradient-to-r from-accent-secondary to-accent-tertiary text-white rounded-lg font-semibold"
              >
                <Heart className="w-4 h-4 mr-2 inline" />
                Magnetic
              </MagneticButton>
            </div>

            {/* Morph Button */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Morph Button</h3>
              <MorphButton
                className="px-6 py-3 bg-gradient-to-r from-accent-tertiary to-accent-primary text-white rounded-lg font-semibold"
                morphTo={
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Morphed!
                  </span>
                }
              >
                <span className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Hover Me
                </span>
              </MorphButton>
            </div>
          </div>
        </AnimatedSection>

        {/* Tilt Cards Section */}
        <AnimatedSection animation="fadeInRight" className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Tilt Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <TiltCard key={i} tiltStrength={20} glareEffect>
                <Card className="h-64 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border-accent-primary/30">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🎨</div>
                      <h3 className="text-xl font-semibold mb-2">Tilt Card {i}</h3>
                      <p className="text-foreground-secondary">
                        Move your mouse over me to see the 3D tilt effect!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            ))}
          </div>
        </AnimatedSection>

        {/* Ripple Effect Section */}
        <AnimatedSection animation="scaleIn" className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Ripple Effects</h2>
          <div className="flex justify-center space-x-8">
            <RippleEffect className="cursor-pointer">
              <div className="w-32 h-32 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                Click Me!
              </div>
            </RippleEffect>
            
            <RippleEffect className="cursor-pointer" rippleColor="rgba(255, 100, 200, 0.4)">
              <div className="w-32 h-32 bg-gradient-to-br from-accent-secondary to-accent-tertiary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                Or Me!
              </div>
            </RippleEffect>
          </div>
        </AnimatedSection>

        {/* Floating Label Input Section */}
        <AnimatedSection animation="fadeInUp" className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Floating Label Input</h2>
          <div className="max-w-md mx-auto space-y-6">
            <FloatingLabelInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <FloatingLabelInput
              label="Your Message"
              error="This field is required"
            />
          </div>
        </AnimatedSection>

        {/* Performance Badges */}
        <AnimatedSection animation="fadeInDown" className="text-center">
          <h2 className="text-3xl font-bold mb-8">Performance Optimized</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              60fps Animations
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Reduced Motion Support
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Touch Optimized
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Accessibility Compliant
            </Badge>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};