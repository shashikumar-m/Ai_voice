/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    'bg-indigo-100', 'bg-purple-100', 'bg-emerald-100', 'bg-blue-100', 'bg-orange-100', 'bg-pink-100', 'bg-yellow-100', 'bg-red-100',
    'text-indigo-600', 'text-purple-600', 'text-emerald-600', 'text-blue-600', 'text-orange-600', 'text-pink-600', 'text-yellow-600', 'text-red-600',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
