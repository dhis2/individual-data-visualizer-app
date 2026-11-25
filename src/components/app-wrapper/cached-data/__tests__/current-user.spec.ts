import { toIntlLocale } from '@components/app-wrapper/cached-data/current-user'
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
