import "cypress-file-upload";

import type { TeamInfo } from "../../scores-src/src/common/types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<null>;
      resetAndCreateTestUser(
        username: string,
        password: string
      ): Chainable<void>;
      fetch(url: string, init: RequestInit): Promise<unknown>;
      createTeam(teamData: Record<string, string>): Promise<TeamInfo>;
    }
  }
}

Cypress.Commands.add("login", (username, password) => {
  cy.session(
    [username, password],
    () => {
      // TODO: replace this with a cy.request()
      cy.visit("/login");
      cy.get("input[name=username").type("admin");
      cy.get("input[name=password").type("password");
      cy.get("form").contains("Sign In").click();
      cy.url().should("contain", "/events");
    },
    {
      validate: () => {
        cy.request({
          url: "/api/auth/me",
          headers: {
            Authorization:
              "Bearer " +
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              JSON.parse(sessionStorage.getItem("SportsScoresToken")!),
          },
        });
      },
    }
  );
});

Cypress.Commands.add("resetAndCreateTestUser", (username, password) => {
  cy.request("POST", "/api/_test/resetDB");
  Cypress.session.clearAllSavedSessions();
  cy.request("POST", "/api/_test/createTestUser", {
    username,
    password: password,
  });
});

Cypress.Commands.add("fetch", (url: string, init: RequestInit) => {
  return fetch(url, init).then((res) => res.json());
});

Cypress.Commands.add("createTeam", (data: Record<string, string>) => {
  cy.fixture("Shield_plain.svg").then((crest) => {
    const form = new FormData();
    for (const key of Object.keys(data)) {
      form.append(key, data[key]);
    }
    form.append("crest", Cypress.Blob.binaryStringToBlob(crest));
    return cy.fetch("/api/teams/", {
      headers: {
        Authorization: "Basic " + btoa("admin:password"),
      },
      body: form,
      method: "POST",
    });
  });
});
