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
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {
    		fontFamily: {
    			inter: [
    				'Inter',
    				'sans-serif'
    			],
    			space: [
    				'Space Grotesk',
    				'sans-serif'
    			],
    			sans: [
    				'Inter',
    				'ui-sans-serif',
    				'system-ui',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'Segoe UI',
    				'Roboto',
    				'Helvetica Neue',
    				'Arial',
    				'Noto Sans',
    				'sans-serif'
    			],
    			serif: [
    				'Lora',
    				'ui-serif',
    				'Georgia',
    				'Cambria',
    				'Times New Roman',
    				'Times',
    				'serif'
    			],
    			mono: [
    				'Space Mono',
    				'ui-monospace',
    				'SFMono-Regular',
    				'Menlo',
    				'Monaco',
    				'Consolas',
    				'Liberation Mono',
    				'Courier New',
    				'monospace'
    			]
    		},
    		fontSize: {
    			xs: [
    				'0.75rem',
    				{
    					lineHeight: '1rem'
    				}
    			],
    			sm: [
    				'0.875rem',
    				{
    					lineHeight: '1.25rem'
    				}
    			],
    			base: [
    				'1rem',
    				{
    					lineHeight: '1.5rem'
    				}
    			],
    			lg: [
    				'1.125rem',
    				{
    					lineHeight: '1.75rem'
    				}
    			],
    			xl: [
    				'1.25rem',
    				{
    					lineHeight: '1.75rem'
    				}
    			],
    			'2xl': [
    				'1.5rem',
    				{
    					lineHeight: '2rem'
    				}
    			],
    			'3xl': [
    				'1.875rem',
    				{
    					lineHeight: '2.25rem'
    				}
    			]
    		},
    		colors: {
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))',
    				light: 'hsl(var(--primary-light))',
    				dark: 'hsl(var(--primary-dark))'
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
    				foreground: 'hsl(var(--accent-foreground))',
    				light: 'hsl(var(--accent-light))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			success: 'hsl(var(--success))',
    			warning: 'hsl(var(--warning))',
    			info: 'hsl(var(--info))',
     			chart: {
     				'1': 'hsl(var(--chart-1))',
     				'2': 'hsl(var(--chart-2))',
     				'3': 'hsl(var(--chart-3))',
     				'4': 'hsl(var(--chart-4))',
     				'5': 'hsl(var(--chart-5))'
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
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: { height: '0' },
    				to: { height: 'var(--radix-accordion-content-height)' }
    			},
    			'accordion-up': {
    				from: { height: 'var(--radix-accordion-content-height)' },
    				to: { height: '0' }
    			},
    			'fade-in': {
    				'0%': { opacity: '0', transform: 'translateY(10px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'fade-in-up': {
    				'0%': { opacity: '0', transform: 'translateY(20px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'slide-up': {
    				'0%': { transform: 'translateY(100%)', opacity: '0' },
    				'100%': { transform: 'translateY(0)', opacity: '1' }
    			},
    			'slide-in-right': {
    				'0%': { transform: 'translateX(100%)' },
    				'100%': { transform: 'translateX(0)' }
    			},
    			'slide-in-left': {
    				'0%': { transform: 'translateX(-100%)' },
    				'100%': { transform: 'translateX(0)' }
    			},
    			'scale-in': {
    				'0%': { transform: 'scale(0.9)', opacity: '0' },
    				'100%': { transform: 'scale(1)', opacity: '1' }
    			},
    			'scale-bounce': {
    				'0%': { transform: 'scale(0)' },
    				'50%': { transform: 'scale(1.2)' },
    				'100%': { transform: 'scale(1)' }
    			},
    			'bounce-subtle': {
    				'0%, 100%': { transform: 'scale(1)' },
    				'50%': { transform: 'scale(1.05)' }
    			},
    			'bounce-in': {
    				'0%': { transform: 'scale(0)', opacity: '0' },
    				'50%': { transform: 'scale(1.1)' },
    				'100%': { transform: 'scale(1)', opacity: '1' }
    			},
    			'pulse-soft': {
    				'0%, 100%': { opacity: '1' },
    				'50%': { opacity: '0.7' }
    			},
    			'pulse-glow': {
    				'0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.4)' },
    				'50%': { boxShadow: '0 0 0 10px hsl(var(--primary) / 0)' }
    			},
    			'wiggle': {
    				'0%, 100%': { transform: 'rotate(-3deg)' },
    				'50%': { transform: 'rotate(3deg)' }
    			},
    			'shimmer': {
    				'0%': { backgroundPosition: '-200% 0' },
    				'100%': { backgroundPosition: '200% 0' }
    			},
    			'float': {
    				'0%, 100%': { transform: 'translateY(0)' },
    				'50%': { transform: 'translateY(-10px)' }
    			},
    			'heart-beat': {
    				'0%': { transform: 'scale(1)' },
    				'14%': { transform: 'scale(1.3)' },
    				'28%': { transform: 'scale(1)' },
    				'42%': { transform: 'scale(1.3)' },
    				'70%': { transform: 'scale(1)' }
    			},
    			'pop': {
    				'0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
    				'50%': { transform: 'scale(1.2) rotate(5deg)' },
    				'100%': { transform: 'scale(1) rotate(0)', opacity: '1' }
    			},
    			'slide-up-bounce': {
    				'0%': { transform: 'translateY(100%)', opacity: '0' },
    				'60%': { transform: 'translateY(-10%)', opacity: '1' },
    				'100%': { transform: 'translateY(0)', opacity: '1' }
    			},
    			'ping-slow': {
    				'75%, 100%': { transform: 'scale(2)', opacity: '0' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'fade-in': 'fade-in 0.3s ease-out forwards',
    			'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
    			'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    			'slide-in-right': 'slide-in-right 0.3s ease-out',
    			'slide-in-left': 'slide-in-left 0.3s ease-out',
    			'scale-in': 'scale-in 0.2s ease-out forwards',
    			'scale-bounce': 'scale-bounce 0.5s ease-out forwards',
    			'bounce-subtle': 'bounce-subtle 0.6s ease-in-out',
    			'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
    			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
    			'wiggle': 'wiggle 0.5s ease-in-out',
    			'shimmer': 'shimmer 2s linear infinite',
    			'float': 'float 3s ease-in-out infinite',
    			'heart-beat': 'heart-beat 1.3s ease-in-out infinite',
    			'pop': 'pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    			'slide-up-bounce': 'slide-up-bounce 0.5s ease-out',
    			'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite'
    		},
    		spacing: {
    			'18': '4.5rem',
    			'88': '22rem',
    			'112': '28rem',
    			safe: 'env(safe-area-inset-top)'
    		},
    		backdropBlur: {
    			xs: '2px'
    		},
    		boxShadow: {
    			'2xs': 'var(--shadow-2xs)',
    			xs: 'var(--shadow-xs)',
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
