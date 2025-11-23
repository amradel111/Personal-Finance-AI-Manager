/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Peachy Cream theme - warm coral and peach tones
        peach: {
          50: '#fff9f5',
          100: '#fff5f0',
          200: '#ffe8db',
          300: '#ffd4bf',
          400: '#ffb899',
          500: '#ff9d73',
        },
        coral: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd1c1',
          300: '#ffb8a0',
          400: '#ff9670',
          500: '#ff7043',
          600: '#f4511e',
          700: '#d84315',
          800: '#bf360c',
          900: '#7c2d12',
        },
        warm: {
          50: '#fef8f5',
          100: '#fef0e8',
          200: '#fce4d6',
          300: '#f9d5c2',
          400: '#f5b89a',
          500: '#f09b72',
          600: '#d97845',
          700: '#b85a2e',
          800: '#8b3f1a',
          900: '#5d2a11',
        },
      },
    },
  },
  plugins: [],
}
