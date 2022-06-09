import "cypress-file-upload";

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
              JSON.parse(sessionStorage.getItem("SportsScoresToken")),
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

Cypress.Commands.add("fetch", (url, init) => {
  return fetch(url, init).then((res) => res.json());
});

Cypress.Commands.add("createTeam", (data) => {
  const form = new FormData();
  for (const key of Object.keys(data)) {
    form.append(key, data[key]);
  }
  form.append(
    "crest",
    Cypress.Blob.binaryStringToBlob(cy.fixture("Shield_plain.svg"))
  );
  cy.fetch("/api/teams/", {
    headers: {
      Authorization: "Basic " + btoa("admin:password"),
    },
    body: form,
    method: "POST",
  });
});
