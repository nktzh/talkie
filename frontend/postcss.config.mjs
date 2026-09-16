/** @type {import("postcss-load-config").Config} */
const config = {
  plugins: {
    // Делает общие @custom-media видимыми в каждом CSS-модуле, не добавляя их в итоговый CSS
    "@csstools/postcss-global-data": { files: ["src/shared/styles/media.css"] },
    "postcss-custom-media": {},
  },
};

export default config;
