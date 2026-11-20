// eslint-disable-next-line no-restricted-imports
import type { useDataEngine } from '@dhis2/app-runtime'
import { createMetadataStoreStub } from '@test-utils/metadata-store-stub'
import type { CurrentVisualization, DimensionMetadataItem } from '@types'
import { describe, expect, it, vi } from 'vitest'
import {
    fetchLegendSets,
    fetchPivotTableLegendSet,
    getFixedLegendSetIds,
    getPivotTableEngineLegend,
} from './legend-sets'

const SET = { id: 'ls1', displayName: 'Weight bands' }

describe('getFixedLegendSetIds', () => {
    it('returns the chosen legend set for the FIXED strategy', () => {
        expect(
            getFixedLegendSetIds({
                legend: { strategy: 'FIXED', style: 'FILL', set: SET },
            })
        ).toEqual(['ls1'])
    })

    it('returns nothing for the FIXED strategy without a chosen legend set', () => {
        expect(
            getFixedLegendSetIds({
                legend: { strategy: 'FIXED', style: 'FILL' },
            })
        ).toEqual([])
    })

    it('returns nothing for the BY_DATA_ITEM strategy', () => {
        expect(
            getFixedLegendSetIds({
                legend: { strategy: 'BY_DATA_ITEM', style: 'FILL', set: SET },
            } as Pick<CurrentVisualization, 'legend'>)
        ).toEqual([])
    })

    it('returns nothing without a legend', () => {
        expect(getFixedLegendSetIds({ legend: undefined })).toEqual([])
    })
})

describe('fetchLegendSets', () => {
    const buildDataEngine = (legendSets: unknown[]) =>
        ({
            query: vi.fn().mockResolvedValue({ legendSets: { legendSets } }),
        }) as unknown as ReturnType<typeof useDataEngine> & {
            query: ReturnType<typeof vi.fn>
        }

    it('fetches the legend sets with the given ids', async () => {
        const legendSet = { id: 'ls1', name: 'Weight bands', legends: [] }
        const dataEngine = buildDataEngine([legendSet])

        await expect(
            fetchLegendSets({ legendSetIds: ['ls1', 'ls2'], dataEngine })
        ).resolves.toEqual([legendSet])
        expect(dataEngine.query).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ variables: { ids: ['ls1', 'ls2'] } })
        )
    })

    it('makes no request without legend set ids', async () => {
        const dataEngine = buildDataEngine([])

        await expect(
            fetchLegendSets({ legendSetIds: [], dataEngine })
        ).resolves.toEqual([])
        expect(dataEngine.query).not.toHaveBeenCalled()
    })
})

describe('fetchPivotTableLegendSet', () => {
    const weightBands = { id: 'ls1', name: 'Weight bands', legends: [] }
    const heightBands = { id: 'ls2', name: 'Height bands', legends: [] }

    const metadataStore = createMetadataStoreStub({
        dimensions: {
            'stage1.de1': {
                id: 'stage1.de1',
                dimensionId: 'de1',
                dimensionType: 'DATA_ELEMENT',
            } as DimensionMetadataItem,
            'tet1.attr1': {
                id: 'tet1.attr1',
                dimensionId: 'attr1',
                dimensionType: 'PROGRAM_ATTRIBUTE',
            } as DimensionMetadataItem,
        },
    })

    const buildDataEngine = (response: unknown) =>
        ({
            query: vi.fn().mockResolvedValue(response),
        }) as unknown as ReturnType<typeof useDataEngine> & {
            query: ReturnType<typeof vi.fn>
        }

    const buildVisualization = (visualization: Partial<CurrentVisualization>) =>
        ({
            type: 'PIVOT_TABLE',
            programDimensions: [
                { id: 'p1', trackedEntityType: { id: 'tet1' } },
            ],
            ...visualization,
        }) as unknown as CurrentVisualization

    const byDataItem = {
        strategy: 'BY_DATA_ITEM',
        style: 'FILL',
    } as CurrentVisualization['legend']

    it('fetches the chosen legend set for the FIXED strategy', async () => {
        const dataEngine = buildDataEngine({
            legendSets: { legendSets: [weightBands] },
        })

        await expect(
            fetchPivotTableLegendSet({
                visualization: buildVisualization({
                    legend: {
                        strategy: 'FIXED',
                        style: 'FILL',
                        set: SET,
                    } as CurrentVisualization['legend'],
                    value: { id: 'de1', programStage: { id: 'stage1' } },
                }),
                metadataStore,
                dataEngine,
            })
        ).resolves.toEqual(weightBands)
        expect(dataEngine.query).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ variables: { ids: ['ls1'] } })
        )
    })

    it('fetches the first legend set of a data element cell value', async () => {
        const dataEngine = buildDataEngine({
            dataItem: { legendSets: [weightBands, heightBands] },
        })

        await expect(
            fetchPivotTableLegendSet({
                visualization: buildVisualization({
                    legend: byDataItem,
                    value: { id: 'de1', programStage: { id: 'stage1' } },
                }),
                metadataStore,
                dataEngine,
            })
        ).resolves.toEqual(weightBands)
        expect(dataEngine.query).toHaveBeenCalledWith({
            dataItem: expect.objectContaining({
                resource: 'dataElements',
                id: 'de1',
            }),
        })
    })

    it('fetches the first legend set of an attribute cell value', async () => {
        const dataEngine = buildDataEngine({
            dataItem: { legendSets: [heightBands] },
        })

        await expect(
            fetchPivotTableLegendSet({
                visualization: buildVisualization({
                    legend: byDataItem,
                    value: { id: 'attr1' },
                }),
                metadataStore,
                dataEngine,
            })
        ).resolves.toEqual(heightBands)
        expect(dataEngine.query).toHaveBeenCalledWith({
            dataItem: expect.objectContaining({
                resource: 'trackedEntityAttributes',
                id: 'attr1',
            }),
        })
    })

    it('returns nothing for a cell value without legend sets', async () => {
        const dataEngine = buildDataEngine({ dataItem: { legendSets: [] } })

        await expect(
            fetchPivotTableLegendSet({
                visualization: buildVisualization({
                    legend: byDataItem,
                    value: { id: 'de1', programStage: { id: 'stage1' } },
                }),
                metadataStore,
                dataEngine,
            })
        ).resolves.toBeUndefined()
    })

    it('makes no request for the BY_DATA_ITEM strategy without a cell value', async () => {
        const dataEngine = buildDataEngine({})

        await expect(
            fetchPivotTableLegendSet({
                visualization: buildVisualization({ legend: byDataItem }),
                metadataStore,
                dataEngine,
            })
        ).resolves.toBeUndefined()
        expect(dataEngine.query).not.toHaveBeenCalled()
    })

    it('makes no request without a legend', async () => {
        const dataEngine = buildDataEngine({})

        await expect(
            fetchPivotTableLegendSet({
                visualization: buildVisualization({
                    value: { id: 'de1', programStage: { id: 'stage1' } },
                }),
                metadataStore,
                dataEngine,
            })
        ).resolves.toBeUndefined()
        expect(dataEngine.query).not.toHaveBeenCalled()
    })
})

describe('getPivotTableEngineLegend', () => {
    const legendSet = { id: 'ls2', name: 'Height bands', legends: [] }

    it('hands the resolved legend set to the engine as a fixed one', () => {
        expect(
            getPivotTableEngineLegend(
                {
                    strategy: 'BY_DATA_ITEM',
                    style: 'TEXT',
                    showKey: true,
                } as CurrentVisualization['legend'],
                legendSet
            )
        ).toEqual({
            strategy: 'FIXED',
            style: 'TEXT',
            showKey: true,
            set: { id: 'ls2', displayName: 'Height bands' },
        })
    })

    it('keeps the legend as it is without a resolved legend set', () => {
        const legend = {
            strategy: 'BY_DATA_ITEM',
            style: 'FILL',
        } as CurrentVisualization['legend']

        expect(getPivotTableEngineLegend(legend, undefined)).toBe(legend)
    })

    it('adds no legend to a visualization without one', () => {
        expect(getPivotTableEngineLegend(undefined, legendSet)).toBeUndefined()
    })
})
