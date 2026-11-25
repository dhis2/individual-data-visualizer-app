import { populatedVis } from '@components/layout-panel/bottom-bar/__fixtures__/unapplied-changes'
import { DiscardChangesModal } from '@components/shared/discard-changes/discard-changes-modal'
import { history } from '@modules/history'
import { setNavigationState } from '@store/navigation-slice'
import type { NavigationState } from '@store/navigation-slice'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RootState } from '@types'
import { expect, describe, it, beforeEach, afterEach } from 'vitest'
import { StoreToLocationSyncer } from '../store-to-location-syncer'

const navigationInitialState: NavigationState = {
    visualizationId: 'test-visualization',
    interpretationId: 'test-interpretation',
    pendingNavigation: null,
}

const renderSyncer = (preloadedState: Partial<RootState> = {}) =>
    renderWithAppWrapper(
        <>
            <StoreToLocationSyncer />
            <DiscardChangesModal />
        </>,
        {
            partialStore: {
                preloadedState: {
                    navigation: navigationInitialState,
                    ...preloadedState,
                },
            },
        }
    )

const getPath = () => history.location.pathname + history.location.search

describe('StoreToLocationSyncer', () => {
    beforeEach(() => {
        act(() => {
            history.push('/')
        })
    })

    afterEach(() => {
        act(() => {
            history.push('/')
        })
    })

    it('should dispatch setNavigationState on initial load', async () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        const { store } = await renderSyncer()

        const state = store.getState().navigation
        expect(state?.visualizationId).toBe('test-visualization')
        expect(state?.interpretationId).toBe('test-interpretation')
    })

    it('should update the state when the URL changes', async () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        const { store } = await renderSyncer()

        act(() => {
            history.push(
                '/new-visualization?interpretationId=new-interpretation'
            )
        })

        const state = store.getState().navigation
        expect(state?.visualizationId).toBe('new-visualization')
        expect(state?.interpretationId).toBe('new-interpretation')
    })

    it('ignore the interpretationId query param when on "/new" or "/"', async () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        const { store } = await renderSyncer()

        act(() => {
            history.push('/?interpretationId=test-interpretation')
        })
        const state1 = store.getState().navigation
        expect(state1?.visualizationId).toBe('new')
        expect(state1?.interpretationId).toBe(null)

        act(() => {
            history.push('/new?interpretationId=test-interpretation')
        })

        const state2 = store.getState().navigation
        expect(state2?.visualizationId).toBe('new')
        expect(state2?.interpretationId).toBe(null)
    })

    it('should update the URL when Redux state changes', async () => {
        const { store } = await renderSyncer()

        act(() => {
            store.dispatch(
                setNavigationState({
                    visualizationId: 'new-visualization',
                    interpretationId: 'new-interpretation',
                })
            )
        })

        const expectedPath =
            '/new-visualization?interpretationId=new-interpretation'
        expect(history.location.pathname + history.location.search).toBe(
            expectedPath
        )
    })

    it('should not update the URL if the visualizationId equals "new" and on path `/`', async () => {
        await renderSyncer({
            navigation: {
                visualizationId: 'new',
                interpretationId: null,
                pendingNavigation: null,
            },
        })

        expect(history.location.pathname).toBe('/')
    })

    it('should avoid duplicate actions for the same location', async () => {
        act(() => {
            history.push(
                '/test-visualization?interpretationId=test-interpretation'
            )
        })

        const { store } = await renderSyncer()

        // Push the same location again
        history.push('/test-visualization?interpretationId=test-interpretation')

        const state = store.getState().navigation
        expect(state?.visualizationId).toBe('test-visualization')
        expect(state?.interpretationId).toBe('test-interpretation')
    })

    describe('with unsaved changes', () => {
        const START_PATH =
            '/test-visualization?interpretationId=test-interpretation'

        const renderSyncerWithChanges = async () => {
            act(() => {
                history.push(START_PATH)
            })
            // A new visualization that was applied but never saved
            return renderSyncer({ currentVis: populatedVis })
        }

        it('asks before following the URL to another visualization', async () => {
            const { store } = await renderSyncerWithChanges()

            act(() => {
                history.push('/other-visualization')
            })

            expect(
                screen.getByTestId('discard-changes-modal')
            ).toBeInTheDocument()
            expect(store.getState().navigation.visualizationId).toBe(
                'test-visualization'
            )
        })

        it('opens the other visualization when the user confirms', async () => {
            const { store } = await renderSyncerWithChanges()

            act(() => {
                history.push('/other-visualization')
            })
            await userEvent.click(
                screen.getByTestId('discard-changes-modal-confirm')
            )

            expect(store.getState().navigation.visualizationId).toBe(
                'other-visualization'
            )
            expect(getPath()).toBe('/other-visualization')
        })

        it('puts the URL back when the user cancels', async () => {
            const { store } = await renderSyncerWithChanges()

            act(() => {
                history.push('/other-visualization')
            })
            await userEvent.click(
                screen.getByTestId('discard-changes-modal-cancel')
            )

            expect(
                screen.queryByTestId('discard-changes-modal')
            ).not.toBeInTheDocument()
            expect(store.getState().navigation.visualizationId).toBe(
                'test-visualization'
            )
            expect(getPath()).toBe(START_PATH)
        })

        it('follows the URL to another interpretation of the same visualization without asking', async () => {
            const { store } = await renderSyncerWithChanges()

            act(() => {
                history.push(
                    '/test-visualization?interpretationId=other-interpretation'
                )
            })

            expect(
                screen.queryByTestId('discard-changes-modal')
            ).not.toBeInTheDocument()
            expect(store.getState().navigation.interpretationId).toBe(
                'other-interpretation'
            )
        })
    })
})
