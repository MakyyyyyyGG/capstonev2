/** @type {import('tailwindcss').Config} */
const { nextui } = require("@nextui-org/react");

module.exports = {
  content: [
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: ["class", "class"],
  plugins: [
    nextui({
      themes: {
        light: {
          layout: {
            borderWeight: "light",
            radius: {
              medium: "0.5rem", // rounded-lg equivalent
            },
          },
        },
      },
    }),
    require("tailwindcss-animate"),
  ],
};
