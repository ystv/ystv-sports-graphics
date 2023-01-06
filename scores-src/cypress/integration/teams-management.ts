describe("Teams Management", () => {
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
    cy.reload(true); // GRAPHICS-156
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
      path: "/api/events/test-league/*",
    }).as("postEvents");
    cy.login("admin", "password");
    cy.visit("/events");
    cy.get("[data-cy=createNew]").click();
    cy.contains("Create Event").should("be.visible");

    cy.get("[data-cy=selectLeague]").click();
    cy.get(".mantine-Select-item").contains("Test League").click();

    cy.get("[data-cy=homeTeam]").click();
    cy.get(".mantine-Select-item").contains("York").click();

    cy.get("[data-cy=awayTeam]").click();
    cy.get(".mantine-Select-item").contains("York").click();

    cy.get("[name=name]").type("Test Football");
    cy.get("[name=worthPoints]").type("4");

    cy.get("[data-cy=submit]").scrollIntoView().click();
    cy.wait(["@postEvents"], { responseTimeout: 3000 });
  });

  it("Event action, edit team, undo that action", function () {
    cy.intercept({
      method: "PUT",
      path: "/api/teams/*",
    }).as("putTeams");

    // York already exists from earlier
    cy.createTeam({
      name: "Lancaster",
      abbreviation: "LANC",
      primaryColour: "#ff0000",
      secondaryColour: "#fafafa",
    });

    cy.request({
      url: "/api/events/test-league/football",
      method: "POST",
      body: {
        name: "Test Event",
        worthPoints: 4,
        notCovered: false,
        startTime: "2023-01-02T00:00:00.000Z",
        homeTeam: "lancaster",
        awayTeam: "york",
      },
      auth: {
        user: "admin",
        pass: "password",
      },
    }).then((res) => {
      const eventID = res.body.id;

      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${eventID}`);
      cy.contains("Lancaster 0 - York 0").should("be.visible");

      cy.request({
        url: `/api/events/test-league/football/${eventID}/startHalf`,
        method: "POST",
        body: {},
        auth: {
          user: "admin",
          pass: "password",
        },
      });
      cy.request({
        url: `/api/events/test-league/football/${eventID}/goal`,
        method: "POST",
        body: {
          side: "home",
          player: null,
        },
        auth: {
          user: "admin",
          pass: "password",
        },
      });

      cy.contains("Lancaster 1 - York 0").should("be.visible");

      cy.visit("/teams");
      cy.contains("Lancaster").parent().contains("Edit").click();
      cy.contains("Editing Lancaster").should("be.visible");

      cy.get("[name=name]").clear().type("Anne Lister");
      cy.get("[name=abbreviation]").clear().type("LIS");

      cy.get("[data-cy=submit]").click();

      cy.wait(["@putTeams"], { responseTimeout: 3000 });

      cy.visit(`/events/test-league/football/${eventID}`);
      cy.contains("Anne Lister 1 - York 0").should("be.visible");

      cy.get("[data-cy=timeline] > *").first().contains("Undo").click();
      cy.contains("Anne Lister 0 - York 0").should("be.visible");

      // Verify the team change is still in effect
      cy.request({
        url: `/api/events/test-league/football/${eventID}`,
        method: "GET",
        auth: {
          user: "admin",
          pass: "password",
        },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.homeTeam.name).to.eq("Anne Lister");
      });
    });
  });
});
