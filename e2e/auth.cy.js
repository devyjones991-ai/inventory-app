/* eslint-env cypress */

describe("Авторизация", () => {
  it("отображает форму входа", () => {
    cy.visit("/auth");
    cy.injectAxe();
    cy.checkA11y(null, { includedImpacts: ["critical"] });
    cy.contains("Вход").should("exist");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
  });
});
