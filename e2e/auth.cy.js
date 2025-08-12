/* global cy, describe, it */

describe('Авторизация', () => {
  it('отображает форму входа', () => {
    cy.visit('/auth')
    cy.contains('Вход').should('exist')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
  })
})
