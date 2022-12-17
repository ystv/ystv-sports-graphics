describe("Event Management", () => {
  before(() => {
    cy.resetAndCreateTestUser("admin", "password");
    cy.request({
      url: "/api/leagues",
      method: "POST",
      body: {
        name: "Test League",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
      auth: {
        user: "admin",
        pass: "password",
      },
    });
  });

  it("Create Event", () => {
    cy.intercept({
      method: "POST",
      path: "/api/events/test-league/*",
    }).as("postEvents");
    cy.intercept({
      method: "POST",
      path: "/api/teams/",
    }).as("postTeams");
    cy.login("admin", "password");
    cy.visit("/events");
    cy.get("[data-cy=createNew]").click();
    cy.contains("Create Event").should("be.visible");

    cy.get("[data-cy=selectType]").click();
    cy.get(".mantine-Select-item")
      .contains(/^Football$/)
      .click();

    cy.get("[data-cy=selectLeague]").click();
    cy.get(".mantine-Select-item").contains("Test League").click();

    cy.get("[name=name]").type("Test Football");
    cy.get("[name=worthPoints]").type("4");

    cy.get("[data-cy=homeTeam]").type("Lancaster");
    cy.get(".mantine-Select-item").contains("Create Lancaster").click();

    cy.get("[data-cy=createTeam").within(function () {
      cy.get("[name=name]").type("Lancaster");
      cy.get("[name=abbreviation]").type("LAN");
      cy.get("[name=primaryColour]").type("#ff0000").blur();
      cy.get("[name=secondaryColour]").type("#000000").blur();
      cy.get("[name=crest]").attachFile("Shield_plain.svg");
      cy.get("[data-cy=submit]").click();
    });
    cy.wait(["@postTeams"], { responseTimeout: 3000 });

    cy.get("[data-cy=awayTeam]").should("be.visible").type("York");
    cy.get(".mantine-Select-item").contains("Create York").click();

    cy.get("[data-cy=createTeam").within(function () {
      cy.get("[name=name]").type("York");
      cy.get("[name=abbreviation]").type("YRK");
      cy.get("[name=primaryColour]").type("#c7c7c7").blur();
      cy.get("[name=secondaryColour]").type("#3a3a3a").blur();
      cy.get("[name=crest]").attachFile("Shield_plain.svg");
      cy.get("[data-cy=submit]").click();
    });
    cy.wait(["@postTeams"], { responseTimeout: 3000 });

    cy.get("[data-cy=submit]")
      .should("have.length", 1)
      .scrollIntoView()
      .click();
    cy.wait(["@postEvents"]);

    cy.visit("/events");
    cy.reload(); // GRAPHICS-156
    cy.contains("Test Football").should("be.visible");
  });

  it("Edit", () => {
    cy.intercept({
      method: "PUT",
      path: "/api/events/test-league/football/*",
    }).as("putEvents");

    cy.login("admin", "password");
    cy.visit("/events");
    cy.contains("Test Football")
      .parent("[data-cy=eventRoot]")
      .get("[data-cy=editEvent]")
      .click();
    cy.contains("Editing Test Football").should("be.visible");
    cy.get("[name=worthPoints]").clear().type("2");

    cy.get("[data-cy=submit]").click();
    cy.wait(["@putEvents"]);

    cy.visit("/events");
    cy.contains("Test Football")
      .parent("[data-cy=eventRoot]")
      .get("[data-cy=editEvent]")
      .click();
    cy.get("[name=worthPoints]").should("be.visible");
    cy.get("[name=worthPoints]").should("have.value", "2");
  });
});
