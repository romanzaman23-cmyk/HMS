/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          navy: '#0e2238',
          dark: '#0a192f',
          sidebar: '#0d233a',
          blue: '#1a73e8',
          blueHover: '#1557b0',
          blueLight: '#e8f0fe',
          surface: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          textDark: '#0f172a',
          textMuted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        soft: '0 4px 20px -2px rgba(14, 34, 56, 0.08)',
        hover: '0 10px 25px -3px rgba(14, 34, 56, 0.12)'
      }
    },
  },
  plugins: [],
}
