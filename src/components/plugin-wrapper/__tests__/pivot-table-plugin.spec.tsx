import { MockMetadataProvider } from '@components/app-wrapper/metadata-provider/metadata-provider'
import { PivotTablePlugin } from '@components/plugin-wrapper/pivot-table-plugin'
import { render, screen } from '@testing-library/react'
import type { CurrentVisualization } from '@types'
import { describe, expect, it, vi } from 'vitest'

/* The engine renders the filter row and fixes the headers itself, so the only
 * thing this app controls is the props. Stubbing the table keeps the
 * assertions on those. */
vi.mock('@dhis2/analytics', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    PivotTable: ({
        filterText,
        legendSets,
        visualization,
    }: {
        filterText?: string
        legendSets?: { id: string }[]
        visualization: CurrentVisualization
    }) => (
        <div
            data-test="pivot-table"
            data-filter-text={filterText}
            data-legend-set-ids={legendSets?.map(({ id }) => id).join(',')}
            data-fix-column-headers={visualization.fixColumnHeaders}
            data-fix-row-headers={visualization.fixRowHeaders}
            data-legend-strategy={visualization.legend?.strategy}
            data-legend-set-id={visualization.legend?.set?.id}
            data-filter-dimensions={visualization.filters
                .map(({ dimension }) => dimension)
                .join(',')}
        />
    ),
}))

vi.mock(
    '@components/app-wrapper/cached-data/app-cached-data-provider',
    async (importOriginal) => ({
        ...(await importOriginal<object>()),
        useAppCachedData: (
            await import('@test-utils/cached-data-stub')
        ).stubAppCachedData(),
    })
)

vi.mock(
    '@components/plugin-wrapper/hooks/use-pivot-table-analytics-data',
    () => ({
        usePivotTableAnalyticsData: () => [
            vi.fn(),
            {
                isFetching: false,
                data: { headers: [], rows: [], metaData: {} },
                legendSet: { id: 'ls1', name: 'Weight bands', legends: [] },
            },
        ],
    })
)

const visualization = {
    type: 'PIVOT_TABLE',
    outputType: 'EVENT',
    columns: [],
    rows: [],
    filters: [],
} as unknown as CurrentVisualization

describe('PivotTablePlugin', () => {
    it('hands the filter text to the pivot table', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={visualization}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                    filterText="Gender: Female"
                />
            </MockMetadataProvider>
        )

        expect(screen.getByTestId('pivot-table')).toHaveAttribute(
            'data-filter-text',
            'Gender: Female'
        )
    })

    it('hands the fixed header options to the pivot table', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={{
                        ...visualization,
                        fixColumnHeaders: true,
                        fixRowHeaders: false,
                    }}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                />
            </MockMetadataProvider>
        )

        const pivotTable = screen.getByTestId('pivot-table')
        expect(pivotTable).toHaveAttribute('data-fix-column-headers', 'true')
        expect(pivotTable).toHaveAttribute('data-fix-row-headers', 'false')
    })

    it('passes no filter text when there is none', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={visualization}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                />
            </MockMetadataProvider>
        )

        expect(screen.getByTestId('pivot-table')).not.toHaveAttribute(
            'data-filter-text'
        )
    })

    it('hands only the filters with a selection to the pivot table', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={{
                        ...visualization,
                        filters: [
                            { dimension: 'pe', items: [{ id: 'THIS_YEAR' }] },
                            { dimension: 'programStatus', items: [] },
                        ],
                    }}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                />
            </MockMetadataProvider>
        )

        expect(screen.getByTestId('pivot-table')).toHaveAttribute(
            'data-filter-dimensions',
            'pe'
        )
    })

    it('hands no filters to the pivot table when none has a selection', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={{
                        ...visualization,
                        filters: [{ dimension: 'programStatus', items: [] }],
                    }}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                />
            </MockMetadataProvider>
        )

        expect(screen.getByTestId('pivot-table')).toHaveAttribute(
            'data-filter-dimensions',
            ''
        )
    })

    it('hands the fetched legend set to the pivot table', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={visualization}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                />
            </MockMetadataProvider>
        )

        expect(screen.getByTestId('pivot-table')).toHaveAttribute(
            'data-legend-set-ids',
            'ls1'
        )
    })

    it('hands the fetched legend set to the pivot table as a fixed one', () => {
        render(
            <MockMetadataProvider>
                <PivotTablePlugin
                    displayProperty="name"
                    visualization={{
                        ...visualization,
                        legend: {
                            strategy: 'BY_DATA_ITEM',
                            style: 'FILL',
                        } as CurrentVisualization['legend'],
                    }}
                    isInDashboard={false}
                    isInModal={false}
                    onResponseReceived={vi.fn()}
                />
            </MockMetadataProvider>
        )

        const pivotTable = screen.getByTestId('pivot-table')
        expect(pivotTable).toHaveAttribute('data-legend-strategy', 'FIXED')
        expect(pivotTable).toHaveAttribute('data-legend-set-id', 'ls1')
    })

    describe('legend key', () => {
        const renderWithLegend = ({
            showKey,
            isInDashboard = false,
        }: {
            showKey: boolean
            isInDashboard?: boolean
        }) =>
            render(
                <MockMetadataProvider>
                    <PivotTablePlugin
                        displayProperty="name"
                        visualization={{
                            ...visualization,
                            legend: {
                                strategy: 'BY_DATA_ITEM',
                                style: 'FILL',
                                showKey,
                            } as CurrentVisualization['legend'],
                        }}
                        isInDashboard={isInDashboard}
                        isInModal={false}
                        onResponseReceived={vi.fn()}
                    />
                </MockMetadataProvider>
            )

        it('shows the legend key when the option is on', () => {
            renderWithLegend({ showKey: true })

            expect(
                screen.getByTestId('visualization-legend-key')
            ).toBeInTheDocument()
        })

        it('hides the legend key when the option is off', () => {
            renderWithLegend({ showKey: false })

            expect(
                screen.queryByTestId('visualization-legend-key')
            ).not.toBeInTheDocument()
        })

        it('offers a toggle for the legend key on a dashboard', () => {
            renderWithLegend({ showKey: false, isInDashboard: true })

            expect(screen.getByTestId('legend-key-toggler')).toBeInTheDocument()
            expect(
                screen.queryByTestId('visualization-legend-key')
            ).not.toBeInTheDocument()
        })
    })
})
