describe("Event Management", () => {
  describe("Football", () => {
    before(() => {
      cy.resetAndCreateTestUser("admin", "password");
      cy.request({
        url: "/api/events/football",
        method: "POST",
        body: {
          name: "Test Event",
          worthPoints: 4,
          notCovered: false,
          startTime: "2023-01-02T00:00:00.000Z",
        },
        auth: {
          user: "admin",
          pass: "password",
        },
      }).then((result) => {
        cy.wrap(result.body).its("id").as("eventID");
      });
    });

    it("Start a half", function () {
      cy.login("admin", "password");
      cy.visit(`/events/football/${this.eventID}`);
      cy.contains("Home 0 - Away 0").should("be.visible");

      cy.contains("Start Half").click();
      cy.get("[data-cy=performAction]").click();
      cy.get("[data-cy=timeline] > *").should("have.length", 1);
    });

    it("Goal", function () {
      cy.login("admin", "password");
      cy.visit(`/events/football/${this.eventID}`);
      cy.contains("Home 0 - Away 0").should("be.visible");

      cy.contains("Goal").click();
      cy.get("[data-test-form-field=side]").contains("Away").click();
      cy.get("[data-cy=performAction]").click();

      cy.contains("Home 0 - Away 1").should("be.visible");
    });
  });
});
