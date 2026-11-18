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
const NO_COLUMN = { content: 'Add at least one column' }
const NO_COLUMN_OR_ROW = { content: 'Add at least one column or row' }
const NO_PERIOD = {
    content: 'Add a period dimension with at least one period selected',
}
const NO_ORG_UNIT = {
    content:
        'Add an organisation unit dimension with at least one organisation unit selected',
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
