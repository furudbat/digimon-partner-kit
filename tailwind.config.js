/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/**/*.js",
  ],
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
    require("flowbite/plugin"),
  ]
};
