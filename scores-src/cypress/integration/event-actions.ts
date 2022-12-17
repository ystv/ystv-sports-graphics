describe("Event Actions", () => {
  describe("Football", () => {
    before(() => {
      cy.resetAndCreateTestUser("admin", "password");
      cy.createTeam({
        name: "Lancaster",
        abbreviation: "LANC",
        primaryColour: "#ff0000",
        secondaryColour: "#fafafa",
      });
      cy.createTeam({
        name: "York",
        abbreviation: "YORK",
        primaryColour: "#fafafa",
        secondaryColour: "#000000",
      });
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
      cy.request({
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
      }).then((result) => {
        cy.wrap(result.body).its("id").as("eventID");
      });
    });

    it("Start a half", function () {
      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);
      cy.contains("Lancaster 0 - York 0").should("be.visible");

      cy.contains("Start Half").click();
      cy.get("input[name=shouldChangeTime]").should("not.exist");
      cy.get("[data-cy=performAction]").click();
      cy.get("[data-cy=timeline] > *").should("have.length", 1);
    });

    it("Goal", function () {
      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);
      cy.contains("Lancaster 0 - York 0").should("be.visible");

      cy.contains("Goal").click();
      cy.get("input[name=shouldChangeTime]").should("not.exist");
      cy.get("[data-test-form-field=side]").contains("York").click();
      cy.get("label")
        .contains("Player")
        .parent()
        .get("[role=combobox]")
        .click();
      cy.get(".mantine-Select-item").contains("Unknown").click();
      cy.get("[data-cy=performAction]").click();

      cy.contains("Lancaster 0 - York 1").should("be.visible");
      cy.get("[data-cy=timeline] > *").should("have.length", 2);
    });

    it("Undo/Redo last goal", function () {
      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);
      cy.contains("Lancaster 0 - York 1").should("be.visible");

      cy.get("[data-cy=timeline] > *").first().contains("Undo").click();
      cy.contains("Lancaster 0 - York 0").should("be.visible");
      cy.get("[data-cy=timeline] > *")
        .contains("Redo")
        .should("be.visible")
        .should("not.be.disabled");

      cy.get("[data-cy=timeline] > *").first().contains("Redo").click();
      cy.contains("Lancaster 0 - York 1").should("be.visible");
    });

    it("Action, then edit, then undo that action", function () {
      cy.intercept({
        method: "PUT",
        path: "/api/events/test-league/football/*",
      }).as("putEvents");

      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);
      cy.contains("Lancaster 0 - York 1").should("be.visible");

      cy.visit("/events");
      cy.contains("Test Event")
        .parent("[data-cy=eventRoot]")
        .get("[data-cy=editEvent]")
        .click();
      cy.contains("Editing Test Event").should("be.visible");
      cy.get("[name=worthPoints]").clear().type("0");
      cy.get("[data-cy=submit]").click();
      cy.wait(["@putEvents"]);

      cy.visit(`/events/test-league/football/${this.eventID}`);
      cy.get("[data-cy=timeline] > *").first().contains("Undo").click();
      cy.contains("Lancaster 0 - York 0").should("be.visible");
    });

    it("GRAPHICS-226 - goal with no player, then edit", function () {
      cy.intercept({
        method: "PUT",
        path: "/api/events/test-league/football/*",
      }).as("putEvents");

      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);
      cy.contains("Lancaster 0 - York 0").should("be.visible");

      cy.contains("Goal").click();
      cy.get("[data-test-form-field=side]").contains("York").click();
      cy.get("[data-cy=performAction]").click();

      cy.visit("/events");
      cy.contains("Test Event")
        .parent("[data-cy=eventRoot]")
        .get("[data-cy=editEvent]")
        .click();
      cy.contains("Editing Test Event").should("be.visible");
      cy.get("[name=worthPoints]").clear().type("0");
      cy.get("[data-cy=submit]").click();
      cy.wait(["@putEvents"]);
    });

    it("Edit Action", function () {
      cy.intercept({
        method: "POST",
        path: "/api/events/**/_update",
      }).as("update");
      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);

      cy.get("[data-cy=timeline]")
        .contains("York at")
        .parent()
        .within(function () {
          cy.get("[data-cy=editButton]").click();
        });

      cy.get("[data-test-form-field=side]").contains("Lancaster").click();
      cy.get("label")
        .contains("Player")
        .parent()
        .get("[role=combobox]")
        .click();
      cy.get(".mantine-Select-item").contains("Unknown").click();
      cy.get("[data-cy=performAction]").click();
      cy.wait("@update");

      cy.contains("Lancaster 1 - York 0").should("be.visible");
    });

    it("Change Action Time", function () {
      cy.intercept({
        method: "POST",
        path: "/api/events/**/_update",
      }).as("update");
      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);

      cy.get("[data-cy=timeline]")
        .contains("Started next half")
        .parent()
        .within(function () {
          cy.get("[data-cy=editButton]").click();
        });

      cy.get("input[name=shouldChangeTime]").check();

      const oneMinuteAgo = new Date();
      if (oneMinuteAgo.getMinutes() < 5) {
        oneMinuteAgo.setHours(oneMinuteAgo.getHours() - 1);
        oneMinuteAgo.setMinutes(60 - (5 - oneMinuteAgo.getMinutes()));
        cy.get("[data-cy=changeTimeField] [data-cy=timePicker] input")
          .eq(0)
          .click()
          .type(oneMinuteAgo.getHours().toString(10));
        cy.get("[data-cy=changeTimeField] [data-cy=timePicker] input")
          .eq(1)
          .click()
          .type(oneMinuteAgo.getMinutes().toString(10));
      } else {
        oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 5);
        cy.get("[data-cy=changeTimeField] [data-cy=timePicker] input")
          .eq(1)
          .click()
          .type(oneMinuteAgo.getMinutes().toString(10));
      }
      cy.get("[data-cy=performAction]").click();

      cy.wait("@update");
      cy.get("[data-cy=timeline]")
        .children()
        .first()
        .should("not.contain", "0 minutes")
        .should("not.contain", "1 minute");
    });

    it("Declare Winner", function () {
      cy.intercept({
        method: "PUT",
        path: "/api/events/**/_declareWinner",
      }).as("declareWinner");
      cy.login("admin", "password");
      cy.visit(`/events/test-league/football/${this.eventID}`);

      cy.contains("Declare Winner").click();

      cy.get("[data-cy=declare-winner]").within(() => {
        cy.contains("York").click();
      });
      cy.get("[data-cy=declare-winner-confirm]").click();

      cy.visit("/events");
      cy.contains("Winner: York").should("be.visible");
    });
  });
});
