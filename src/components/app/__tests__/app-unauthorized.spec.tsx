import { Canvas } from '@components/canvas/canvas'
import analyticsResponse1 from '@components/plugin-wrapper/__fixtures__/analytics-response-1.json'
import eventVisualization1 from '@components/plugin-wrapper/__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { FetchError } from '@dhis2/app-runtime'
import { setNavigationState } from '@store/navigation-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { suppressWindowError } from '@test-utils/suppress-window-error'
import { act, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AppErrorBoundary } from '../app-error-boundary'

const eventVisualization1Id = 'TIuOzZ0ID0V'

const unauthorized = () => {
    throw new FetchError({
        type: 'access',
        message: 'Unauthorized',
        details: { httpStatusCode: 401 },
    })
}

const renderApp = async (queryData: Record<string, unknown>) => {
    const { store } = await renderWithAppWrapper(
        <AppErrorBoundary>
            <div>rest of the app</div>
            <Canvas />
        </AppErrorBoundary>,
        {
            queryData: { dataStatistics: {}, ...queryData } as unknown,
        } as MockOptions
    )

    act(() => {
        store.dispatch(
            setNavigationState({ visualizationId: eventVisualization1Id })
        )
    })
}

const expectFullAppLoggedOutScreen = async () => {
    await waitFor(() => {
        expect(screen.getByTestId('app-error')).toHaveTextContent('Logged out')
    })
    expect(screen.queryByText('rest of the app')).not.toBeInTheDocument()
}

describe('a 401 in the app', () => {
    it(
        'shows the logged out screen over the whole app for the analytics request',
        suppressWindowError('Unauthorized', async () => {
            await renderApp({
                analytics: unauthorized,
                eventVisualizations: () => eventVisualization1,
            })

            await expectFullAppLoggedOutScreen()
        })
    )

    it(
        'shows the logged out screen over the whole app for a request outside the canvas',
        suppressWindowError('Unauthorized', async () => {
            await renderApp({
                analytics: () => analyticsResponse1,
                eventVisualizations: unauthorized,
            })

            await expectFullAppLoggedOutScreen()
        })
    )
})
