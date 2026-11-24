import { interceptLineListAnalytics } from '../../helpers'
import { pluginBody } from '../../support/dashboard-plugin'

const LINE_LIST_ID = 't6SxiQdVPVs'
const AGE_HEADER = 'Age in years'
const AGE_DIMENSION = 'Zj7UnCAulEk.qrur9Dvnyt5'

/* A dashboard can't change the layout, so the plugin keeps a header click as
 * its own sort rather than handing it to the app. */

const getRows = () => pluginBody().find('[data-test="table-row"]')

const getRequestParams = () =>
    cy
        .wait('@lineListAnalytics')
        .its('request.url')
        .then((url) => new URL(url).searchParams)

const sortByAge = (direction: 'asc' | 'desc') => {
    interceptLineListAnalytics()
    pluginBody()
        .find('[data-test="data-table-header"]')
        .find(`button[title*="${AGE_HEADER}"]`)
        .click()
    getRequestParams().then((params) =>
        expect(params.get(direction)).to.equal(AGE_DIMENSION)
    )
    pluginBody()
        .find('[data-test="data-table-header"]')
        .find(`button[title*="${AGE_HEADER}"] svg`)
        .should('have.class', direction)
}

describe('dashboard plugin line list', () => {
    beforeEach(() => {
        cy.visit('/plugin-host.html')
        cy.getByDataTest('plugin-host-visualization-id-input').type(
            LINE_LIST_ID
        )
        getRows().should('have.length.greaterThan', 0)
    })

    it('sorts by a column', () => {
        sortByAge('asc')
        sortByAge('desc')
    })
})
