import { useUserLocale } from '@components/app-wrapper/cached-data/cached-data-provider'
import { useMemo } from 'react'

export const useListFormatter = (
    options?: Intl.ListFormatOptions
): Intl.ListFormat => {
    const locale = useUserLocale()
    const { type, style, localeMatcher } = options ?? {}
    return useMemo(
        () => new Intl.ListFormat(locale, { type, style, localeMatcher }),
        [locale, type, style, localeMatcher]
    )
}
