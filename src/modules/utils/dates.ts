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

export const getStartEndDateFormatter = (
    locale: string
): ((startEndDate: string) => string) => {
    const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })

    return (startEndDate) => {
        const [startDate, endDate] = getStartEndDate(startEndDate)

        return startDate && endDate
            ? formatter.formatRange(new Date(startDate), new Date(endDate))
            : ''
    }
}
