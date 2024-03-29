import "cypress-file-upload";

import type { TeamInfo } from "../../scores-src/src/common/types";

// force NodeCG's types to be loaded
import type {} from "../../../../types/browser";

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
      createTeam(teamData: Record<string, string>): Chainable<TeamInfo>;
      selectBundleEvent(id: string): Chainable<unknown>;
      controlBundle(
        eventType: string,
        data: Record<string, unknown>
      ): Chainable<unknown>;
    }
  }
}

Cypress.Commands.add("login", (username, password) => {
  cy.session(
    [username, password],
    () => {
      if (Cypress.config("baseUrl").includes(":9090")) {
        cy.request("POST", "/ystv-sports-graphics/_test/reauthenticate", {
          username,
          password,
        });
      } else {
        // TODO: replace this with a cy.request()
        cy.visit("/login");
        cy.get("input[name=username").type("admin");
        cy.get("input[name=password").type("password");
        cy.get("form").contains("Sign In").click();
        cy.url().should("contain", "/events");
      }
    },
    {
      validate: () => {
        if (Cypress.config("baseUrl").includes(":9090")) {
          cy.request("/ystv-sports-graphics/_test/checkAuth").then((r) => {
            return r.body.valid;
          });
        } else {
          cy.request({
            url: "/api/auth/me",
            headers: {
              Authorization:
                "Bearer " +
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                JSON.parse(sessionStorage.getItem("SportsScoresToken")!),
            },
          });
        }
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
    return cy
      .request({
        url: "/api/teams/",
        body: form,
        method: "POST",
        auth: {
          user: "admin",
          pass: "password",
        },
      })
      .then((r) => r.body);
  });
});

Cypress.Commands.add("selectBundleEvent", (id: string) => {
  cy.log("Selecting event " + id);
  return cy.request({
    url: "/ystv-sports-graphics/_test/selectEvent",
    method: "POST",
    body: {
      eventID: id,
    },
  });
});

Cypress.Commands.add(
  "controlBundle",
  (eventType: string, data: Record<string, unknown>) => {
    return cy.request({
      url: "/ystv-sports-graphics/_test/updateControl?eventType=" + eventType,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }
);
