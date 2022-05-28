Cypress.Commands.add("login", (username, password) => {
  cy.session([username, password], () => {
    cy.visit("/login");
    cy.get("input[name=username").type(username);
    cy.get("input[name=password").type(password);
    cy.get("form").contains("Sign In").click();
    cy.url().should("contain", "/events");
  });
});

Cypress.Commands.add("resetAndCreateTestUser", (username, password) => {
  cy.request("POST", "/api/_test/resetDB");
  cy.request("POST", "/api/_test/createTestUser", {
    username,
    password: password,
  });
});
