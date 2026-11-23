import { Canvas } from '@components/canvas/canvas'
import analyticsResponse from '@components/plugin-wrapper/__fixtures__/analytics-response-1.json'
import eventVisualization1 from '@components/plugin-wrapper/__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import eventVisualization2 from '@components/plugin-wrapper/__fixtures__/inpatient-visit-overview-this-year-bonthe.json'
import { useToolbarActions } from '@components/toolbar/actions-bar/use-toolbar-actions'
import { isVisualizationEmpty } from '@modules/visualization/guards'
import { setCurrentVis } from '@store/current-vis-slice'
import { setNavigationState } from '@store/navigation-slice'
import type { AppStore } from '@store/store'
import { tLoadSavedVisualization } from '@store/thunks'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CurrentVisualization } from '@types'
import { beforeEach, describe, expect, it } from 'vitest'

const visualization1Id = 'TIuOzZ0ID0V'
const visualization2Id = 'waPjzoJyIQ9'

const analyticsPageSizes: number[] = []

const mockOptions = {
    queryData: {
        analytics: (_: unknown, query: { params: { pageSize: number } }) => {
            analyticsPageSizes.push(query.params.pageSize)
            return analyticsResponse
        },
        dataStatistics: {},
        'dataStatistics/favorites': [],
        eventVisualizations: (type: string, query: { id?: string }) => {
            if (type === 'create') {
                return { response: { uid: visualization1Id } }
            }
            return query.id === visualization1Id
                ? eventVisualization1
                : eventVisualization2
        },
    } as unknown,
} as MockOptions

let saveAs: ReturnType<typeof useToolbarActions>['onSaveAs']

const CanvasWithSaveAs = () => {
    saveAs = useToolbarActions().onSaveAs
    return <Canvas />
}

const setUpCanvas = async () => {
    const { store } = await renderWithAppWrapper(
        <CanvasWithSaveAs />,
        mockOptions
    )
    return store as AppStore
}

const waitForRequestCount = (count: number) =>
    waitFor(() => expect(analyticsPageSizes).toHaveLength(count))

const openVisualization = async (store: AppStore, id: string) => {
    const requestCount = analyticsPageSizes.length
    act(() => {
        store.dispatch(setNavigationState({ visualizationId: id }))
    })
    await waitForRequestCount(requestCount + 1)
    await screen.findByTestId('line-list-data-table')
}

const getLoadedVis = (store: AppStore) => {
    const currentVis = store.getState().currentVis
    if (isVisualizationEmpty(currentVis)) {
        throw new Error('expected a loaded visualization')
    }
    return currentVis
}

const showVis = (store: AppStore, visualization: CurrentVisualization) =>
    act(() => {
        store.dispatch(setCurrentVis(visualization))
    })

const choosePageSize50 = async (user: ReturnType<typeof userEvent.setup>) => {
    const requestCount = analyticsPageSizes.length
    await user.click(screen.getByTestId('pagination-options'))
    await user.click(screen.getByTestId('dhis2-uicore-select-input'))
    await user.click(
        screen.getByText('50', {
            selector: '[data-test="dhis2-uicore-singleselectoption"] *',
        })
    )
    await waitForRequestCount(requestCount + 1)
    expect(analyticsPageSizes.at(-1)).toBe(50)
}

describe('Canvas', () => {
    beforeEach(() => {
        analyticsPageSizes.length = 0
    })

    it('uses the default page size for another visualization', async () => {
        const user = userEvent.setup()
        const store = await setUpCanvas()
        await openVisualization(store, visualization1Id)
        await choosePageSize50(user)

        await openVisualization(store, visualization2Id)

        expect(analyticsPageSizes.at(-1)).toBe(100)
    })

    it('uses the default page size for a new visualization', async () => {
        const user = userEvent.setup()
        const store = await setUpCanvas()
        await openVisualization(store, visualization1Id)
        const unsavedVis = { ...getLoadedVis(store) }
        delete unsavedVis.id
        act(() => {
            store.dispatch(setNavigationState({ visualizationId: 'new' }))
        })
        showVis(store, unsavedVis)
        await screen.findByTestId('line-list-data-table')
        await choosePageSize50(user)

        act(() => {
            store.dispatch(setNavigationState({ visualizationId: 'new' }))
        })
        await screen.findByTestId('start-screen')
        const requestCount = analyticsPageSizes.length
        showVis(store, unsavedVis)

        await waitForRequestCount(requestCount + 1)
        expect(analyticsPageSizes.at(-1)).toBe(100)
    })

    it('uses the default page size after switching the vis type', async () => {
        const user = userEvent.setup()
        const store = await setUpCanvas()
        await openVisualization(store, visualization1Id)
        await choosePageSize50(user)
        const lineList = getLoadedVis(store)

        showVis(store, { ...lineList, type: 'PIVOT_TABLE' })
        const requestCount = analyticsPageSizes.length
        showVis(store, lineList)

        await waitForRequestCount(requestCount + 1)
        expect(analyticsPageSizes.at(-1)).toBe(100)
    })

    it('keeps the page size when the visualization reloads after saving', async () => {
        const user = userEvent.setup()
        const store = await setUpCanvas()
        await openVisualization(store, visualization1Id)
        await choosePageSize50(user)
        const requestCount = analyticsPageSizes.length

        await act(() =>
            store.dispatch(tLoadSavedVisualization({ id: visualization1Id }))
        )

        await waitForRequestCount(requestCount + 1)
        expect(analyticsPageSizes.at(-1)).toBe(50)
    })

    it('keeps the page size when a new visualization is saved', async () => {
        const user = userEvent.setup()
        const store = await setUpCanvas()
        await openVisualization(store, visualization1Id)
        const unsavedVis = { ...getLoadedVis(store) }
        delete unsavedVis.id
        act(() => {
            store.dispatch(setNavigationState({ visualizationId: 'new' }))
        })
        showVis(store, unsavedVis)
        await screen.findByTestId('line-list-data-table')
        await choosePageSize50(user)
        const requestCount = analyticsPageSizes.length

        await act(() => saveAs({ name: 'Saved', description: '' }))

        await waitFor(() =>
            expect(store.getState().navigation.visualizationId).toBe(
                visualization1Id
            )
        )
        await waitForRequestCount(requestCount + 1)
        expect(analyticsPageSizes.at(-1)).toBe(50)
    })
})
