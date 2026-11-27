import {
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
    setVisUiConfigItemsByDimension,
    setVisUiConfigLayout,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { VisualizationTypeSelector } from '../visualization-type-selector'

const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByTestId('visualization-type-selector-button'))
}

const switchToPivotTable = async (user: ReturnType<typeof userEvent.setup>) => {
    await openDropdown(user)
    await user.click(
        within(
            screen.getByTestId('visualization-type-selector-list')
        ).getByText('Pivot table')
    )
}

const stage = {
    id: 's1',
    name: 'Stage 1',
    repeatable: false,
    hideDueDate: false,
    program: { id: 'p1' },
}

const program = {
    id: 'p1',
    name: 'Program 1',
    programType: 'WITHOUT_REGISTRATION',
    programStages: [stage],
}

const eventDate = {
    id: 's1.eventDate',
    name: 'Event date',
    dimensionId: 'eventDate',
    dimensionType: 'PERIOD' as const,
    programId: 'p1',
    programStageId: 's1',
}

const eventOu = {
    id: 's1.ou',
    name: 'Event org. unit',
    dimensionId: 'ou',
    dimensionType: 'ORGANISATION_UNIT' as const,
    programId: 'p1',
    programStageId: 's1',
}

const numericDataElement = {
    id: 'numericDe',
    name: 'Numeric DE',
    dimensionId: 'numericDe',
    dimensionType: 'DATA_ELEMENT' as const,
    valueType: 'NUMBER' as const,
}

const programIndicator = {
    id: 'pi',
    name: 'My PI',
    dimensionId: 'pi',
    dimensionType: 'PROGRAM_INDICATOR' as const,
}

const createdBy = {
    id: 'createdBy',
    name: 'Created by',
    dimensionId: 'createdBy',
    dimensionType: 'USER' as const,
}

const lastUpdatedBy = {
    id: 'lastUpdatedBy',
    name: 'Last updated by',
    dimensionId: 'lastUpdatedBy',
    dimensionType: 'USER' as const,
}

describe('VisualizationTypeSelector', () => {
    it('renders the Line list item by default', async () => {
        await renderWithAppWrapper(<VisualizationTypeSelector />)

        expect(screen.getByText('Line list')).toBeInTheDocument()
    })

    it('opens the dropdown on click', async () => {
        const user = userEvent.setup()

        await renderWithAppWrapper(<VisualizationTypeSelector />)

        await openDropdown(user)

        const modal = screen.getByTestId('visualization-type-selector-list')
        expect(modal).toBeInTheDocument()
        expect(within(modal).getByText('Line list')).toBeInTheDocument()
        expect(within(modal).getByText('Pivot table')).toBeInTheDocument()
        expect(within(modal).getByText('Column')).toBeInTheDocument()
        expect(within(modal).getByText('Bar')).toBeInTheDocument()
        expect(within(modal).getByText('Line')).toBeInTheDocument()
        expect(within(modal).getByText('Area')).toBeInTheDocument()
    })

    it('changes vis type directly when nothing is discarded', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: { numericDe: numericDataElement },
            }
        )

        act(() => {
            store.dispatch(
                setVisUiConfigLayout({
                    columns: ['numericDe'],
                    rows: [],
                    filters: [],
                })
            )
        })

        await openDropdown(user)
        await user.click(
            within(
                screen.getByTestId('visualization-type-selector-list')
            ).getByText('Pivot table')
        )

        expect(
            screen.queryByTestId('conversion-confirmation-modal')
        ).not.toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'PIVOT_TABLE'
        )
        expect(getVisUiConfigLayout(store.getState())).toEqual({
            columns: [],
            rows: [],
            filters: ['numericDe'],
        })
    })

    it('opens the confirmation modal when dimensions would be discarded, applies on Convert', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: {
                    numericDe: numericDataElement,
                    pi: programIndicator,
                },
            }
        )

        act(() => {
            store.dispatch(
                setVisUiConfigLayout({
                    columns: ['pi', 'numericDe'],
                    rows: [],
                    filters: [],
                })
            )
        })

        await openDropdown(user)
        await user.click(
            within(
                screen.getByTestId('visualization-type-selector-list')
            ).getByText('Pivot table')
        )

        const modal = await screen.findByTestId('conversion-confirmation-modal')
        expect(
            within(modal).getByText(
                'My PI will be removed from the layout because program indicators are not supported in pivot tables.'
            )
        ).toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'LINE_LIST'
        )

        await user.click(within(modal).getByText('Convert'))

        expect(
            screen.queryByTestId('conversion-confirmation-modal')
        ).not.toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'PIVOT_TABLE'
        )
        expect(getVisUiConfigLayout(store.getState())).toEqual({
            columns: [],
            rows: [],
            filters: ['numericDe'],
        })
    })

    it('lists text dimensions and program indicators in separate paragraphs', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: {
                    numericDe: numericDataElement,
                    pi: programIndicator,
                    createdBy,
                    lastUpdatedBy,
                },
            }
        )

        act(() => {
            store.dispatch(
                setVisUiConfigLayout({
                    columns: ['createdBy', 'pi', 'numericDe'],
                    rows: [],
                    filters: ['lastUpdatedBy'],
                })
            )
        })

        await switchToPivotTable(user)

        const modal = await screen.findByTestId('conversion-confirmation-modal')
        expect(
            within(modal).getByText(
                'My PI will be removed from the layout because program indicators are not supported in pivot tables.'
            )
        ).toBeInTheDocument()
        expect(
            within(modal).getByText(
                'Last updated by and Created by will be removed from the layout because they are not supported in pivot tables.'
            )
        ).toBeInTheDocument()

        await user.click(within(modal).getByText('Convert'))

        expect(getVisUiConfigLayout(store.getState())).toEqual({
            columns: [],
            rows: [],
            filters: ['numericDe'],
        })
    })

    it('uses the singular for one discarded text dimension', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: { numericDe: numericDataElement, createdBy },
            }
        )

        act(() => {
            store.dispatch(
                setVisUiConfigLayout({
                    columns: ['createdBy', 'numericDe'],
                    rows: [],
                    filters: [],
                })
            )
        })

        await switchToPivotTable(user)

        const modal = await screen.findByTestId('conversion-confirmation-modal')
        expect(
            within(modal).getByText(
                'Created by will be removed from the layout because it is not supported in pivot tables.'
            )
        ).toBeInTheDocument()
        expect(
            within(modal).queryByText(/program indicators/)
        ).not.toBeInTheDocument()
    })

    it('leaves state unchanged when the confirmation modal is cancelled', async () => {
        const user = userEvent.setup()

        const { store } = await renderWithAppWrapper(
            <VisualizationTypeSelector />,
            {
                metadata: {
                    numericDe: numericDataElement,
                    pi: programIndicator,
                },
            }
        )

        const initialLayout = {
            columns: ['pi', 'numericDe'],
            rows: [],
            filters: [],
        }
        act(() => {
            store.dispatch(setVisUiConfigLayout(initialLayout))
        })

        await openDropdown(user)
        await user.click(
            within(
                screen.getByTestId('visualization-type-selector-list')
            ).getByText('Pivot table')
        )

        const modal = await screen.findByTestId('conversion-confirmation-modal')
        await user.click(within(modal).getByText('Cancel'))

        expect(
            screen.queryByTestId('conversion-confirmation-modal')
        ).not.toBeInTheDocument()
        expect(getVisUiConfigVisualizationType(store.getState())).toBe(
            'LINE_LIST'
        )
        expect(getVisUiConfigLayout(store.getState())).toEqual(initialLayout)
    })
    describe('empty period and org unit dimensions', () => {
        const render = async (
            layout: { columns: string[]; rows?: string[] },
            itemsByDimension: Record<string, string[]>
        ) => {
            const { store } = await renderWithAppWrapper(
                <VisualizationTypeSelector />,
                {
                    metadata: {
                        p1: program,
                        s1: stage,
                        's1.eventDate': eventDate,
                        's1.ou': eventOu,
                        pi: programIndicator,
                    },
                }
            )
            act(() => {
                store.dispatch(
                    setVisUiConfigLayout({ rows: [], filters: [], ...layout })
                )
                for (const [dimensionId, itemIds] of Object.entries(
                    itemsByDimension
                )) {
                    store.dispatch(
                        setVisUiConfigItemsByDimension({ dimensionId, itemIds })
                    )
                }
            })
            return { store }
        }

        it('fills empty period and org unit dimensions with defaults on confirm', async () => {
            const user = userEvent.setup()
            const { store } = await render(
                { columns: ['s1.ou', 's1.eventDate'] },
                { 's1.ou': [] }
            )

            await switchToPivotTable(user)

            const modal = await screen.findByTestId(
                'conversion-confirmation-modal'
            )
            expect(
                within(modal).getByText(
                    'Event org. unit and Event date have no items. In a pivot table every org unit and period dimension needs at least one item, so the default selection will be used: User organisation unit and Last 12 months.'
                )
            ).toBeInTheDocument()
            expect(
                within(modal).queryByText(/program indicators/)
            ).not.toBeInTheDocument()

            await user.click(
                within(modal).getByText('Use defaults and convert')
            )

            const { visUiConfig } = store.getState()
            expect(visUiConfig.visualizationType).toBe('PIVOT_TABLE')
            expect(visUiConfig.layout).toEqual({
                columns: ['s1.ou'],
                rows: ['s1.eventDate'],
                filters: [],
            })
            expect(visUiConfig.itemsByDimension['s1.ou']).toEqual([
                'USER_ORGUNIT',
            ])
            expect(visUiConfig.itemsByDimension['s1.eventDate']).toEqual([
                'LAST_12_MONTHS',
            ])
        })

        it('fills only the empty dimension', async () => {
            const user = userEvent.setup()
            const { store } = await render(
                { columns: ['s1.ou', 's1.eventDate'] },
                { 's1.ou': ['abc'] }
            )

            await switchToPivotTable(user)

            const modal = await screen.findByTestId(
                'conversion-confirmation-modal'
            )
            expect(
                within(modal).getByText(
                    'Event date has no items. In a pivot table every org unit and period dimension needs at least one item, so the default selection will be used: Last 12 months.'
                )
            ).toBeInTheDocument()

            await user.click(
                within(modal).getByText('Use defaults and convert')
            )

            const { itemsByDimension } = store.getState().visUiConfig
            expect(itemsByDimension['s1.ou']).toEqual(['abc'])
            expect(itemsByDimension['s1.eventDate']).toEqual(['LAST_12_MONTHS'])
        })

        it('shows both paragraphs when a program indicator is dropped and a dimension is empty', async () => {
            const user = userEvent.setup()
            const { store } = await render(
                { columns: ['pi', 's1.eventDate'] },
                {}
            )

            await switchToPivotTable(user)

            const modal = await screen.findByTestId(
                'conversion-confirmation-modal'
            )
            const programIndicatorText = within(modal).getByText(
                'My PI will be removed from the layout because program indicators are not supported in pivot tables.'
            )
            const emptyDimensionsText = within(modal).getByText(
                'Event date has no items. In a pivot table every org unit and period dimension needs at least one item, so the default selection will be used: Last 12 months.'
            )
            expect(
                programIndicatorText.compareDocumentPosition(
                    emptyDimensionsText
                ) & Node.DOCUMENT_POSITION_FOLLOWING
            ).toBeTruthy()

            await user.click(
                within(modal).getByText('Use defaults and convert')
            )

            const { visUiConfig } = store.getState()
            expect(visUiConfig.layout).toEqual({
                columns: [],
                rows: ['s1.eventDate'],
                filters: [],
            })
            expect(visUiConfig.itemsByDimension['s1.eventDate']).toEqual([
                'LAST_12_MONTHS',
            ])
        })

        it('leaves items unchanged when cancelled with empty dimensions', async () => {
            const user = userEvent.setup()
            const { store } = await render({ columns: ['s1.eventDate'] }, {})

            await switchToPivotTable(user)

            const modal = await screen.findByTestId(
                'conversion-confirmation-modal'
            )
            await user.click(within(modal).getByText('Cancel'))

            const { visUiConfig } = store.getState()
            expect(visUiConfig.visualizationType).toBe('LINE_LIST')
            expect(visUiConfig.itemsByDimension).not.toHaveProperty([
                's1.eventDate',
            ])
        })
    })
})
