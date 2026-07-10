/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': 'var(--bg-deep)',
        'bg-navy': 'var(--bg-navy)',
        panel: 'var(--panel)',
        gold: 'var(--gold)',
        'gold-deep': 'var(--gold-deep)',
        'gold-soft': 'var(--gold-soft)',
        text: 'var(--text)',
        'text-mut': 'var(--text-mut)',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        oswald: ['Oswald', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
