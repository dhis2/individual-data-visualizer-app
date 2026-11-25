import { useUserLocale } from '@components/app-wrapper/cached-data/cached-data-provider'
import { useCallback, useMemo } from 'react'

export const getStartEndDate = (startEndDate: string): Array<string> => {
    const parts = startEndDate.split('_')
    return parts.length === 2 &&
        !isNaN(Date.parse(parts[0])) &&
        !isNaN(Date.parse(parts[1]))
        ? parts
        : []
}

export const isStartEndDate = (id: string): boolean =>
    getStartEndDate(id).length === 2

type UseLocalizedStartEndDateFormatterResult = (startEndDate: string) => string

export const getStartEndDateFormatter = (
    locale: string
): UseLocalizedStartEndDateFormatterResult => {
    const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })

    return (startEndDate) =>
        getStartEndDate(startEndDate)
            .map((dateStr: string) => formatter.format(new Date(dateStr)))
            .join(' - ')
}

export const useLocalizedStartEndDateFormatter =
    (): UseLocalizedStartEndDateFormatterResult => {
        const locale = useUserLocale()

        const formatter = useMemo(
            () => getStartEndDateFormatter(locale),
            [locale]
        )

        return useCallback(
            (startEndDate) => formatter(startEndDate),
            [formatter]
        )
    }
