import { expect, describe, it } from 'vitest'
import { getInitialMetadata } from '../initial-metadata'

describe('getInitialMetadata', () => {
    it('includes the relative period names it is given', () => {
        const initialMetadata = getInitialMetadata({
            LAST_5_YEARS: 'Les 5 dernières années',
        })

        expect(initialMetadata.LAST_5_YEARS).toBe('Les 5 dernières années')
    })

    it('includes the user org unit names', () => {
        const initialMetadata = getInitialMetadata({})

        expect(initialMetadata.USER_ORGUNIT).toBe('User organisation unit')
    })

    it.each([
        { id: 'lastUpdated', name: 'Last updated on', dimensionType: 'PERIOD' },
        { id: 'lastUpdatedBy', name: 'Last updated by', dimensionType: 'USER' },
        { id: 'created', name: 'Created on', dimensionType: 'PERIOD' },
        { id: 'createdBy', name: 'Created by', dimensionType: 'USER' },
        { id: 'completed', name: 'Completed on', dimensionType: 'PERIOD' },
    ])('includes the $id metadata dimension', ({ id, name, dimensionType }) => {
        const initialMetadata = getInitialMetadata({})

        expect(initialMetadata[id]).toMatchObject({ id, name, dimensionType })
    })
})
