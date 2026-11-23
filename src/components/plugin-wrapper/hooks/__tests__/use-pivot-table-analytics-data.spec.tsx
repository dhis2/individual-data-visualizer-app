import { usePivotTableAnalyticsData } from '@components/plugin-wrapper/hooks/use-pivot-table-analytics-data'
import { Analytics } from '@dhis2/analytics'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { waitFor } from '@testing-library/react'
import type { CurrentVisualization, LegendOption } from '@types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const analyticsResponse = {
    headers: [
        { name: 'pe', column: 'Period', valueType: 'TEXT', meta: true },
        {
            name: 'ou',
            column: 'Organisation unit',
            valueType: 'TEXT',
            meta: true,
        },
        { name: 'value', column: 'Value', valueType: 'NUMBER', meta: false },
    ],
    metaData: {
        items: {
            ImspTQPwCqd: { name: 'Sierra Leone' },
            2026: { name: '2026' },
            pe: { name: 'Period' },
            ou: { name: 'Organisation unit' },
        },
        dimensions: { pe: ['2026'], ou: ['ImspTQPwCqd'] },
    },
    rows: [['2026', 'ImspTQPwCqd', '8005']],
    width: 3,
    height: 1,
    headerWidth: 3,
}

const legendSet = {
    id: 'ls1',
    name: 'Weight bands',
    legends: [
        {
            id: 'l1',
            name: 'Low',
            startValue: 0,
            endValue: 10000,
            color: '#f00',
        },
    ],
}

const buildVisualization = (legend?: LegendOption) =>
    ({
        type: 'PIVOT_TABLE',
        outputType: 'EVENT',
        programDimensions: [{ id: 'IpHINAT79UW' }],
        columns: [{ dimension: 'pe', items: [{ id: 'THIS_YEAR' }] }],
        rows: [{ dimension: 'ou', items: [{ id: 'ImspTQPwCqd' }] }],
        filters: [],
        legend,
    }) as unknown as CurrentVisualization

const renderAndFetch = async (visualization: CurrentVisualization) => {
    const legendSetsResolver = vi.fn(async () => ({
        legendSets: [legendSet],
    }))
    const { result } = await renderHookWithAppWrapper(
        () => usePivotTableAnalyticsData(),
        {
            queryData: {
                analytics: analyticsResponse,
                legendSets: legendSetsResolver,
            },
        }
    )

    await result.current[0]({
        visualization,
        displayProperty: 'name',
        onResponseReceived: vi.fn(),
    })
    await waitFor(() => {
        expect(result.current[1].data).not.toBeNull()
    })

    return { state: result.current[1], legendSetsResolver }
}

describe('usePivotTableAnalyticsData', () => {
    beforeEach(() => {
        /* Analytics.getAnalytics caches a singleton bound to the first data
         * engine it sees; reset it so each test's mock data provider is used. */
        ;(
            Analytics.getAnalytics as unknown as { analytics?: unknown }
        ).analytics = undefined
    })

    it('fetches the legend set chosen for the FIXED strategy', async () => {
        const { state } = await renderAndFetch(
            buildVisualization({
                strategy: 'FIXED',
                style: 'FILL',
                set: { id: 'ls1', displayName: 'Weight bands' },
            })
        )

        expect(state.legendSet).toEqual(legendSet)
    })

    it('fetches no legend sets without a legend', async () => {
        const { state, legendSetsResolver } =
            await renderAndFetch(buildVisualization())

        expect(state.legendSet).toBeUndefined()
        expect(legendSetsResolver).not.toHaveBeenCalled()
    })
})
