describe("Football Graphics", () => {
  before(() => {
    Cypress.config("baseUrl", "http://localhost:3000");
    cy.resetAndCreateTestUser("admin", "password")
      .createTeam({
        name: "Lancaster",
        abbreviation: "LANC",
        primaryColour: "#ff0000",
        secondaryColour: "#fafafa",
      })
      .createTeam({
        name: "York",
        abbreviation: "YORK",
        primaryColour: "#fafafa",
        secondaryColour: "#000000",
      })
      .request({
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
      })
      .request({
        url: "/api/events/test-league/football",
        method: "POST",
        body: {
          name: "Test Event",
          league: "test-league",
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
      })
      .then((result) => {
        cy.wrap(result.body).its("id").as("eventID");
        Cypress.config("baseUrl", "http://localhost:9090");
      });
  });

  it("Renders nothing on first load", function () {
    cy.selectBundleEvent(`Event/test-league/football/${this.eventID}`);
    cy.visit("/bundles/ystv-sports-graphics/graphics/graphics.html");
    cy.get("[data-cy=football-scoreboard]").should("not.exist");
  });

  it("Shows scoreboard", function () {
    cy.visit("/bundles/ystv-sports-graphics/graphics/graphics.html");
    cy.awaitReplicants("control-football")
      .controlBundle("football", {
        scoreboard: { visible: true, showTime: false },
      })
      .then(() => {
        cy.get("[data-cy=football-scoreboard]").should("exist");
        cy.get("[data-cy=football-scoreboard] [data-cy=home-team-name]").should(
          "contain",
          "LANC"
        );
        cy.get("[data-cy=football-scoreboard] [data-cy=away-team-name]").should(
          "contain",
          "YORK"
        );
        cy.get(
          "[data-cy=football-scoreboard] [data-cy=home-team-score]"
        ).should("contain", "0");
        cy.get(
          "[data-cy=football-scoreboard] [data-cy=away-team-score]"
        ).should("contain", "0");
      });
  });
});
