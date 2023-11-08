/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files:  [
      './src/**/*.{html,ts}',
      './node_modules/flowbite/**/*.js'
    ]
  },
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ]
};

