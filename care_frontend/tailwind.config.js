/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        tech: ['"Space Grotesk"', 'monospace'],
      },
      animation: {
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'float-reverse': 'floatReverse 10s ease-in-out infinite',
        'shimmer-sweep': 'shimmerSweep 3s infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(20px, -25px) scale(1.08)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-25px, 20px) scale(0.95)' },
        },
        shimmerSweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'blur(40px)' },
          '50%': { opacity: '0.85', filter: 'blur(60px)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
