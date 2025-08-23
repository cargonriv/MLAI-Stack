import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem',
				xl: '2.5rem',
				'2xl': '3rem'
			},
			screens: {
				'xs': '475px',
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1536px'
			}
		},
		screens: {
			'xs': '475px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
			// Mobile-first breakpoints
			'mobile': {'max': '639px'},
			'tablet': {'min': '640px', 'max': '1023px'},
			'desktop': {'min': '1024px'},
			// Touch-specific breakpoints
			'touch': {'raw': '(hover: none) and (pointer: coarse)'},
			'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
			// Reduced motion
			'motion-reduce': {'raw': '(prefers-reduced-motion: reduce)'},
			'motion-safe': {'raw': '(prefers-reduced-motion: no-preference)'},
			// High contrast
			'high-contrast': {'raw': '(prefers-contrast: high)'},
			'low-contrast': {'raw': '(prefers-contrast: low)'},
			// Color scheme preferences
			'dark-scheme': {'raw': '(prefers-color-scheme: dark)'},
			'light-scheme': {'raw': '(prefers-color-scheme: light)'}
		},
		extend: {
			colors: {
				// Legacy shadcn colors for compatibility
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Enhanced modern color system
				'bg-primary': 'hsl(var(--background-primary))',
				'bg-secondary': 'hsl(var(--background-secondary))',
				'bg-tertiary': 'hsl(var(--background-tertiary))',
				'fg-primary': 'hsl(var(--foreground-primary))',
				'fg-secondary': 'hsl(var(--foreground-secondary))',
				'fg-tertiary': 'hsl(var(--foreground-tertiary))',
				'accent-primary': 'hsl(var(--accent-primary))',
				'accent-secondary': 'hsl(var(--accent-secondary))',
				'accent-tertiary': 'hsl(var(--accent-tertiary))',
				// Accessibility colors
				'focus-ring': 'hsl(var(--focus-ring))',
				'focus-ring-offset': 'hsl(var(--focus-ring-offset))',
				'high-contrast-bg': 'hsl(var(--high-contrast-bg))',
				'high-contrast-fg': 'hsl(var(--high-contrast-fg))',
				'high-contrast-accent': 'hsl(var(--high-contrast-accent))',
				'high-contrast-border': 'hsl(var(--high-contrast-border))'
			},
			fontFamily: {
				'display': ['Inter', 'system-ui', 'sans-serif'],
				'body': ['Inter', 'system-ui', 'sans-serif'],
				'mono': ['JetBrains Mono', 'Fira Code', 'monospace']
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem' }],
				'sm': ['0.875rem', { lineHeight: '1.25rem' }],
				'base': ['1rem', { lineHeight: '1.5rem' }],
				'lg': ['1.125rem', { lineHeight: '1.75rem' }],
				'xl': ['1.25rem', { lineHeight: '1.75rem' }],
				'2xl': ['1.5rem', { lineHeight: '2rem' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
				'5xl': ['3rem', { lineHeight: '1' }],
				'6xl': ['3.75rem', { lineHeight: '1' }],
				'7xl': ['4.5rem', { lineHeight: '1' }]
			},
			spacing: {
				'1': '0.25rem',
				'2': '0.5rem',
				'3': '0.75rem',
				'4': '1rem',
				'6': '1.5rem',
				'8': '2rem',
				'12': '3rem',
				'16': '4rem',
				'20': '5rem',
				'24': '6rem',
				'32': '8rem',
				'40': '10rem',
				'48': '12rem',
				'56': '14rem',
				'64': '16rem'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-interactive': 'var(--gradient-interactive)',
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				// Advanced gradient overlays
				'gradient-mesh': 'var(--gradient-mesh)',
				'gradient-orb-1': 'var(--gradient-orb-1)',
				'gradient-orb-2': 'var(--gradient-orb-2)',
				'gradient-orb-3': 'var(--gradient-orb-3)',
				'gradient-dynamic': 'var(--gradient-dynamic-bg)',
				'gradient-interactive-hover': 'var(--gradient-interactive-hover)',
				'gradient-glass': 'var(--gradient-glass)',
				'gradient-border': 'var(--gradient-border)'
			},
			boxShadow: {
				'glow-primary': 'var(--glow-primary)',
				'glow-secondary': 'var(--glow-secondary)',
				'glow-accent': 'var(--glow-accent)',
				'glow-sm': '0 0 10px hsl(var(--accent-primary) / 0.2)',
				'glow-md': '0 0 20px hsl(var(--accent-primary) / 0.3)',
				'glow-lg': '0 0 40px hsl(var(--accent-primary) / 0.4)',
				'glow-xl': '0 0 60px hsl(var(--accent-primary) / 0.5)',
				'elevated': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				'elevated-lg': '0 20px 40px -4px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1)',
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
				'inner-glow': 'inset 0 0 20px hsl(var(--accent-primary) / 0.1)',
				// Advanced 3D effects
				'3d-sm': '0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
				'3d-md': '0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
				'3d-lg': '0 16px 32px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.15)',
				'3d-xl': '0 25px 50px rgba(0, 0, 0, 0.25), 0 12px 24px rgba(0, 0, 0, 0.2)',
				// Glass morphism effects
				'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
				'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
				'glass-lg': '0 16px 64px 0 rgba(31, 38, 135, 0.5), inset 0 2px 0 0 rgba(255, 255, 255, 0.15)',
				// Interactive glow effects
				'glow-interactive': '0 0 20px hsl(var(--accent-primary) / 0.3), 0 0 40px hsl(var(--accent-secondary) / 0.2)',
				'glow-hover': '0 0 30px hsl(var(--accent-primary) / 0.5), 0 0 60px hsl(var(--accent-secondary) / 0.3)',
				'glow-active': '0 0 40px hsl(var(--accent-primary) / 0.7), 0 0 80px hsl(var(--accent-secondary) / 0.4)'
			},
			backdropBlur: {
				'xs': '2px',
				'sm': '4px',
				'md': '8px',
				'lg': '12px',
				'xl': '16px',
				'2xl': '24px',
				'3xl': '40px'
			},
			keyframes: {
				// Legacy animations
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				// Advanced visual effects keyframes
				'gradient-mesh-shift': {
					'0%, 100%': { 'background-position': '0% 0%' },
					'25%': { 'background-position': '100% 0%' },
					'50%': { 'background-position': '100% 100%' },
					'75%': { 'background-position': '0% 100%' }
				},
				'orb-float': {
					'0%, 100%': { 
						transform: 'translate(0, 0) rotate(0deg) scale(1)',
						opacity: '0.8'
					},
					'25%': { 
						transform: 'translate(30px, -20px) rotate(90deg) scale(1.1)',
						opacity: '0.6'
					},
					'50%': { 
						transform: 'translate(-20px, -40px) rotate(180deg) scale(0.9)',
						opacity: '1'
					},
					'75%': { 
						transform: 'translate(-40px, 20px) rotate(270deg) scale(1.05)',
						opacity: '0.7'
					}
				},
				'dynamic-bg-shift': {
					'0%, 100%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' }
				},
				'particle-float': {
					'0%': { transform: 'translateY(0) translateX(0)' },
					'100%': { transform: 'translateY(-100vh) translateX(20px)' }
				},
				'celebration-particle': {
					'0%': {
						transform: 'translate(-50%, -50%) scale(0)',
						opacity: '1'
					},
					'50%': {
						transform: 'translate(-50%, -50%) scale(1) rotate(180deg)',
						opacity: '0.8'
					},
					'100%': {
						transform: 'translate(calc(-50% + 200px), calc(-50% - 200px)) scale(0) rotate(360deg)',
						opacity: '0'
					}
				},
				'gradient-border-rotate': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'gradient-border-shift': {
					'0%, 100%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' }
				},
				'3d-hover': {
					'0%': { transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)' },
					'100%': { transform: 'perspective(1000px) rotateX(5deg) rotateY(5deg) translateZ(20px)' }
				},
				'color-shift': {
					'0%, 100%': { filter: 'hue-rotate(0deg) saturate(1)' },
					'50%': { filter: 'hue-rotate(30deg) saturate(1.2)' }
				},
				// Enhanced gradient animations
				'gradient-shift': {
					'0%, 100%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' }
				},
				'gradient-shift-reverse': {
					'0%, 100%': { 'background-position': '100% 50%' },
					'50%': { 'background-position': '0% 50%' }
				},
				'gradient-pulse': {
					'0%, 100%': { 'background-position': '0% 0%' },
					'25%': { 'background-position': '100% 0%' },
					'50%': { 'background-position': '100% 100%' },
					'75%': { 'background-position': '0% 100%' }
				},
				'gradient-text': {
					'0%, 100%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' }
				},
				'gradient-text-reverse': {
					'0%, 100%': { 'background-position': '100% 50%' },
					'50%': { 'background-position': '0% 50%' }
				},
				'gradient-x': {
					'0%, 100%': { 'background-position': '0% 50%' },
					'50%': { 'background-position': '100% 50%' }
				},
				'gradient-y': {
					'0%, 100%': { 'background-position': '50% 0%' },
					'50%': { 'background-position': '50% 100%' }
				},
				'gradient-xy': {
					'0%, 100%': { 'background-position': '0% 0%' },
					'25%': { 'background-position': '100% 0%' },
					'50%': { 'background-position': '100% 100%' },
					'75%': { 'background-position': '0% 100%' }
				},
				// Floating and movement animations
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'float-lg': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' }
				},
				'float-slow': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-15px) rotate(1deg)' },
					'66%': { transform: 'translateY(-5px) rotate(-1deg)' }
				},
				'float-medium': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'50%': { transform: 'translateY(-12px) rotate(2deg)' }
				},
				'float-fast': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'25%': { transform: 'translateY(-8px) rotate(1deg)' },
					'75%': { transform: 'translateY(-4px) rotate(-1deg)' }
				},
				'scroll-indicator': {
					'0%': { transform: 'translateY(-100%)', opacity: '0' },
					'50%': { opacity: '1' },
					'100%': { transform: 'translateY(200%)', opacity: '0' }
				},
				'bounce-slow': {
					'0%, 100%': { transform: 'translateY(-5%)' },
					'50%': { transform: 'translateY(0)' }
				},
				'sway': {
					'0%, 100%': { transform: 'rotate(-3deg)' },
					'50%': { transform: 'rotate(3deg)' }
				},
				// Glow and pulse effects
				'glow-pulse': {
					'0%, 100%': { 'box-shadow': '0 0 20px hsl(var(--accent-primary) / 0.4)' },
					'50%': { 'box-shadow': '0 0 40px hsl(var(--accent-primary) / 0.8)' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				},
				// Scale and transform animations
				'scale-in': {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'100%': { transform: 'scale(0.9)', opacity: '0' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-down': {
					'0%': { transform: 'translateY(-20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slide-left': {
					'0%': { transform: 'translateX(20px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-right': {
					'0%': { transform: 'translateX(-20px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				// Rotation animations
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'spin-reverse': {
					'0%': { transform: 'rotate(360deg)' },
					'100%': { transform: 'rotate(0deg)' }
				},
				// Text animations
				'typewriter': {
					'0%': { width: '0' },
					'100%': { width: '100%' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				// Performance-optimized keyframes
				'skeletonPulse': {
					'0%': { 'background-position': '200% 0' },
					'100%': { 'background-position': '-200% 0' }
				},
				'progressBar': {
					'0%': { width: '0%' },
					'100%': { width: 'var(--progress-width, 100%)' }
				}
			},
			animation: {
				// Legacy animations
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				// Advanced visual effects animations
				'gradient-mesh-shift': 'gradient-mesh-shift 20s ease infinite',
				'orb-float': 'orb-float 15s ease-in-out infinite',
				'dynamic-bg-shift': 'dynamic-bg-shift 3s ease infinite',
				'particle-float': 'particle-float 20s linear infinite',
				'celebration-particle': 'celebration-particle 2s ease-out forwards',
				'gradient-border-rotate': 'gradient-border-rotate 4s linear infinite',
				'gradient-border-shift': 'gradient-border-shift 8s ease infinite',
				'3d-hover': '3d-hover 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
				'color-shift': 'color-shift 4s ease infinite',
				// Enhanced gradient animations
				'gradient-shift': 'gradient-shift 6s ease infinite',
				'gradient-shift-reverse': 'gradient-shift-reverse 8s ease infinite',
				'gradient-pulse': 'gradient-pulse 10s ease infinite',
				'gradient-text': 'gradient-text 4s ease infinite',
				'gradient-text-reverse': 'gradient-text-reverse 5s ease infinite',
				'gradient-x': 'gradient-x 8s ease infinite',
				'gradient-y': 'gradient-y 8s ease infinite',
				'gradient-xy': 'gradient-xy 12s ease infinite',
				// Floating and movement animations
				'float': 'float 6s ease-in-out infinite',
				'float-lg': 'float-lg 8s ease-in-out infinite',
				'float-slow': 'float-slow 12s ease-in-out infinite',
				'float-medium': 'float-medium 8s ease-in-out infinite',
				'float-fast': 'float-fast 5s ease-in-out infinite',
				'scroll-indicator': 'scroll-indicator 2s ease-in-out infinite',
				'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
				'sway': 'sway 4s ease-in-out infinite',
				// Glow and pulse effects
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
				// Scale and transform animations
				'scale-in': 'scale-in 0.3s ease-out',
				'scale-out': 'scale-out 0.3s ease-in',
				'slide-up': 'slide-up 0.5s ease-out',
				'slide-down': 'slide-down 0.5s ease-out',
				'slide-left': 'slide-left 0.5s ease-out',
				'slide-right': 'slide-right 0.5s ease-out',
				// Rotation animations
				'spin-slow': 'spin-slow 8s linear infinite',
				'spin-reverse': 'spin-reverse 8s linear infinite',
				// Text animations
				'typewriter': 'typewriter 3s steps(40, end)',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-out': 'fade-out 0.5s ease-in',
				// Performance-optimized animations
				'skeleton-pulse': 'skeletonPulse 2s ease-in-out infinite',
				'progress-bar': 'progressBar 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards'
			},
			transitionTimingFunction: {
				'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
				'ease-in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
				'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
				'ease-in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
				'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
				'ease-in-back': 'cubic-bezier(0.36, 0, 0.66, -0.56)'
			},
			transitionDuration: {
				'fast': '150ms',
				'normal': '300ms',
				'slow': '500ms',
				'slower': '800ms'
			}
		}
	},
	plugins: [
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require("tailwindcss-animate"),
		require("@tailwindcss/typography")
	],
} satisfies Config;
