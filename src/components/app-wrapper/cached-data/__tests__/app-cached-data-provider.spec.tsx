import {
    AppCachedDataProvider,
    useAppCachedData,
} from '@components/app-wrapper/cached-data/app-cached-data-provider'
import { CachedDataProvider } from '@components/app-wrapper/cached-data/cached-data-provider'
import { CustomDataProvider } from '@dhis2/app-runtime'
import { ConfigProvider } from '@dhis2/app-service-config'
import { UserProvider } from '@dhis2/app-service-user'
import meData from '@test-utils/__fixtures__/me.json'
import organisationUnitLevelsData from '@test-utils/__fixtures__/organisation-unit-levels.json'
import organisationUnitsData from '@test-utils/__fixtures__/organisation-units.json'
import systemSettingsData from '@test-utils/__fixtures__/system-settings.json'
import {
    mockPeriodTypesQueryData,
    mockRuntimeConfig,
} from '@test-utils/server-mocks'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { expect, describe, it, vi } from 'vitest'

type QueryData = ComponentProps<typeof CustomDataProvider>['data']

const serverData: QueryData = {
    organisationUnitLevels: organisationUnitLevelsData,
    organisationUnits: organisationUnitsData,
    systemSettings: systemSettingsData,
    ...mockPeriodTypesQueryData,
}

const withoutResource = (resource: string): QueryData =>
    Object.fromEntries(
        Object.entries(serverData).filter(([key]) => key !== resource)
    )

const CachedDataSummary = () => {
    const { currentUser, relativePeriodsNames, locale } = useAppCachedData()

    return (
        <div data-test="summary">
            {currentUser.username}: {relativePeriodsNames.LAST_YEAR} ({locale})
        </div>
    )
}

const renderProvider = (data: QueryData, userInfo = meData) =>
    render(
        <ConfigProvider config={mockRuntimeConfig}>
            <CustomDataProvider data={data}>
                <UserProvider userInfo={userInfo}>
                    <AppCachedDataProvider>
                        <CachedDataSummary />
                    </AppCachedDataProvider>
                </UserProvider>
            </CustomDataProvider>
        </ConfigProvider>
    )

describe('AppCachedDataProvider', () => {
    it('provides the current user, the query data and the relative period names', async () => {
        renderProvider(serverData)

        expect(await screen.findByTestId('summary')).toHaveTextContent(
            `${meData.username}: Last year (en)`
        )
    })

    it('provides the user locale in a form Intl accepts', async () => {
        renderProvider(serverData, {
            ...meData,
            settings: { ...meData.settings, keyUiLocale: 'pt_BR' },
        })

        expect(await screen.findByTestId('summary')).toHaveTextContent(
            '(pt-BR)'
        )
    })

    it('shows an error when the query fails', async () => {
        renderProvider(withoutResource('organisationUnits'))

        expect(await screen.findByText('Network error')).toBeInTheDocument()
        expect(screen.queryByTestId('summary')).not.toBeInTheDocument()
    })

    it('shows an error when the relative period names fail to load', async () => {
        renderProvider(withoutResource('configuration/dataOutputPeriodTypes'))

        expect(await screen.findByText('Network error')).toBeInTheDocument()
        expect(screen.queryByTestId('summary')).not.toBeInTheDocument()
    })
})

describe('useAppCachedData', () => {
    it('throws when the cached data comes from the plugin', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined)

        expect(() =>
            render(
                <CachedDataProvider
                    data={{ relativePeriodsNames: {}, locale: 'en' }}
                >
                    <CachedDataSummary />
                </CachedDataProvider>
            )
        ).toThrow('useAppCachedData can only be used in the app')
    })
})
