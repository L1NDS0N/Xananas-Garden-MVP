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
    },
    plugins: [],
  },
};
