/* global cy, describe, it, beforeEach */

describe("Задачи CRUD", () => {
  const api = "/rest/v1/tasks";

  beforeEach(() => {
    cy.visit("/auth");
  });

  it("создает задачу", () => {
    cy.intercept("POST", "**/rest/v1/tasks", {
      id: 101,
      title: "Новая задача",
    }).as("createTask");
    cy.window().then((win) =>
      win.fetch(api, {
        method: "POST",
        body: JSON.stringify({ title: "Новая задача" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    cy.wait("@createTask")
      .its("response.body")
      .should("have.property", "id", 101);
  });

  it("читает задачи", () => {
    cy.intercept("GET", "**/rest/v1/tasks*", { fixture: "tasks.json" }).as(
      "getTasks",
    );
    cy.window().then((win) => win.fetch(api));
    cy.wait("@getTasks").its("response.body").should("have.length", 1);
  });

  it("обновляет задачу", () => {
    cy.intercept("PATCH", "**/rest/v1/tasks*", {
      id: 101,
      title: "Обновленная задача",
    }).as("updateTask");
    cy.window().then((win) =>
      win.fetch(`${api}?id=eq.101`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Обновленная задача" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    cy.wait("@updateTask")
      .its("response.body")
      .should("have.property", "title", "Обновленная задача");
  });

  it("удаляет задачу", () => {
    cy.intercept("DELETE", "**/rest/v1/tasks*", {
      statusCode: 204,
      body: {},
    }).as("deleteTask");
    cy.window().then((win) =>
      win.fetch(`${api}?id=eq.101`, { method: "DELETE" }),
    );
    cy.wait("@deleteTask").its("response.statusCode").should("eq", 204);
  });
});
