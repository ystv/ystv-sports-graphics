describe("Event Management", () => {
  before(() => {
    cy.resetAndCreateTestUser("admin", "password");
  });

  it("Create Event", () => {
    cy.login("admin", "password");
    cy.visit("/events");
    cy.get("[data-cy=createNew]").click();
    cy.get("[data-cy=selectType]").click();
    cy.get(".mantine-Select-item").contains("Football").click();
    cy.get("[name=name]").type("Test Football");
    cy.get("[name=worthPoints]").type("4");
    cy.get("[data-cy=submit]").click();
    cy.visit("/events");
    cy.contains("Test Football").should("be.visible");
  });

  it("Edit", () => {
    cy.login("admin", "password");
    cy.visit("/events");
    cy.contains("Test Football")
      .parent("[data-cy=eventRoot]")
      .get("[data-cy=editEvent]")
      .click();
    cy.contains("Editing Test Football").should("be.visible");
    cy.get("[name=worthPoints]").clear().type("2");
    cy.get("[data-cy=submit]").click();
    cy.visit("/events");
    cy.contains("Test Football")
      .parent("[data-cy=eventRoot]")
      .get("[data-cy=editEvent]")
      .click();
    cy.get("[name=worthPoints]").should("be.visible");
    cy.get("[name=worthPoints]").should("have.value", "2");
  });
});
