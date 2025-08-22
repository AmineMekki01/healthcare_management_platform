/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ["./src/**/*.{html,js}", "./node_modules/flowbite/**/*.js"],

  content: ["./src/**/*.{html,js}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      width: {
        '01vw': '10vw',
      },
    },
  },
  plugins: [
    require('flowbite/plugin'), 

  ],
}

