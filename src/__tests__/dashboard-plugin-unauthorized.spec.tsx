import analyticsResponse1 from '@components/plugin-wrapper/__fixtures__/analytics-response-1.json'
import eventVisualization1 from '@components/plugin-wrapper/__fixtures__/inpatient-cases-5-to-15-years-this-year.json'
import { CustomDataProvider, FetchError } from '@dhis2/app-runtime'
import { UserProvider } from '@dhis2/app-service-user'
import meData from '@test-utils/__fixtures__/me.json'
import { suppressWindowError } from '@test-utils/suppress-window-error'
import { render, screen } from '@testing-library/react'
import type { DashboardPluginProps } from '@types'
import { describe, it, expect, vi } from 'vitest'
import DashboardPlugin from '../dashboard-plugin'

vi.mock('@dhis2/analytics', async (importOriginal) => {
    const { stubCachedData } = await import('@test-utils/cached-data-stub')
    return {
        ...(await importOriginal<object>()),
        DashboardPluginWrapper: ({
            children,
        }: {
            children: (props: object) => unknown
        }) => children({ displayProperty: 'name' }),
        useRelativePeriodsNames: () => ({
            ...stubCachedData(),
            loading: false,
            error: null,
        }),
    }
})

const unauthorized = () => {
    throw new FetchError({
        type: 'access',
        message: 'Unauthorized',
        details: { httpStatusCode: 401 },
    })
}

const renderDashboardPlugin = (data: Record<string, unknown>) =>
    render(
        <CustomDataProvider
            data={{ dataStatistics: {}, ...data } as never}
            options={{ loadForever: false }}
        >
            <UserProvider userInfo={meData}>
                <DashboardPlugin
                    {...({
                        visualizationId: eventVisualization1.id,
                        displayProperty: 'name',
                    } as DashboardPluginProps)}
                />
            </UserProvider>
        </CustomDataProvider>
    )

describe('a 401 in the dashboard plugin', () => {
    it(
        'shows the logged out screen for the analytics request',
        suppressWindowError('Unauthorized', async () => {
            renderDashboardPlugin({
                eventVisualizations: () => eventVisualization1,
                analytics: unauthorized,
            })

            expect(await screen.findByText('Logged out')).toBeInTheDocument()
        })
    )

    it(
        'shows the logged out screen for the visualization request',
        suppressWindowError('Unauthorized', async () => {
            renderDashboardPlugin({
                eventVisualizations: unauthorized,
                analytics: () => analyticsResponse1,
            })

            expect(await screen.findByText('Logged out')).toBeInTheDocument()
        })
    )
})
