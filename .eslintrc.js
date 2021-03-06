module.exports = {
  root: true,
  ignorePatterns: [
    "scores-src/dist/**",
    "scores-src/addon-build/**",
    "dashboard/**",
    "graphics/**",
    "extension.js",
    "**/*.html",
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
    "cypress/globals": true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["react", "@typescript-eslint", "cypress"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "react/prop-types": "off",
  },
};
