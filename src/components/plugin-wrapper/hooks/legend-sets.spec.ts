// eslint-disable-next-line no-restricted-imports
import type { useDataEngine } from '@dhis2/app-runtime'
import type { CurrentVisualization } from '@types'
import { describe, expect, it, vi } from 'vitest'
import { fetchLegendSets, getFixedLegendSetIds } from './legend-sets'

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
