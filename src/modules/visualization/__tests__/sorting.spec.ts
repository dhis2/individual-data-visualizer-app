import { DEFAULT_OPTIONS } from '@constants/options'
import { buildCurrentVisFromVisUiConfig } from '@modules/visualization/current-vis'
import { normalizeApiSavedVisualization } from '@modules/visualization/normalize-legacy'
import { getVisUiConfigSorting } from '@modules/visualization/sorting'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type {
    ApiSavedVisualization,
    CurrentVisualization,
    DimensionMetadataItem,
    DimensionRecord,
    Program,
    Sorting,
} from '@types'
import { describe, expect, it } from 'vitest'

const PROGRAM_ID = 'program1'
const STAGE_ID = 'stage1'
const TET_ID = 'tet1'

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

const EVENT_DATE = `${STAGE_ID}.eventDate`
const EVENT_OU = `${STAGE_ID}.ou`
const DATA_ELEMENT = `${STAGE_ID}.de1`
const ENROLLMENT_DATE = `${PROGRAM_ID}.enrollmentDate`

const dimensionItem = (
    id: string,
    item: Partial<DimensionMetadataItem>
): DimensionMetadataItem =>
    ({
        id,
        name: id,
        dimensionId: id.slice(id.lastIndexOf('.') + 1),
        programId: PROGRAM_ID,
        ...item,
    }) as DimensionMetadataItem

const metadataStore = createMetadataStoreStub({
    items: { [TET_ID]: { id: TET_ID, name: 'Person' } },
    programs: {
        [PROGRAM_ID]: {
            id: PROGRAM_ID,
            programType: 'WITH_REGISTRATION',
            trackedEntityType: { id: TET_ID },
        } as unknown as Program,
    },
    dimensions: {
        [EVENT_DATE]: dimensionItem(EVENT_DATE, {
            dimensionType: 'PERIOD',
            programStageId: STAGE_ID,
        }),
        [EVENT_OU]: dimensionItem(EVENT_OU, {
            dimensionType: 'ORGANISATION_UNIT',
            programStageId: STAGE_ID,
        }),
        [DATA_ELEMENT]: dimensionItem(DATA_ELEMENT, {
            dimensionType: 'DATA_ELEMENT',
            programStageId: STAGE_ID,
            valueType: 'NUMBER',
        }),
        [ENROLLMENT_DATE]: dimensionItem(ENROLLMENT_DATE, {
            dimensionType: 'PERIOD',
        }),
    },
})

const visUiConfig: VisUiConfigState = {
    visualizationType: 'LINE_LIST',
    outputType: 'EVENT',
    layout: {
        columns: [EVENT_OU, EVENT_DATE, ENROLLMENT_DATE, DATA_ELEMENT],
        rows: [],
        filters: [],
    },
    itemsByDimension: {},
    conditionsByDimension: {},
    repetitionsByDimension: {},
    options: DEFAULT_OPTIONS,
}

const build = (config: VisUiConfigState): CurrentVisualization =>
    buildCurrentVisFromVisUiConfig({
        previousCurrentVis: {} as CurrentVisualization,
        visUiConfig: config,
        metadataStore,
    })

/* Sort the line list built from `sortedConfig` by one of its headers, then
 * apply `changes` to the config and return the sort of the result. */
const sortThenApply = ({
    headerName,
    sortedConfig = visUiConfig,
    changes = {},
}: {
    headerName: string
    sortedConfig?: VisUiConfigState
    changes?: Partial<VisUiConfigState>
}): Sorting[] | undefined => {
    const sorting = getVisUiConfigSorting(
        [{ dimension: headerName, direction: 'DESC' }],
        build(sortedConfig)
    )

    return build({ ...sortedConfig, ...changes, sorting }).sorting
}

describe('applying a sorted line list', () => {
    it('keeps the sort when its column is unchanged', () => {
        expect(
            sortThenApply({
                headerName: 'enrollmentdate',
                changes: {
                    options: { ...DEFAULT_OPTIONS, title: 'Renamed' },
                },
            })
        ).toEqual([{ dimension: 'enrollmentdate', direction: 'DESC' }])
    })

    it('drops the sort when its column is removed', () => {
        expect(
            sortThenApply({
                headerName: 'enrollmentdate',
                changes: {
                    layout: {
                        columns: [EVENT_OU, EVENT_DATE],
                        rows: [],
                        filters: [],
                    },
                },
            })
        ).toBeUndefined()
    })

    it('drops the sort when its column moves to the filters', () => {
        expect(
            sortThenApply({
                headerName: 'enrollmentdate',
                changes: {
                    layout: {
                        columns: [EVENT_OU, EVENT_DATE],
                        rows: [],
                        filters: [ENROLLMENT_DATE],
                    },
                },
            })
        ).toBeUndefined()
    })

    it('drops the sort when the line list becomes a pivot table', () => {
        expect(
            sortThenApply({
                headerName: 'enrollmentdate',
                changes: { visualizationType: 'PIVOT_TABLE' },
            })
        ).toBeUndefined()
    })

    it('renames the sort for a tracked entity output type', () => {
        expect(
            sortThenApply({
                headerName: 'enrollmentdate',
                changes: { outputType: 'TRACKED_ENTITY_INSTANCE' },
            })
        ).toEqual([
            { dimension: `${PROGRAM_ID}.enrollmentdate`, direction: 'DESC' },
        ])
    })

    it('renames the sort for an event output type', () => {
        expect(
            sortThenApply({
                headerName: `${PROGRAM_ID}.enrollmentdate`,
                sortedConfig: {
                    ...visUiConfig,
                    outputType: 'TRACKED_ENTITY_INSTANCE',
                },
                changes: { outputType: 'EVENT' },
            })
        ).toEqual([{ dimension: 'enrollmentdate', direction: 'DESC' }])
    })

    it('renames the sort on the org unit when the hierarchy is shown', () => {
        expect(
            sortThenApply({
                headerName: `${STAGE_ID}.ouname`,
                changes: {
                    options: { ...DEFAULT_OPTIONS, showHierarchy: true },
                },
            })
        ).toEqual([
            { dimension: `${STAGE_ID}.ounamehierarchy`, direction: 'DESC' },
        ])
    })

    describe('on a repeated column', () => {
        const repeatedConfig: VisUiConfigState = {
            ...visUiConfig,
            repetitionsByDimension: {
                [DATA_ELEMENT]: { mostRecent: 2, oldest: 0 },
            },
        }
        const headerName = `${STAGE_ID}[-1].de1`

        it('keeps the sort while its repetition is shown', () => {
            expect(
                sortThenApply({
                    headerName,
                    sortedConfig: repeatedConfig,
                    changes: {
                        repetitionsByDimension: {
                            [DATA_ELEMENT]: { mostRecent: 3, oldest: 0 },
                        },
                    },
                })
            ).toEqual([{ dimension: headerName, direction: 'DESC' }])
        })

        it('drops the sort when its repetition is removed', () => {
            expect(
                sortThenApply({
                    headerName,
                    sortedConfig: repeatedConfig,
                    changes: { repetitionsByDimension: {} },
                })
            ).toBeUndefined()
        })
    })
})
