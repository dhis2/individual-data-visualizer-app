import { UpdateButton } from '@components/shared/update-button'
import { visTypeDisplayNames } from '@dhis2/analytics'
import {
    initialState as visUiConfigInitialState,
    type VisUiConfigState,
} from '@store/vis-ui-config-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { OutputType, RootState, VisualizationType } from '@types'
import { describe, it, expect, vi } from 'vitest'

const metadata = {
    de: {
        id: 'de',
        name: 'Data element',
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
    lastUpdated: {
        id: 'lastUpdated',
        name: 'Last updated on',
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    ou: {
        id: 'ou',
        name: 'Organisation unit',
        dimensionType: 'ORGANISATION_UNIT',
        valueType: 'ORGANISATION_UNIT',
    },
}

const completeSelection: Partial<VisUiConfigState> = {
    layout: { columns: ['de'], rows: [], filters: ['lastUpdated', 'ou'] },
    itemsByDimension: {
        lastUpdated: ['LAST_12_MONTHS'],
        ou: ['USER_ORGUNIT'],
    },
}

const selectionWithoutPeriod: Partial<VisUiConfigState> = {
    layout: { columns: ['de'], rows: [], filters: ['ou'] },
    itemsByDimension: { ou: ['USER_ORGUNIT'] },
}

const emptyVis: RootState['currentVis'] = {}
const populatedVis = { type: 'PIVOT_TABLE' } as RootState['currentVis']

const buildMockOptions = (
    currentVis: RootState['currentVis'],
    {
        visualizationType = 'PIVOT_TABLE',
        outputType = 'EVENT',
        selection = completeSelection,
    }: {
        visualizationType?: VisualizationType
        outputType?: OutputType
        selection?: Partial<VisUiConfigState>
    } = {}
) => ({
    metadata,
    partialStore: {
        preloadedState: {
            currentVis,
            visUiConfig: {
                ...visUiConfigInitialState,
                ...selection,
                visualizationType,
                outputType,
            },
        } as Partial<RootState>,
    },
})

describe('UpdateButton', () => {
    it('renders an enabled primary button that calls onClick when the visualization is populated', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()

        await renderWithAppWrapper(
            <UpdateButton onClick={onClick} />,
            buildMockOptions(populatedVis)
        )

        const button = screen.getByRole('button', { name: 'Update' })
        expect(button).toBeEnabled()

        await user.click(button)
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('disables the button and shows the create tooltip when the visualization is empty', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()

        await renderWithAppWrapper(
            <UpdateButton onClick={onClick} />,
            buildMockOptions(emptyVis)
        )

        const button = screen.getByRole('button', { name: 'Update' })
        expect(button).toBeDisabled()

        await user.hover(button)
        await expect(
            screen.findByText(
                `Create a ${visTypeDisplayNames['PIVOT_TABLE']} before updating`
            )
        ).resolves.toBeInTheDocument()

        await user.click(button)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('names the visualization type in the tooltip', async () => {
        const user = userEvent.setup()

        await renderWithAppWrapper(
            <UpdateButton onClick={vi.fn()} />,
            buildMockOptions(emptyVis, { visualizationType: 'LINE_LIST' })
        )

        await user.hover(screen.getByRole('button', { name: 'Update' }))
        await expect(
            screen.findByText(
                `Create a ${visTypeDisplayNames['LINE_LIST']} before updating`
            )
        ).resolves.toBeInTheDocument()
    })

    it('keeps the create tooltip for an empty visualization with an incomplete selection', async () => {
        const user = userEvent.setup()

        await renderWithAppWrapper(
            <UpdateButton onClick={vi.fn()} />,
            buildMockOptions(emptyVis, { selection: selectionWithoutPeriod })
        )

        await user.hover(screen.getByRole('button', { name: 'Update' }))
        await expect(
            screen.findByText(
                `Create a ${visTypeDisplayNames['PIVOT_TABLE']} before updating`
            )
        ).resolves.toBeInTheDocument()
    })

    it('disables the button and explains why when the layout has no period', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()

        await renderWithAppWrapper(
            <UpdateButton onClick={onClick} />,
            buildMockOptions(populatedVis, {
                selection: selectionWithoutPeriod,
            })
        )

        const button = screen.getByRole('button', { name: 'Update' })
        expect(button).toBeDisabled()

        await user.hover(button)
        await expect(
            screen.findByText('Select at least one period')
        ).resolves.toBeInTheDocument()

        await user.click(button)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('disables the button and shows the create tooltip when the pivot table has a tracked entity output type', async () => {
        const user = userEvent.setup()
        const onClick = vi.fn()

        await renderWithAppWrapper(
            <UpdateButton onClick={onClick} />,
            buildMockOptions(populatedVis, {
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        )

        const button = screen.getByRole('button', { name: 'Update' })
        expect(button).toBeDisabled()

        await user.hover(button)
        await expect(
            screen.findByText(
                `Create a ${visTypeDisplayNames['PIVOT_TABLE']} before updating`
            )
        ).resolves.toBeInTheDocument()

        await user.click(button)
        expect(onClick).not.toHaveBeenCalled()
    })

    it('enables the button for a line list with a tracked entity output type', async () => {
        await renderWithAppWrapper(
            <UpdateButton onClick={vi.fn()} />,
            buildMockOptions(populatedVis, {
                visualizationType: 'LINE_LIST',
                outputType: 'TRACKED_ENTITY_INSTANCE',
            })
        )

        expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    })

    it('submits the associated form when used as a submit button', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn((e) => e.preventDefault())

        await renderWithAppWrapper(
            <form id="test-form" onSubmit={onSubmit}>
                <UpdateButton type="submit" form="test-form" />
            </form>,
            buildMockOptions(populatedVis)
        )

        await user.click(screen.getByRole('button', { name: 'Update' }))
        expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it('does not submit the form when blocked', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn((e) => e.preventDefault())

        await renderWithAppWrapper(
            <form id="test-form" onSubmit={onSubmit}>
                <input aria-label="Field" type="text" />
                <UpdateButton type="submit" form="test-form" />
            </form>,
            buildMockOptions(populatedVis, {
                selection: selectionWithoutPeriod,
            })
        )

        await user.type(screen.getByLabelText('Field'), 'a{Enter}')
        expect(onSubmit).not.toHaveBeenCalled()
    })
})
