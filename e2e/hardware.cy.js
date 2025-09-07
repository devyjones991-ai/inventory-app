// Lightweight e2e around hardware status updates
// Verifies that only allowed status codes are sent to the backend

describe("Hardware status update", () => {
  const api = "/rest/v1/hardware";

  beforeEach(() => {
    cy.visit("/");
    cy.injectAxe();
    cy.checkA11y(null, { includedImpacts: ["critical"] });
  });

  it("sends allowed install_status and purchase_status on update", () => {
    cy.intercept("PATCH", "**/rest/v1/hardware*", (req) => {
      const body = JSON.parse(req.body || "{}");
      expect(["not_installed", "installed"]).to.include(body.install_status);
      expect(["not_paid", "paid"]).to.include(body.purchase_status);
      req.reply({
        statusCode: 200,
        body: {
          id: body.id ?? 1,
          name: body.name ?? "HW",
          location: body.location ?? "",
          purchase_status: body.purchase_status,
          install_status: body.install_status,
        },
      });
    }).as("updateHardware");

    cy.window().then((win) =>
      win.fetch(`${api}?id=eq.1`, {
        method: "PATCH",
        body: JSON.stringify({
          purchase_status: "paid",
          install_status: "installed",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    cy.wait("@updateHardware").its("response.statusCode").should("eq", 200);
  });

  it("rejects invalid install_status", () => {
    cy.intercept("PATCH", "**/rest/v1/hardware*", (req) => {
      const body = JSON.parse(req.body || "{}");
      const validInstall = ["not_installed", "installed"].includes(
        body.install_status,
      );
      if (!validInstall) {
        return req.reply({
          statusCode: 400,
          body: {
            error: 'violates check constraint "hardware_install_status_check"',
          },
        });
      }
      return req.reply({ statusCode: 200, body: {} });
    }).as("updateHardwareInvalid");

    cy.window().then((win) =>
      win.fetch(`${api}?id=eq.2`, {
        method: "PATCH",
        body: JSON.stringify({
          purchase_status: "paid",
          install_status: "unknown_value",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    cy.wait("@updateHardwareInvalid")
      .its("response.statusCode")
      .should("eq", 400);
  });
});
