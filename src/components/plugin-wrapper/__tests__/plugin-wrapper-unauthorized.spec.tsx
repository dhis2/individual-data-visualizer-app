import type { EngineError } from '@api/parse-engine-error'
import { FetchError } from '@dhis2/app-runtime'
import { useCurrentUser, useAppSelector } from '@hooks'
import { getCurrentVis } from '@store/current-vis-slice'
import { getIsVisualizationLoading } from '@store/loader-slice'
import { setNavigationState } from '@store/navigation-slice'
import { renderWithAppWrapper, type MockOptions } from '@test-utils/app-wrapper'
import { suppressWindowError } from '@test-utils/suppress-window-error'
import { act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import eventVisualization1 from '../__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { PluginWrapper } from '../plugin-wrapper'

const eventVisualization1Id = 'TIuOzZ0ID0V'

const TestComponent = ({
    onUnauthorizedError,
}: {
    onUnauthorizedError: (error: EngineError) => void
}) => {
    const currentUser = useCurrentUser()
    const currentVis = useAppSelector(getCurrentVis)
    const isVisualizationLoading = useAppSelector(getIsVisualizationLoading)

    return (
        <PluginWrapper
            isVisualizationLoading={isVisualizationLoading}
            visualization={currentVis}
            displayProperty={currentUser.settings.displayProperty}
            onUnauthorizedError={onUnauthorizedError}
        />
    )
}

const renderWithUnauthorizedAnalytics = async (
    onUnauthorizedError: (error: EngineError) => void
) => {
    const options = {
        queryData: {
            analytics: () => {
                throw new FetchError({
                    type: 'access',
                    message: 'failed',
                    details: { httpStatusCode: 401 },
                })
            },
            dataStatistics: {},
            eventVisualizations: async (_: unknown, query: { id?: string }) =>
                query.id === eventVisualization1Id
                    ? eventVisualization1
                    : undefined,
        } as unknown,
    } as MockOptions

    const { store } = await renderWithAppWrapper(
        <TestComponent onUnauthorizedError={onUnauthorizedError} />,
        options
    )

    act(() => {
        store.dispatch(
            setNavigationState({ visualizationId: eventVisualization1Id })
        )
    })
}

describe('PluginWrapper unauthorized analytics error', () => {
    it(
        'reports a 401 through onUnauthorizedError',
        suppressWindowError('failed', async () => {
            const onUnauthorizedError = vi.fn()

            await renderWithUnauthorizedAnalytics(onUnauthorizedError)

            await waitFor(() => {
                expect(onUnauthorizedError).toHaveBeenCalledWith(
                    expect.objectContaining({ httpStatusCode: 401 })
                )
            })
        })
    )
})
