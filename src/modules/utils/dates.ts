import { useCurrentUser } from '@components/app-wrapper/cached-data/cached-data-provider'
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

    return (startEndDate) => {
        const [startDate, endDate] = getStartEndDate(startEndDate)

        return startDate && endDate
            ? formatter.formatRange(new Date(startDate), new Date(endDate))
            : ''
    }
}

export const useLocalizedStartEndDateFormatter =
    (): UseLocalizedStartEndDateFormatterResult => {
        const locale = useCurrentUser().settings.uiLocale

        const formatter = useMemo(
            () => getStartEndDateFormatter(locale),
            [locale]
        )

        return useCallback(
            (startEndDate) => formatter(startEndDate),
            [formatter]
        )
    }
