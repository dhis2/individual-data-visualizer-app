import {
    expectStartScreenToBeVisible,
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
})
