import type { DimensionMetadataItem, DimensionType, Layout } from '@types'

const DIMENSION_TYPES_REQUIRING_ITEMS: ReadonlySet<DimensionType> = new Set([
    'PERIOD',
    'ORGANISATION_UNIT',
])

/* An empty period or org unit on columns or rows splits a pivot table by every
 * raw value, which is meaningless to the user. Filters don't count: an empty
 * filter is left out of the analytics request. */
export const getEmptyPeriodAndOrgUnitDimensionIds = ({
    layout,
    itemsByDimension,
    getDimension,
}: {
    layout: Layout
    itemsByDimension: Record<string, string[] | undefined>
    getDimension: (id: string) => Pick<DimensionMetadataItem, 'dimensionType'>
}): string[] =>
    [...layout.columns, ...layout.rows].filter(
        (id) =>
            DIMENSION_TYPES_REQUIRING_ITEMS.has(
                getDimension(id).dimensionType
            ) && !itemsByDimension[id]?.length
    )
