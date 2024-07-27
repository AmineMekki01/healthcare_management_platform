/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ["./src/**/*.{html,js}", "./node_modules/flowbite/**/*.js"],

  content: ["./src/**/*.{html,js}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      width: {
        '01vw': '10vw',
        // You can add more here
      },
    },
  },
  plugins: [
    require('flowbite/plugin'), 
    // function ({ addUtilities }) {
    //   const newUtilities = {
    //     'ul::after': {
    //       content: "''",
    //       flexGrow: '1000000000',
    //     },
    //   }
    //   addUtilities(newUtilities, ['responsive', 'hover'])
    // },
],
}

