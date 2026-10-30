/// <reference types="cypress" />

// Repro: Cypress 16 native browser-network path hangs forever when a single
// response body is large enough to overflow the CDP websocket frame that
// `Fetch.fulfillRequest` uses. Run with `--browser chrome` (the native path is
// Chrome/Chromium/Edge only; Electron always uses the legacy path).
describe('cypress 16 native-network large response body', () => {
  it('cy.visit a page that loads an oversized JS bundle', () => {
    cy.visit('/')
    cy.get('#status', { timeout: 60000 }).should('have.text', 'loaded')
  })
})
