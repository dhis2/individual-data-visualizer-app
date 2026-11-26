import {
    getLayoutSelectionTooltipConfig,
    getOutputTypeTooltipConfig,
} from '@components/layout-panel/bottom-bar/output-type-validity'
import {
    initialState as visUiConfigInitialState,
    type VisUiConfigState,
} from '@store/vis-ui-config-slice'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type { DimensionMetadataItem, Layout, OutputType } from '@types'
import { describe, expect, it } from 'vitest'

const dimension = (
    id: string,
    dimensionType: DimensionMetadataItem['dimensionType'],
    valueType: DimensionMetadataItem['valueType'] = 'TEXT'
): DimensionMetadataItem => ({
    id,
    dimensionId: id.split('.').pop() as string,
    name: id,
    dimensionType,
    valueType,
})

const metadataStore = createMetadataStoreStub({
    dimensions: {
        's1.de': dimension('s1.de', 'DATA_ELEMENT'),
        's1.eventDate': dimension('s1.eventDate', 'PERIOD', 'DATE'),
        'p1.enrollmentDate': dimension('p1.enrollmentDate', 'PERIOD', 'DATE'),
        's1.ou': dimension('s1.ou', 'ORGANISATION_UNIT', 'ORGANISATION_UNIT'),
        's1.deDate': dimension('s1.deDate', 'DATA_ELEMENT', 'DATE'),
        's1.deOu': dimension('s1.deOu', 'DATA_ELEMENT', 'ORGANISATION_UNIT'),
    },
})

const COMPLETE_ITEMS = {
    's1.eventDate': ['LAST_12_MONTHS'],
    's1.ou': ['USER_ORGUNIT'],
}

const buildVisUiConfig = ({
    layout,
    itemsByDimension = COMPLETE_ITEMS,
    conditionsByDimension = {},
    visualizationType = 'LINE_LIST',
}: {
    layout: Partial<Layout>
    itemsByDimension?: VisUiConfigState['itemsByDimension']
    conditionsByDimension?: VisUiConfigState['conditionsByDimension']
    visualizationType?: VisUiConfigState['visualizationType']
}): VisUiConfigState => ({
    ...visUiConfigInitialState,
    visualizationType,
    layout: { columns: [], rows: [], filters: [], ...layout },
    itemsByDimension,
    conditionsByDimension,
})

const NOTHING_SELECTED = {
    content: 'Nothing selected. Add items to the layout to get started.',
    openDelay: 1000,
}
const NO_COLUMN = { content: 'Add at least one dimension to columns' }
const NO_COLUMN_OR_ROW = {
    content: 'Add at least one dimension to columns or rows',
}
const NO_PERIOD = {
    content: 'Select at least one period',
}
const NO_ORG_UNIT = {
    content: 'Select at least one organisation unit',
}
const EMPTY_DIMENSIONS = {
    content: 'Select at least one item for every period and org unit dimension',
}

const check = (visUiConfig: VisUiConfigState) =>
    getLayoutSelectionTooltipConfig({ visUiConfig, metadataStore })

describe('getLayoutSelectionTooltipConfig', () => {
    it('reports nothing selected for an empty layout', () => {
        expect(check(buildVisUiConfig({ layout: {} }))).toEqual(
            NOTHING_SELECTED
        )
    })

    it('passes a complete selection with the period and org unit in filters', () => {
        expect(
            check(
                buildVisUiConfig({
                    layout: {
                        columns: ['s1.de'],
                        filters: ['s1.eventDate', 's1.ou'],
                    },
                })
            )
        ).toBeUndefined()
    })

    it('passes a complete selection with the period and org unit in columns', () => {
        expect(
            check(
                buildVisUiConfig({
                    layout: { columns: ['s1.eventDate', 's1.ou'] },
                })
            )
        ).toBeUndefined()
    })

    describe('something to show', () => {
        it('requires a column in a line list, rows do not count', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            rows: ['s1.de'],
                            filters: ['s1.eventDate', 's1.ou'],
                        },
                    })
                )
            ).toEqual(NO_COLUMN)
        })

        it('requires a column in a line list with only filters', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: { filters: ['s1.eventDate', 's1.ou'] },
                    })
                )
            ).toEqual(NO_COLUMN)
        })

        it('accepts a row instead of a column in a pivot table', () => {
            expect(
                check(
                    buildVisUiConfig({
                        visualizationType: 'PIVOT_TABLE',
                        layout: {
                            rows: ['s1.de'],
                            filters: ['s1.eventDate', 's1.ou'],
                        },
                    })
                )
            ).toBeUndefined()
        })

        it('requires a column or row in a pivot table with only filters', () => {
            expect(
                check(
                    buildVisUiConfig({
                        visualizationType: 'PIVOT_TABLE',
                        layout: { filters: ['s1.eventDate', 's1.ou'] },
                    })
                )
            ).toEqual(NO_COLUMN_OR_ROW)
        })
    })

    describe('period', () => {
        it('requires a period dimension', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: { columns: ['s1.de'], filters: ['s1.ou'] },
                    })
                )
            ).toEqual(NO_PERIOD)
        })

        it('requires a period item when the items were cleared', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            columns: ['s1.de'],
                            filters: ['s1.eventDate', 's1.ou'],
                        },
                        itemsByDimension: {
                            ...COMPLETE_ITEMS,
                            's1.eventDate': [],
                        },
                    })
                )
            ).toEqual(NO_PERIOD)
        })

        it('requires a period item when there are no items at all', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            columns: ['s1.de'],
                            filters: ['s1.eventDate', 's1.ou'],
                        },
                        itemsByDimension: { 's1.ou': ['USER_ORGUNIT'] },
                    })
                )
            ).toEqual(NO_PERIOD)
        })

        it('does not count a date data element with a condition', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            columns: ['s1.deDate'],
                            filters: ['s1.ou'],
                        },
                        conditionsByDimension: {
                            's1.deDate': { condition: 'GE:2020-01-01' },
                        },
                    })
                )
            ).toEqual(NO_PERIOD)
        })
    })

    describe('org unit', () => {
        it('requires an org unit dimension', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            columns: ['s1.de'],
                            filters: ['s1.eventDate'],
                        },
                    })
                )
            ).toEqual(NO_ORG_UNIT)
        })

        it('requires an org unit item when the items were cleared', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            columns: ['s1.de'],
                            filters: ['s1.eventDate', 's1.ou'],
                        },
                        itemsByDimension: { ...COMPLETE_ITEMS, 's1.ou': [] },
                    })
                )
            ).toEqual(NO_ORG_UNIT)
        })

        it('does not count an org unit data element with a condition', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            columns: ['s1.deOu'],
                            filters: ['s1.eventDate'],
                        },
                        conditionsByDimension: {
                            's1.deOu': { condition: 'IN:ImspTQPwCqd' },
                        },
                    })
                )
            ).toEqual(NO_ORG_UNIT)
        })
    })

    describe('pivot table period and org unit items', () => {
        it('requires items on an empty period next to one with items', () => {
            expect(
                check(
                    buildVisUiConfig({
                        visualizationType: 'PIVOT_TABLE',
                        layout: {
                            columns: ['s1.ou'],
                            rows: ['s1.eventDate', 'p1.enrollmentDate'],
                        },
                    })
                )
            ).toEqual(EMPTY_DIMENSIONS)
        })

        it('requires items when both a period and an org unit are empty', () => {
            expect(
                check(
                    buildVisUiConfig({
                        visualizationType: 'PIVOT_TABLE',
                        layout: {
                            columns: ['s1.ou'],
                            rows: ['s1.eventDate'],
                        },
                        itemsByDimension: { 's1.eventDate': [], 's1.ou': [] },
                    })
                )
            ).toEqual(EMPTY_DIMENSIONS)
        })

        it('ignores an empty period in filters', () => {
            expect(
                check(
                    buildVisUiConfig({
                        visualizationType: 'PIVOT_TABLE',
                        layout: {
                            columns: ['s1.ou'],
                            rows: ['s1.eventDate'],
                            filters: ['p1.enrollmentDate'],
                        },
                    })
                )
            ).toBeUndefined()
        })

        it('does not apply to a line list', () => {
            expect(
                check(
                    buildVisUiConfig({
                        layout: {
                            columns: [
                                's1.ou',
                                's1.eventDate',
                                'p1.enrollmentDate',
                            ],
                        },
                    })
                )
            ).toBeUndefined()
        })
    })
})

describe('getOutputTypeTooltipConfig', () => {
    it.each<OutputType>(['EVENT', 'ENROLLMENT', 'TRACKED_ENTITY_INSTANCE'])(
        'reports a missing period for %s before any output type reason',
        (outputType) => {
            expect(
                getOutputTypeTooltipConfig({
                    outputType,
                    visUiConfig: buildVisUiConfig({
                        layout: { columns: ['s1.de'], filters: ['s1.ou'] },
                    }),
                    metadataStore,
                })
            ).toEqual(NO_PERIOD)
        }
    )
})

describe('getOutputTypeTooltipConfig with a cell value', () => {
    const inProgram = (item: DimensionMetadataItem): DimensionMetadataItem => ({
        ...item,
        programId: 'p1',
        programStageId: 's1',
    })

    const cellValueStore = createMetadataStoreStub({
        programs: {
            p1: {
                id: 'p1',
                name: 'Program 1',
                programType: 'WITH_REGISTRATION',
                programStages: [],
                trackedEntityType: { id: 'tet1', name: 'Person' },
            },
        },
        dimensions: {
            's1.eventDate': inProgram(
                dimension('s1.eventDate', 'PERIOD', 'DATE')
            ),
            's1.ou': inProgram(
                dimension('s1.ou', 'ORGANISATION_UNIT', 'ORGANISATION_UNIT')
            ),
            's1.sumItem': inProgram({
                ...dimension('s1.sumItem', 'DATA_ELEMENT', 'NUMBER'),
                aggregationType: 'SUM',
            }),
            's1.lastItem': inProgram({
                ...dimension('s1.lastItem', 'DATA_ELEMENT', 'NUMBER'),
                aggregationType: 'LAST',
            }),
        },
    })

    const EVENT_ONLY_AGGREGATION = {
        content: 'Not valid with first or last value aggregation',
    }

    const checkWithCellValue = ({
        outputType,
        cellValue,
        visualizationType = 'PIVOT_TABLE',
    }: {
        outputType: OutputType
        cellValue: VisUiConfigState['cellValue']
        visualizationType?: VisUiConfigState['visualizationType']
    }) =>
        getOutputTypeTooltipConfig({
            outputType,
            visUiConfig: {
                ...buildVisUiConfig({
                    layout: { columns: ['s1.ou'], rows: ['s1.eventDate'] },
                    visualizationType,
                }),
                cellValue,
            },
            metadataStore: cellValueStore,
        })

    it.each([
        'LAST',
        'LAST_AVERAGE_ORG_UNIT',
        'FIRST',
        'FIRST_AVERAGE_ORG_UNIT',
    ] as const)('rejects enrollment for %s', (aggregationType) => {
        expect(
            checkWithCellValue({
                outputType: 'ENROLLMENT',
                cellValue: { id: 's1.sumItem', aggregationType },
            })
        ).toEqual(EVENT_ONLY_AGGREGATION)
    })

    it('rejects enrollment for DEFAULT on an item that aggregates by LAST', () => {
        expect(
            checkWithCellValue({
                outputType: 'ENROLLMENT',
                cellValue: { id: 's1.lastItem', aggregationType: 'DEFAULT' },
            })
        ).toEqual(EVENT_ONLY_AGGREGATION)
    })

    it('accepts enrollment for DEFAULT on an item that aggregates by SUM', () => {
        expect(
            checkWithCellValue({
                outputType: 'ENROLLMENT',
                cellValue: { id: 's1.sumItem', aggregationType: 'DEFAULT' },
            })
        ).toBeUndefined()
    })

    it('accepts enrollment for an explicit SUM on an item that aggregates by LAST', () => {
        expect(
            checkWithCellValue({
                outputType: 'ENROLLMENT',
                cellValue: { id: 's1.lastItem', aggregationType: 'SUM' },
            })
        ).toBeUndefined()
    })

    it('accepts event for LAST', () => {
        expect(
            checkWithCellValue({
                outputType: 'EVENT',
                cellValue: { id: 's1.sumItem', aggregationType: 'LAST' },
            })
        ).toBeUndefined()
    })

    /* A line list neither shows nor sends the cell value. */
    it('ignores the cell value in a line list', () => {
        expect(
            checkWithCellValue({
                outputType: 'ENROLLMENT',
                cellValue: { id: 's1.sumItem', aggregationType: 'LAST' },
                visualizationType: 'LINE_LIST',
            })
        ).toBeUndefined()
    })
})
