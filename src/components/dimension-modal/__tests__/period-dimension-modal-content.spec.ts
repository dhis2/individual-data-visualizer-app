import { describe, it, expect } from 'vitest'
import { getSelectedPeriods } from '../period-dimension-modal-content'

describe('getSelectedPeriods', () => {
    it('names a period from the metadata store', () => {
        expect(
            getSelectedPeriods(['LAST_12_MONTHS', '201701'], {
                LAST_12_MONTHS: {
                    id: 'LAST_12_MONTHS',
                    name: 'Last 12 months',
                },
                '201701': { id: '201701', name: 'January 2017' },
            })
        ).toEqual([
            { id: 'LAST_12_MONTHS', name: 'Last 12 months' },
            { id: '201701', name: 'January 2017' },
        ])
    })

    it('names a period missing from the metadata store by its id', () => {
        expect(getSelectedPeriods(['2017'], {})).toEqual([
            { id: '2017', name: '2017' },
        ])
    })
})
