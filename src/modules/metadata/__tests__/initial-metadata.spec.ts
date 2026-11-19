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
})
