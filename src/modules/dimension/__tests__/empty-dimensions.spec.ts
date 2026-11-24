import { getEmptyPeriodAndOrgUnitDimensionIds } from '@modules/dimension/empty-dimensions'
import type { DimensionMetadataItem, Layout } from '@types'
import { describe, expect, it } from 'vitest'

const dimensionTypes: Record<string, DimensionMetadataItem['dimensionType']> = {
    's1.eventDate': 'PERIOD',
    'p1.enrollmentDate': 'PERIOD',
    's1.ou': 'ORGANISATION_UNIT',
    'tet.ou': 'ORGANISATION_UNIT',
    's1.de': 'DATA_ELEMENT',
}

const getDimension = (id: string) => ({ dimensionType: dimensionTypes[id] })

const check = (
    layout: Partial<Layout>,
    itemsByDimension: Record<string, string[] | undefined> = {}
) =>
    getEmptyPeriodAndOrgUnitDimensionIds({
        layout: { columns: [], rows: [], filters: [], ...layout },
        itemsByDimension,
        getDimension,
    })

describe('getEmptyPeriodAndOrgUnitDimensionIds', () => {
    it('returns empty period and org unit dimensions on columns and rows', () => {
        expect(check({ columns: ['s1.ou'], rows: ['s1.eventDate'] })).toEqual([
            's1.ou',
            's1.eventDate',
        ])
    })

    it('counts cleared items as empty', () => {
        expect(
            check({ rows: ['s1.eventDate'] }, { 's1.eventDate': [] })
        ).toEqual(['s1.eventDate'])
    })

    it('skips dimensions with items', () => {
        expect(
            check(
                { rows: ['s1.eventDate', 'p1.enrollmentDate'] },
                { 's1.eventDate': ['LAST_12_MONTHS'] }
            )
        ).toEqual(['p1.enrollmentDate'])
    })

    it('ignores filters', () => {
        expect(check({ filters: ['s1.eventDate', 's1.ou'] })).toEqual([])
    })

    it('ignores other dimension types', () => {
        expect(check({ columns: ['s1.de'] })).toEqual([])
    })

    it('includes the registration org unit', () => {
        expect(check({ columns: ['tet.ou'] })).toEqual(['tet.ou'])
    })
})
