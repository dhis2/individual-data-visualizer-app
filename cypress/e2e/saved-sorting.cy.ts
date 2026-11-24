import {
    expectColumnSort,
    interceptLineListAnalytics,
    resaveVisualization,
    sortColumn,
} from '../helpers'
import { copyVisualization, deleteVisualizationsByName } from '../support/api'
import { testObjectName } from '../support/names'

const SOURCE_VISUALIZATION_ID = 't6SxiQdVPVs'
/* Analytics names this column without a prefix (`lastupdated`), so its header
 * name and its dimension id (`lastUpdated`) differ only in case, and analytics
 * accepts only the header name as a sort. */
const LAST_UPDATED_HEADER = 'Last updated on'

/* A `cy.wait` for the first request after a page load gets only the 5s
 * request timeout, too short for the app to start on a slow CI runner. Rows
 * get the 30s command timeout, and once they show, the request has been sent. */
const waitForRows = () =>
    cy.getByDataTest('table-row').should('have.length.greaterThan', 0)

const openCopy = (name: string, overrides?: Record<string, unknown>) => {
    interceptLineListAnalytics()
    copyVisualization(SOURCE_VISUALIZATION_ID, name, overrides).then((id) =>
        cy.visit(`/#/${id}`)
    )
    waitForRows()
}

describe('a saved line list sort', () => {
    const names: string[] = []

    /* afterEach, because a retry starts the test again and may save another */
    afterEach(() => {
        names.splice(0).forEach(deleteVisualizationsByName)
    })

    it('opens again after saving', () => {
        const name = testObjectName('saved sort')
        names.push(name)
        openCopy(name)
        cy.wait('@lineListAnalytics')

        sortColumn(LAST_UPDATED_HEADER, 'asc', 'lastupdated')
        resaveVisualization()
        cy.getByDataTest('title-bar').should('not.contain', 'Edited')

        interceptLineListAnalytics()
        cy.reload()
        waitForRows()

        expectColumnSort(LAST_UPDATED_HEADER, 'asc', 'lastupdated')
    })

    it('opens a sort the Line Listing app saved', () => {
        const name = testObjectName('saved sort from line listing')
        names.push(name)
        openCopy(name, {
            sorting: [{ dimension: 'lastUpdated', direction: 'DESC' }],
        })

        expectColumnSort(LAST_UPDATED_HEADER, 'desc', 'lastupdated')
    })
})
