import { populatedVis } from '@components/layout-panel/bottom-bar/__fixtures__/unapplied-changes'
import { DiscardChangesModal } from '@components/shared/discard-changes/discard-changes-modal'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { ActionsBar } from '../actions-bar'

const OTHER_VISUALIZATION = {
    id: 'otherVisId',
    type: 'LINE_LIST',
    displayName: 'Other visualization',
    created: '2026-01-01T00:00:00.000',
    lastUpdated: '2026-01-01T00:00:00.000',
    user: { displayName: 'Someone' },
    access: { read: true },
}

const mockOptions = {
    queryData: {
        eventVisualizations: {
            eventVisualizations: [OTHER_VISUALIZATION],
            pager: { page: 1, pageCount: 1, total: 1, pageSize: 8 },
        },
    },
} as MockOptions

/* A new visualization that was applied but never saved */
const withChanges = { currentVis: populatedVis }

const renderActionsBar = (preloadedState: Partial<RootState> = {}) =>
    renderWithAppWrapper(
        <>
            <ActionsBar />
            <DiscardChangesModal />
        </>,
        {
            ...mockOptions,
            partialStore: {
                preloadedState: {
                    navigation: {
                        visualizationId: 'visId',
                        interpretationId: null,
                        pendingNavigation: null,
                    },
                    ...preloadedState,
                },
            },
        }
    )

const getVisualizationId = (store: { getState: () => RootState }) =>
    store.getState().navigation.visualizationId

describe('ActionsBar', () => {
    it('starts a new visualization right away when there are no changes', async () => {
        const { store } = await renderActionsBar()

        await userEvent.click(screen.getByTestId('new-button'))

        expect(
            screen.queryByTestId('discard-changes-modal')
        ).not.toBeInTheDocument()
        expect(getVisualizationId(store)).toBe('new')
    })

    it('asks before starting a new visualization from the New button', async () => {
        const { store } = await renderActionsBar(withChanges)

        await userEvent.click(screen.getByTestId('new-button'))

        expect(screen.getByTestId('discard-changes-modal')).toBeInTheDocument()
        expect(getVisualizationId(store)).toBe('visId')

        await userEvent.click(
            screen.getByTestId('discard-changes-modal-confirm')
        )

        expect(getVisualizationId(store)).toBe('new')
    })

    it('asks before starting a new visualization from File → New', async () => {
        const { store } = await renderActionsBar(withChanges)

        await userEvent.click(screen.getByText('File'))
        await userEvent.click(screen.getByTestId('file-menu-new'))

        expect(screen.getByTestId('discard-changes-modal')).toBeInTheDocument()
        expect(getVisualizationId(store)).toBe('visId')
    })

    it('asks before opening another visualization', async () => {
        const { store } = await renderActionsBar(withChanges)

        await userEvent.click(screen.getByTestId('open-button'))
        await userEvent.click(
            await screen.findByText(OTHER_VISUALIZATION.displayName)
        )

        expect(screen.getByTestId('discard-changes-modal')).toBeInTheDocument()
        expect(getVisualizationId(store)).toBe('visId')

        await userEvent.click(
            screen.getByTestId('discard-changes-modal-confirm')
        )

        expect(getVisualizationId(store)).toBe(OTHER_VISUALIZATION.id)
    })

    it('stays on the visualization when the user cancels', async () => {
        const { store } = await renderActionsBar(withChanges)

        await userEvent.click(screen.getByTestId('new-button'))
        await userEvent.click(
            screen.getByTestId('discard-changes-modal-cancel')
        )

        expect(
            screen.queryByTestId('discard-changes-modal')
        ).not.toBeInTheDocument()
        expect(getVisualizationId(store)).toBe('visId')
    })
})
