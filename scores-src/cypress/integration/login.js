describe("Login", () => {
  before(() => {
    cy.resetAndCreateTestUser("admin", "password");
  });
  it("works", () => {
    cy.visit("http://localhost:3000");
    cy.login("admin", "password");
  });
});
