/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    // ─── Override base font-size scale ────────────────────────────────────
    fontSize: {
      'xs':   ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.01em'  }],
      'sm':   ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.005em' }],
      'base': ['1rem',     { lineHeight: '1.5rem',  letterSpacing: '0'       }],
      'md':   ['1.0625rem',{ lineHeight: '1.5rem',  letterSpacing: '0'       }],
      'lg':   ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em'}],
      'xl':   ['1.25rem',  { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
      '2xl':  ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.015em'}],
      '3xl':  ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
      '4xl':  ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.025em'}],
      '5xl':  ['3rem',     { lineHeight: '1.1',     letterSpacing: '-0.03em' }],
      '6xl':  ['3.75rem',  { lineHeight: '1',       letterSpacing: '-0.035em'}],
      '7xl':  ['4.5rem',   { lineHeight: '1',       letterSpacing: '-0.04em' }],
      '8xl':  ['6rem',     { lineHeight: '1',       letterSpacing: '-0.045em'}],
      '9xl':  ['8rem',     { lineHeight: '1',       letterSpacing: '-0.05em' }],
    },

    extend: {

      // ══════════════════════════════════════════════════════════════════
      // 1. COLOR PALETTE
      // ══════════════════════════════════════════════════════════════════
      colors: {

        // ── Brand Pink (Primary) ──────────────────────────────────────
        pink: {
          25:  '#fff5f8',
          50:  '#fff0f6',
          100: '#ffdde9',
          200: '#ffb8d2',
          300: '#ff89b5',
          400: '#ff6b9d',   // ← Primary pink
          500: '#ff3d7f',
          600: '#ef1a60',
          700: '#cc0a4a',
          800: '#a80d3e',
          900: '#8c1037',
          950: '#5c0020',
        },

        // ── Brand Sky Blue (Secondary) ────────────────────────────────
        sky: {
          25:  '#f5fbff',
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e8fe',
          300: '#7dd5fd',
          400: '#4FACFE',   // ← Primary blue
          500: '#2196f3',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },

        // ── Accent Purple ─────────────────────────────────────────────
        grape: {
          100: '#f3e8ff',
          200: '#e4cbff',
          300: '#ce9cff',
          400: '#c850c0',   // ← Accent grape
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },

        // ── Teal (optional accent) ────────────────────────────────────
        teal: {
          300: '#5eead4',
          400: '#00F2FE',   // ← Deep-blue glow
          500: '#14b8a6',
        },

        // ── Dark Backgrounds ──────────────────────────────────────────
        dark: {
          base:    '#0D0D1A',   // Body background
          surface: '#13131F',   // Elevated surface
          card:    '#1A1A2E',   // Card background
          muted:   '#2A2A3E',   // Muted / border tones
          overlay: '#0D0D1Acc', // 80% opacity overlay for modals
        },

        // ── Glassmorphism helpers ─────────────────────────────────────
        glass: {
          'xs':     'rgba(255,255,255,0.04)',
          'sm':     'rgba(255,255,255,0.06)',
          DEFAULT:  'rgba(255,255,255,0.08)',
          'md':     'rgba(255,255,255,0.10)',
          'lg':     'rgba(255,255,255,0.13)',
          'xl':     'rgba(255,255,255,0.18)',
          'border': 'rgba(255,255,255,0.12)',
          'border-strong': 'rgba(255,255,255,0.20)',
          'hover':  'rgba(255,255,255,0.12)',
          'pink':   'rgba(255,107,157,0.12)',
          'blue':   'rgba(79,172,254,0.12)',
        },

        // ── Semantic / Status ─────────────────────────────────────────
        success: {
          DEFAULT: '#22c55e',
          light:   'rgba(34,197,94,0.15)',
          border:  'rgba(34,197,94,0.3)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light:   'rgba(245,158,11,0.15)',
          border:  'rgba(245,158,11,0.3)',
        },
        error: {
          DEFAULT: '#ef4444',
          light:   'rgba(239,68,68,0.15)',
          border:  'rgba(239,68,68,0.3)',
        },
        info: {
          DEFAULT: '#4FACFE',
          light:   'rgba(79,172,254,0.15)',
          border:  'rgba(79,172,254,0.3)',
        },

        // ── Text hierarchy ────────────────────────────────────────────
        content: {
          primary:   'rgba(255,255,255,1)',
          secondary: 'rgba(255,255,255,0.7)',
          tertiary:  'rgba(255,255,255,0.45)',
          disabled:  'rgba(255,255,255,0.25)',
          inverse:   '#0D0D1A',
        },
      },

      // ══════════════════════════════════════════════════════════════════
      // 2. TYPOGRAPHY
      // ══════════════════════════════════════════════════════════════════
      fontFamily: {
        sans:    ['Quicksand', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'Quicksand', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        serif:   ['Georgia', 'Cambria', 'serif'],       // For love letters
      },

      fontWeight: {
        thin:       '100',
        light:      '300',
        regular:    '400',
        medium:     '500',
        semibold:   '600',
        bold:       '700',
        extrabold:  '800',
      },

      lineHeight: {
        'tighter': '1.1',
        'tight':   '1.25',
        'snug':    '1.375',
        'normal':  '1.5',
        'relaxed': '1.625',
        'loose':   '2',
      },

      letterSpacing: {
        'tightest': '-0.05em',
        'tighter':  '-0.03em',
        'tight':    '-0.01em',
        'normal':   '0',
        'wide':     '0.025em',
        'wider':    '0.05em',
        'widest':   '0.1em',
        'caps':     '0.12em',
      },

      // ══════════════════════════════════════════════════════════════════
      // 3. BORDER RADIUS
      // ══════════════════════════════════════════════════════════════════
      borderRadius: {
        'none':  '0',
        'sm':    '0.375rem',    // 6px  — tags, chips
        DEFAULT: '0.5rem',      // 8px  — inputs, small cards
        'md':    '0.75rem',     // 12px — standard card
        'lg':    '1rem',        // 16px — large card
        'xl':    '1.25rem',     // 20px — glass cards
        '2xl':   '1.5rem',      // 24px — buttons, panels
        '3xl':   '2rem',        // 32px — large panels
        '4xl':   '2.5rem',      // 40px — pill-like
        '5xl':   '3rem',        // 48px — very rounded
        'full':  '9999px',      // pill / avatar circles
      },

      // ══════════════════════════════════════════════════════════════════
      // 4. SHADOWS
      // ══════════════════════════════════════════════════════════════════
      boxShadow: {
        // ── Elevation (neutral depth) ─────────────────────────────────
        'xs':   '0 1px 2px rgba(0,0,0,0.2)',
        'sm':   '0 2px 8px rgba(0,0,0,0.25)',
        'md':   '0 4px 16px rgba(0,0,0,0.3)',
        'lg':   '0 8px 32px rgba(0,0,0,0.35)',
        'xl':   '0 16px 48px rgba(0,0,0,0.4)',
        '2xl':  '0 24px 64px rgba(0,0,0,0.5)',
        'none': 'none',

        // ── Glassmorphism ─────────────────────────────────────────────
        'glass':       '0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.14)',
        'glass-strong':'0 12px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
        'glass-inset': 'inset 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',

        // ── Glow — Pink ───────────────────────────────────────────────
        'glow-pink-sm':  '0 0 12px rgba(255,107,157,0.30)',
        'glow-pink':     '0 0 28px rgba(255,107,157,0.40)',
        'glow-pink-lg':  '0 0 48px rgba(255,107,157,0.50)',
        'glow-pink-xl':  '0 0 72px rgba(255,107,157,0.45)',

        // ── Glow — Blue ───────────────────────────────────────────────
        'glow-blue-sm':  '0 0 12px rgba(79,172,254,0.30)',
        'glow-blue':     '0 0 28px rgba(79,172,254,0.40)',
        'glow-blue-lg':  '0 0 48px rgba(79,172,254,0.50)',
        'glow-blue-xl':  '0 0 72px rgba(79,172,254,0.45)',

        // ── Glow — Purple ─────────────────────────────────────────────
        'glow-grape':    '0 0 28px rgba(200,80,192,0.40)',
        'glow-grape-lg': '0 0 48px rgba(200,80,192,0.50)',

        // ── Glow — Combined gradient ──────────────────────────────────
        'glow-duo':      '0 0 40px rgba(255,107,157,0.25), 0 0 80px rgba(79,172,254,0.20)',

        // ── Inner glow ────────────────────────────────────────────────
        'inner-pink':    'inset 0 0 20px rgba(255,107,157,0.10)',
        'inner-blue':    'inset 0 0 20px rgba(79,172,254,0.10)',

        // ── Card styles ───────────────────────────────────────────────
        'card':          '0 4px 24px rgba(0,0,0,0.22)',
        'card-hover':    '0 8px 40px rgba(0,0,0,0.38)',
        'card-pink':     '0 8px 32px rgba(255,107,157,0.15)',
        'card-blue':     '0 8px 32px rgba(79,172,254,0.15)',

        // ── Button shadows ────────────────────────────────────────────
        'btn-pink':      '0 4px 20px rgba(255,107,157,0.40)',
        'btn-pink-hover':'0 8px 30px rgba(255,107,157,0.55)',
        'btn-blue':      '0 4px 20px rgba(79,172,254,0.40)',
        'btn-blue-hover':'0 8px 30px rgba(79,172,254,0.55)',

        // ── Input ─────────────────────────────────────────────────────
        'input-focus':   '0 0 0 3px rgba(255,107,157,0.18)',
        'input-error':   '0 0 0 3px rgba(239,68,68,0.20)',
        'input-success': '0 0 0 3px rgba(34,197,94,0.20)',

        // ── Modal ─────────────────────────────────────────────────────
        'modal':         '0 32px 80px rgba(0,0,0,0.60)',
      },

      // ══════════════════════════════════════════════════════════════════
      // 5. GRADIENTS
      // ══════════════════════════════════════════════════════════════════
      backgroundImage: {
        // ── Brand gradients ───────────────────────────────────────────
        'gradient-pink-blue':    'linear-gradient(135deg, #FF6B9D 0%, #4FACFE 100%)',
        'gradient-pink-grape':   'linear-gradient(135deg, #FF6B9D 0%, #C850C0 100%)',
        'gradient-blue-grape':   'linear-gradient(135deg, #4FACFE 0%, #C850C0 100%)',
        'gradient-tri':          'linear-gradient(135deg, #FF6B9D 0%, #C850C0 50%, #4FACFE 100%)',

        // ── Directional variants ──────────────────────────────────────
        'gradient-pink-blue-t':  'linear-gradient(to top, #FF6B9D, #4FACFE)',
        'gradient-pink-blue-r':  'linear-gradient(to right, #FF6B9D, #4FACFE)',

        // ── Subtle card gradients ─────────────────────────────────────
        'gradient-card-pink':    'linear-gradient(135deg, rgba(255,107,157,0.12) 0%, rgba(255,107,157,0.04) 100%)',
        'gradient-card-blue':    'linear-gradient(135deg, rgba(79,172,254,0.12) 0%, rgba(79,172,254,0.04) 100%)',
        'gradient-card-mix':     'linear-gradient(135deg, rgba(255,107,157,0.08) 0%, rgba(79,172,254,0.08) 100%)',

        // ── Background pages ──────────────────────────────────────────
        'gradient-cosmic':       'radial-gradient(ellipse at top, #1a0a2e 0%, #0D0D1A 50%)',
        'gradient-page':         `
          radial-gradient(ellipse at top left, rgba(255,107,157,0.07) 0%, transparent 55%),
          radial-gradient(ellipse at bottom right, rgba(79,172,254,0.07) 0%, transparent 55%)
        `,

        // ── Utility gradients ─────────────────────────────────────────
        'gradient-fade-b':       'linear-gradient(to bottom, transparent, rgba(13,13,26,0.95))',
        'gradient-fade-t':       'linear-gradient(to top, transparent, rgba(13,13,26,0.95))',
        'gradient-divider':      'linear-gradient(to right, transparent, rgba(255,107,157,0.4), rgba(79,172,254,0.4), transparent)',

        // ── Shimmer (skeleton loading) ────────────────────────────────
        'shimmer':               'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',

        // ── Radial glow spots ─────────────────────────────────────────
        'glow-spot-pink':        'radial-gradient(circle, rgba(255,107,157,0.18) 0%, transparent 70%)',
        'glow-spot-blue':        'radial-gradient(circle, rgba(79,172,254,0.15) 0%, transparent 70%)',
        'glow-spot-grape':       'radial-gradient(circle, rgba(200,80,192,0.15) 0%, transparent 70%)',
      },

      // ══════════════════════════════════════════════════════════════════
      // 6. BACKDROP BLUR
      // ══════════════════════════════════════════════════════════════════
      backdropBlur: {
        'xs':   '4px',
        'sm':   '8px',
        'md':   '16px',
        'lg':   '24px',
        'xl':   '32px',
        '2xl':  '40px',
        '3xl':  '60px',
        '4xl':  '80px',
      },

      // ══════════════════════════════════════════════════════════════════
      // 7. SPACING SCALE (extends default)
      // ══════════════════════════════════════════════════════════════════
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '68': '17rem',
        '76': '19rem',
        '84': '21rem',
        '88': '22rem',
        '92': '23rem',
        '100': '25rem',
        '108': '27rem',
        '112': '28rem',
        '116': '29rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
      },

      // ══════════════════════════════════════════════════════════════════
      // 8. ANIMATIONS
      // ══════════════════════════════════════════════════════════════════
      animation: {
        // ── Float ─────────────────────────────────────────────────────
        'float':          'float 6s ease-in-out infinite',
        'float-slow':     'float 10s ease-in-out infinite',
        'float-delayed':  'float 8s ease-in-out infinite 2s',
        'float-alt':      'floatAlt 7s ease-in-out infinite',

        // ── Pulse / Glow ──────────────────────────────────────────────
        'pulse-glow':     'pulseGlow 3s ease-in-out infinite',
        'pulse-glow-blue':'pulseGlowBlue 3s ease-in-out infinite',
        'pulse-soft':     'pulseSoft 2s ease-in-out infinite',

        // ── Shimmer ───────────────────────────────────────────────────
        'shimmer':        'shimmer 1.8s linear infinite',
        'shimmer-fast':   'shimmer 1s linear infinite',

        // ── Spin ──────────────────────────────────────────────────────
        'spin-slow':      'spin 8s linear infinite',
        'spin-medium':    'spin 4s linear infinite',

        // ── Bounce ────────────────────────────────────────────────────
        'bounce-soft':    'bounceSoft 2s ease-in-out infinite',
        'bounce-xs':      'bounceXS 1.5s ease-in-out infinite',

        // ── Fade ──────────────────────────────────────────────────────
        'fade-in':        'fadeIn 0.4s ease-out forwards',
        'fade-up':        'fadeUp 0.5s ease-out forwards',
        'fade-down':      'fadeDown 0.5s ease-out forwards',
        'fade-left':      'fadeLeft 0.5s ease-out forwards',
        'fade-right':     'fadeRight 0.5s ease-out forwards',

        // ── Scale ─────────────────────────────────────────────────────
        'scale-in':       'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'scale-out':      'scaleOut 0.2s ease-in forwards',

        // ── Slide ─────────────────────────────────────────────────────
        'slide-up':       'slideUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
        'slide-down':     'slideDown 0.4s cubic-bezier(0.4,0,0.2,1) forwards',

        // ── Special ───────────────────────────────────────────────────
        'heart-beat':     'heartBeat 1.4s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
        'orb-drift':      'orbDrift 18s ease-in-out infinite',
        'orb-drift-alt':  'orbDriftAlt 22s ease-in-out infinite',
        'typing':         'typing 3.5s steps(40,end) infinite',
        'wiggle':         'wiggle 0.5s ease-in-out',
        'tada':           'tada 0.8s ease-in-out',
        'confetti-fall':  'confettiFall 1.5s ease-in forwards',

        // ── Stagger helpers (use with delay utilities) ─────────────────
        'enter':          'fadeUp 0.5s ease-out both',
      },

      // ══════════════════════════════════════════════════════════════════
      // 9. KEYFRAMES
      // ══════════════════════════════════════════════════════════════════
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-18px)' },
        },
        floatAlt: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-14px) rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(255,107,157,0.25)' },
          '50%':      { boxShadow: '0 0 48px rgba(255,107,157,0.65)' },
        },
        pulseGlowBlue: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(79,172,254,0.25)' },
          '50%':      { boxShadow: '0 0 48px rgba(79,172,254,0.65)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.6 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        bounceXS: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%':   { opacity: 0, transform: 'translateY(-16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeLeft: {
          '0%':   { opacity: 0, transform: 'translateX(16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        fadeRight: {
          '0%':   { opacity: 0, transform: 'translateX(-16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: 0, transform: 'scale(0.88)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        scaleOut: {
          '0%':   { opacity: 1, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(0.92)' },
        },
        slideUp: {
          '0%':   { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: 0, transform: 'translateY(-24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        heartBeat: {
          '0%':   { transform: 'scale(1)' },
          '14%':  { transform: 'scale(1.18)' },
          '28%':  { transform: 'scale(1)' },
          '42%':  { transform: 'scale(1.12)' },
          '70%':  { transform: 'scale(1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        orbDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%':      { transform: 'translate(28px, -24px) scale(1.06)' },
          '50%':      { transform: 'translate(12px, 20px) scale(0.96)' },
          '75%':      { transform: 'translate(-20px, -10px) scale(1.03)' },
        },
        orbDriftAlt: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(-30px, 20px) scale(1.08)' },
          '66%':      { transform: 'translate(20px, -28px) scale(0.94)' },
        },
        typing: {
          'from': { width: '0' },
          'to':   { width: '100%' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-6deg)' },
          '75%':      { transform: 'rotate(6deg)' },
        },
        tada: {
          '0%':   { transform: 'scale(1)' },
          '10%':  { transform: 'scale(0.9) rotate(-3deg)' },
          '20%':  { transform: 'scale(1.1) rotate(3deg)' },
          '40%':  { transform: 'scale(1.1) rotate(-3deg)' },
          '60%':  { transform: 'scale(1.1) rotate(3deg)' },
          '80%':  { transform: 'scale(1.1) rotate(-3deg)' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
        confettiFall: {
          '0%':   { transform: 'translateY(-20px) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: 0 },
        },
      },

      // ══════════════════════════════════════════════════════════════════
      // 10. TRANSITIONS & EASING
      // ══════════════════════════════════════════════════════════════════
      transitionTimingFunction: {
        'spring':     'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Overshoot spring
        'smooth':     'cubic-bezier(0.4, 0, 0.2, 1)',       // Standard Material
        'in-out':     'cubic-bezier(0.4, 0, 0.2, 1)',
        'out':        'cubic-bezier(0, 0, 0.2, 1)',
        'in':         'cubic-bezier(0.4, 0, 1, 1)',
        'bounce-in':  'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'expo-out':   'cubic-bezier(0.16, 1, 0.3, 1)',      // Expo ease-out
        'circ-out':   'cubic-bezier(0, 0.55, 0.45, 1)',     // Circular ease-out
      },

      transitionDuration: {
        '0':    '0ms',
        '75':   '75ms',
        '100':  '100ms',
        '150':  '150ms',
        '200':  '200ms',
        '250':  '250ms',
        '300':  '300ms',
        '400':  '400ms',
        '500':  '500ms',
        '600':  '600ms',
        '700':  '700ms',
        '1000': '1000ms',
      },

      // ══════════════════════════════════════════════════════════════════
      // 11. Z-INDEX
      // ══════════════════════════════════════════════════════════════════
      zIndex: {
        'behind': '-1',
        '0':  '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',    // Base overlay
        '60': '60',    // Navbar
        '70': '70',    // Sidebar
        '80': '80',    // Modal backdrop
        '90': '90',    // Modal content
        '100':'100',   // Toast / tooltip
        'top':'9999',
      },

      // ══════════════════════════════════════════════════════════════════
      // 12. SCREENS (breakpoints)
      // ══════════════════════════════════════════════════════════════════
      screens: {
        'xs':  '375px',
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1536px',
      },

      // ══════════════════════════════════════════════════════════════════
      // 13. SIZE / ASPECT RATIOS
      // ══════════════════════════════════════════════════════════════════
      aspectRatio: {
        'video': '16 / 9',
        'photo': '4 / 3',
        'portrait': '3 / 4',
        'square': '1 / 1',
        'wide': '21 / 9',
      },
    },
  },

  plugins: [],
}
