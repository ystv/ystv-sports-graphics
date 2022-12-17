/* eslint-disable @typescript-eslint/no-var-requires */
/// <reference types="cypress" />

const del = require("del");

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
export default (on, config) => {
  // Delete videos for successful tests after the run
  on("after:spec", (spec, results) => {
    if (results && results.video) {
      // Do we have failures for any retry attempts?
      const failures = results.tests.some((x) =>
        x.attempts.some((attempt) => attempt.state === "failed")
      );
      if (!failures) {
        // delete the video if the spec passed and no tests retried
        return del(results.video);
      }
    }
  });
};
