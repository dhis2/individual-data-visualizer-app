import { PluginCachedDataProvider } from '@components/app-wrapper/cached-data/plugin-cached-data-provider'
import {
    PluginMetadataProvider,
    useMetadataItem,
} from '@components/app-wrapper/metadata-provider/metadata-provider'
import { CustomDataProvider } from '@dhis2/app-runtime'
import { ConfigProvider } from '@dhis2/app-service-config'
import { UserProvider } from '@dhis2/app-service-user'
import meData from '@test-utils/__fixtures__/me.json'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import {
    mockPeriodTypesQueryData,
    mockRuntimeConfig,
} from '@test-utils/server-mocks'
import { render, screen, waitFor } from '@testing-library/react'
import { expect, describe, it } from 'vitest'

type ServerPeriodType = {
    name: string
    relativePeriods: Record<string, { displayName: string }>
}

const withServerPeriodName = (id: string, displayName: string) => {
    const periodTypes = mockPeriodTypesQueryData[
        'configuration/dataOutputPeriodTypes'
    ] as unknown as ServerPeriodType[]

    return {
        ...mockPeriodTypesQueryData,
        'configuration/dataOutputPeriodTypes': periodTypes.map((periodType) =>
            periodType.relativePeriods[id]
                ? {
                      ...periodType,
                      relativePeriods: {
                          ...periodType.relativePeriods,
                          [id]: { displayName },
                      },
                  }
                : periodType
        ),
    }
}

const PeriodName = ({ id }: { id: string }) => (
    <div data-test="period-name">{useMetadataItem(id)?.name}</div>
)

describe('relative period names in the metadata store', () => {
    it('uses the server names in the app', async () => {
        const { result } = await renderHookWithAppWrapper(
            () => useMetadataItem('LAST_5_YEARS'),
            {
                queryData: withServerPeriodName(
                    'LAST_5_YEARS',
                    'Les 5 dernières années'
                ),
            }
        )

        expect(result.current?.name).toBe('Les 5 dernières années')
    })

    it('uses the server names in the plugin', async () => {
        render(
            <ConfigProvider config={mockRuntimeConfig}>
                <CustomDataProvider
                    data={withServerPeriodName(
                        'LAST_5_YEARS',
                        'Les 5 dernières années'
                    )}
                >
                    <UserProvider userInfo={meData}>
                        <PluginCachedDataProvider>
                            <PluginMetadataProvider>
                                <PeriodName id="LAST_5_YEARS" />
                            </PluginMetadataProvider>
                        </PluginCachedDataProvider>
                    </UserProvider>
                </CustomDataProvider>
            </ConfigProvider>
        )

        await waitFor(() =>
            expect(screen.getByTestId('period-name')).toHaveTextContent(
                'Les 5 dernières années'
            )
        )
    })
})
