describe("Login", () => {
  before(() => {
    cy.resetAndCreateTestUser("admin", "password");
  });
  it("works", () => {
    cy.visit("/login");
    cy.get("input[name=username").type("admin");
    cy.get("input[name=password").type("password");
    cy.get("form").contains("Sign In").click();
    cy.url().should("contain", "/events");
  });
});
