import { useUserLocale } from '@components/app-wrapper/cached-data/cached-data-provider'
import { PluginCachedDataProvider } from '@components/app-wrapper/cached-data/plugin-cached-data-provider'
import { getRelativePeriodsName } from '@dhis2/analytics'
import { UserProvider } from '@dhis2/app-service-user'
import meData from '@test-utils/__fixtures__/me.json'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@dhis2/analytics', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    useRelativePeriodsNames: () => ({
        relativePeriodsNames: getRelativePeriodsName(),
        loading: false,
    }),
}))

const Locale = () => <div data-test="locale">{useUserLocale()}</div>

describe('PluginCachedDataProvider', () => {
    it('provides the user locale in a form Intl accepts', () => {
        render(
            <UserProvider
                userInfo={{
                    ...meData,
                    settings: { ...meData.settings, keyUiLocale: 'uz_UZ_Cyrl' },
                }}
            >
                <PluginCachedDataProvider>
                    <Locale />
                </PluginCachedDataProvider>
            </UserProvider>
        )

        expect(screen.getByTestId('locale')).toHaveTextContent('uz-Cyrl-UZ')
    })
})
