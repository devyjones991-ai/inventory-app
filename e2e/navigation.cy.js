/* global cy, describe, it */

describe('Навигация', () => {
  it('перенаправляет на страницу авторизации для незалогиненного пользователя', () => {
    cy.visit('/')
    cy.url().should('include', '/auth')
  })
})
