/** @type {import('tailwindcss').Config} */
module.exports = {
  // 'class' en vez del default 'media': nativewind-web (react-native-css-interop) tira un throw
  // en tiempo de ejecución si algo intenta fijar el color scheme a mano (ej. expo-status-bar
  // reaccionando a userInterfaceStyle: "automatic" de app.json) mientras el modo es 'media' — no
  // es una implementación de modo oscuro (`extensiones/02-modo-oscuro.md`, aparte y sin arrancar),
  // solo evita el crash en dev/web con la configuración que ya existía.
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
