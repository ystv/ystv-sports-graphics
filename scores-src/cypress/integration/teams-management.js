describe("Teams Management", () => {
  before(() => {
    cy.resetAndCreateTestUser("admin", "password");
  });

  it("Create Team", () => {
    cy.intercept({
      method: "POST",
      path: "/api/teams/",
    }).as("postTeams");
    cy.login("admin", "password");
    cy.visit("/teams");
    cy.get("[data-cy=createNew]").click();
    cy.contains("Create Team").should("be.visible");

    cy.get("[name=name]").type("Lancaster");
    cy.get("[name=abbreviation]").type("LAN");
    cy.get("[name=primaryColour]").type("#ff0000").blur();
    cy.get("[name=secondaryColour]").type("#000000").blur();
    cy.get("[name=crest]").attachFile("Shield_plain.svg");

    cy.get("[data-cy=submit]").click();

    cy.wait(["@postTeams"], { responseTimeout: 3000 });

    cy.visit("/teams");
    cy.reload(); // GRAPHICS-156
    cy.contains("Lancaster").should("be.visible");
  });

  it("Edit", () => {
    cy.intercept({
      method: "PUT",
      path: "/api/teams/*",
    }).as("putTeams");
    cy.login("admin", "password");
    cy.visit("/teams");

    cy.contains("Lancaster").parent().contains("Edit").click();
    cy.contains("Editing Lancaster").should("be.visible");

    cy.get("[name=name]").clear().type("York");
    cy.get("[name=abbreviation]").clear().type("YRK");

    cy.get("[data-cy=submit]").click();

    cy.wait(["@putTeams"], { responseTimeout: 3000 });

    cy.visit("/teams");
    cy.reload(); // GRAPHICS-156
    cy.contains("York").should("be.visible");
  });

  it("New team can be used in events", function () {
    cy.intercept({
      method: "POST",
      path: "/api/events/*",
    }).as("postEvents");
    cy.login("admin", "password");
    cy.visit("/events");
    cy.get("[data-cy=createNew]").click();
    cy.contains("Create Event").should("be.visible");

    cy.get("[data-cy=homeTeam]").click();
    cy.get(".mantine-Select-item").contains("York").click();

    cy.get("[data-cy=awayTeam]").click();
    cy.get(".mantine-Select-item").contains("York").click();

    cy.get("[name=name]").type("Test Football");
    cy.get("[name=worthPoints]").type("4");

    cy.get("[data-cy=submit]").scrollIntoView().click();
    cy.wait(["@postEvents"], { responseTimeout: 3000 });
  });
});
