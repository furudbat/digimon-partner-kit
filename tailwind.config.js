const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/app/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}', flowbite.content(),],
  theme: {
    extend: {
      fontFamily: {
        primary: ['var(--font-primary)']
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: [
    require('tailwind-scrollbar'),
    flowbite.plugin(),
  ]
};
