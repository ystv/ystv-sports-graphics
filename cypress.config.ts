import { defineConfig } from "cypress";

import plugin from "./scores-src/cypress/plugins";

export default defineConfig({
  projectId: "rxz5ib",
  downloadsFolder: "scores-src/cypress/downloads",
  fixturesFolder: "scores-src/cypress/fixtures",
  screenshotsFolder: "scores-src/cypress/screenshots",
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
    specPattern: "scores-src/cypress/integration/**/*.{js,jsx,ts,tsx}",
    supportFile: "scores-src/cypress/support/index.js",
    baseUrl: "http://localhost:3000",
  },
});
