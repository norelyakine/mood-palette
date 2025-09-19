/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],  
    theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
  },
},
    plugins: [],
    // tailwind.config.js
    safelist: [
      {
        pattern: /(col|row)-(start|span)-[1-4]/,
      },
    ],

  };
  