/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.tsx'],
  theme: {
    extend: {
      fontFamily: {
        gloria: ['Gloria Hallelujah', 'cursive'],
      },
      colors: {
        xanana: {
          70: '#de818dcc',
          100: '#de818d',
        },
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeInUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out both',
        fadeInUp: 'fadeInUp 0.6s ease-out both',
        scaleIn: 'scaleIn 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
