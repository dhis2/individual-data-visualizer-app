import { normalizeApiSavedVisualization } from '@modules/visualization/normalize-legacy'
import type { ApiSavedVisualization, DimensionRecord, Sorting } from '@types'
import { describe, expect, it } from 'vitest'

const PROGRAM_ID = 'program1'
const STAGE_ID = 'stage1'

const eventDateColumn: DimensionRecord = {
    dimension: 'eventDate',
    dimensionType: 'PERIOD',
    program: { id: PROGRAM_ID },
    programStage: { id: STAGE_ID },
}
const enrollmentDateColumn: DimensionRecord = {
    dimension: 'enrollmentDate',
    dimensionType: 'PERIOD',
    program: { id: PROGRAM_ID },
}

const loadSorting = (
    overrides: Partial<ApiSavedVisualization>
): Sorting[] | undefined =>
    normalizeApiSavedVisualization({
        type: 'LINE_LIST',
        outputType: 'EVENT',
        columns: [eventDateColumn, enrollmentDateColumn],
        rows: [],
        filters: [],
        programDimensions: [{ id: PROGRAM_ID }],
        ...overrides,
    } as unknown as ApiSavedVisualization).sorting

describe('loading a sorted visualization', () => {
    it('keeps a sort saved with the header name', () => {
        const sorting: Sorting[] = [
            { dimension: `${STAGE_ID}.eventdate`, direction: 'DESC' },
        ]

        expect(loadSorting({ sorting })).toEqual(sorting)
    })

    it.each([
        ['eventDate', `${STAGE_ID}.eventdate`],
        ['enrollmentDate', 'enrollmentdate'],
    ])(
        'turns a sort saved as the dimension id %s into the header name %s',
        (savedDimension, headerName) => {
            expect(
                loadSorting({
                    sorting: [{ dimension: savedDimension, direction: 'ASC' }],
                })
            ).toEqual([{ dimension: headerName, direction: 'ASC' }])
        }
    )

    it('uses the header name of the output type', () => {
        expect(
            loadSorting({
                outputType: 'TRACKED_ENTITY_INSTANCE',
                trackedEntityType: { id: 'tet1', name: 'Person' },
                sorting: [{ dimension: 'enrollmentDate', direction: 'ASC' }],
            })
        ).toEqual([
            { dimension: `${PROGRAM_ID}.enrollmentdate`, direction: 'ASC' },
        ])
    })

    it('keeps only the first sort', () => {
        expect(
            loadSorting({
                sorting: [
                    { dimension: 'enrollmentdate', direction: 'ASC' },
                    { dimension: `${STAGE_ID}.eventdate`, direction: 'DESC' },
                ],
            })
        ).toEqual([{ dimension: 'enrollmentdate', direction: 'ASC' }])
    })

    it('drops a sort on a dimension that is not a column', () => {
        expect(
            loadSorting({
                columns: [eventDateColumn],
                filters: [enrollmentDateColumn],
                sorting: [{ dimension: 'enrollmentdate', direction: 'ASC' }],
            })
        ).toBeUndefined()
    })

    it('drops a sort on a pivot table', () => {
        expect(
            loadSorting({
                type: 'PIVOT_TABLE',
                sorting: [{ dimension: 'enrollmentdate', direction: 'ASC' }],
            })
        ).toBeUndefined()
    })

    it('drops an empty sort', () => {
        expect(loadSorting({ sorting: [] })).toBeUndefined()
    })
})
