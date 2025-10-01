/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:"#eef6ff",100:"#d9ecff",200:"#b6d9ff",300:"#8ec2ff",400:"#5aa4ff",
          500:"#2d86ff",600:"#1e66d6",700:"#184fad",800:"#143f8b",900:"#0f2f69"
        }
      },
      boxShadow:{ soft:"0 10px 30px rgba(0,0,0,.08)" }
    }
  },
  plugins: [require("@tailwindcss/forms")],
};
