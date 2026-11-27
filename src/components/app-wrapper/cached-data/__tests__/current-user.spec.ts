import {
    toCurrentUser,
    toIntlLocale,
} from '@components/app-wrapper/cached-data/current-user'
import meData from '@test-utils/__fixtures__/me.json'
import { describe, expect, it } from 'vitest'

describe('toIntlLocale', () => {
    it.each([
        ['en', 'en'],
        ['pt_BR', 'pt-BR'],
        ['es_419', 'es-419'],
        ['uz_UZ_Cyrl', 'uz-Cyrl-UZ'],
        ['uz_UZ_Latn', 'uz-Latn-UZ'],
    ])('turns the DHIS2 locale %s into %s', (dhis2Locale, intlLocale) => {
        expect(toIntlLocale(dhis2Locale)).toBe(intlLocale)
    })

    it('gives a locale that Intl accepts', () => {
        expect(
            () => new Intl.DateTimeFormat(toIntlLocale('zh_CN'))
        ).not.toThrow()
    })

    it.each([undefined, '', 'not a locale'])(
        'falls back to English for %j',
        (dhis2Locale) => {
            expect(toIntlLocale(dhis2Locale)).toBe('en')
        }
    )
})

describe('toCurrentUser', () => {
    it('converts both locales and picks the name property to display', () => {
        const currentUser = toCurrentUser({
            ...meData,
            settings: {
                ...meData.settings,
                keyUiLocale: 'pt_BR',
                keyDbLocale: 'uz_UZ_Latn',
                keyAnalysisDisplayProperty: 'name',
            },
        })

        expect(currentUser).toEqual({
            id: meData.id,
            username: meData.username,
            name: meData.displayName,
            authorities: meData.authorities,
            settings: {
                uiLocale: 'pt-BR',
                dbLocale: 'uz-Latn-UZ',
                displayProperty: 'name',
                displayNameProperty: 'displayName',
            },
        })
    })

    it('displays short names unless the user chose names', () => {
        const currentUser = toCurrentUser({
            ...meData,
            settings: {
                ...meData.settings,
                keyAnalysisDisplayProperty: 'shortName',
            },
        })

        expect(currentUser.settings.displayNameProperty).toBe(
            'displayShortName'
        )
    })
})
