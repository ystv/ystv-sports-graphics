module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "16" } }],
    "@babel/preset-typescript",
  ],
  plugins: [
    [
      // Needed for tests
      "@babel/plugin-transform-react-jsx",
      {},
    ],
  ],
};
