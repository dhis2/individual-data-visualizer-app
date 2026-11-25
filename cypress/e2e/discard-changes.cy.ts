import {
    expectStartScreenToBeVisible,
    expectVisTitleToEqual,
    openVisByName,
    removeChip,
} from '../helpers'

const VISUALIZATION_NAME = 'E2E: Event line list, event program'

describe('leaving a visualization with changes', () => {
    beforeEach(() => {
        cy.visit('/')
        openVisByName(VISUALIZATION_NAME)
        removeChip('Gender')
        cy.getByDataTest('update-button-event').click()
    })

    it('starts a new visualization when the user confirms', () => {
        cy.getByDataTest('new-button').click()

        cy.getByDataTest('discard-changes-modal-confirm').click()

        expectStartScreenToBeVisible()
    })

    it('goes back when the user confirms going back in the browser', () => {
        cy.go('back')

        cy.getByDataTest('discard-changes-modal-confirm').click()

        expectStartScreenToBeVisible()
    })

    it('puts the visualization back when the user cancels going back in the browser', () => {
        cy.location('hash').then((visualizationHash) => {
            cy.go('back')

            cy.getByDataTest('discard-changes-modal-cancel').click()

            cy.location('hash').should('equal', visualizationHash)
            expectVisTitleToEqual(VISUALIZATION_NAME)
        })
    })
})
