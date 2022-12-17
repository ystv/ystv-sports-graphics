import { defineConfig } from "cypress";

import plugin from "./cypress/plugins";

// NB: all the paths here must be relative to the root, because that's where Cypress is run from.
export default defineConfig({
  projectId: "rxz5ib",
  downloadsFolder: "cypress/downloads",
  fixturesFolder: "cypress/fixtures",
  screenshotsFolder: "cypress/screenshots",
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return plugin(on, config);
    },
    specPattern: [
      "scores-src/cypress/integration/**/*.{js,jsx,ts,tsx}",
      "bundle-src/cypress/integration/**/*.{js,jsx,ts,tsx}",
    ],
    supportFile: "cypress/support/index.ts",
    baseUrl: "http://localhost:3000",
  },
});
