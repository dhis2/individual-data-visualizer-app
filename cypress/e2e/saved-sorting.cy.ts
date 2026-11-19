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

const openCopy = (name: string, overrides?: Record<string, unknown>) => {
    interceptLineListAnalytics()
    copyVisualization(SOURCE_VISUALIZATION_ID, name, overrides).then((id) =>
        cy.visit(`/#/${id}`)
    )
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
