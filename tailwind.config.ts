/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #9FBAD0)',
        secondary: 'var(--color-secondary, #C6A75E)',
        'bg-main': 'var(--color-bg, #121212)',
        'bg-card': 'var(--color-card, #1A1A1A)',
        'text-main': 'var(--color-text-primary, #F5F5F5)',
        'text-muted': 'var(--color-text-secondary, #B3B3B3)',
        // Novas cores adicionadas para atender às classes usadas no CSS
        background: 'var(--color-bg, #121212)',   // corresponde a `bg-background`
        foreground: 'var(--color-text-primary, #F5F5F5)', // corresponde a `text-foreground`
      },
    },
  },
  plugins: [],
}