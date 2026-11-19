import {
    analyticsHeaderToCanonicalDimensionId,
    getHeadersMap,
    getLineListHeaderNames,
    transformVisualizationForAnalyticsRequest,
} from '@modules/analytics-request'
import { REPETITION_INDEX_PATTERN } from '@modules/dimension/ids'
import type { SortingObject } from '@store/vis-ui-config-slice'
import type { CurrentVisualization, DimensionId, Sorting } from '@types'

type SortColumn = Omit<SortingObject, 'direction'>

/* Analytics sorts a line list by the name of one of its headers, so those are
 * the names a sort can use. A pivot table is not sorted by a column. */
const getSortableHeaderNames = (
    analyticsVisualization: CurrentVisualization
): string[] =>
    analyticsVisualization.type === 'LINE_LIST'
        ? getLineListHeaderNames(analyticsVisualization).flat()
        : []

const getSortColumn = (
    headerName: string,
    analyticsVisualization: CurrentVisualization
): SortColumn => {
    const repetitionMatch = REPETITION_INDEX_PATTERN.exec(headerName)
    const dimensionId = analyticsHeaderToCanonicalDimensionId(
        headerName,
        analyticsVisualization
    )

    return repetitionMatch
        ? { dimensionId, repetitionIndex: Number(repetitionMatch[1]) }
        : { dimensionId }
}

const isSameColumn = (a: SortColumn, b: SortColumn): boolean =>
    a.dimensionId === b.dimensionId && a.repetitionIndex === b.repetitionIndex

const getWireDimension = (headerName: string): string =>
    headerName.slice(headerName.lastIndexOf('.') + 1)

/* The Line Listing app saves a sort on a column whose header has no prefix
 * under the column's dimension id (`eventDate`) instead of its header name
 * (`eventdate`), and analytics rejects the dimension id. */
const findSortedHeaderName = (
    savedDimension: string,
    visualization: CurrentVisualization
): string | undefined => {
    const headerNames = getSortableHeaderNames(
        transformVisualizationForAnalyticsRequest(visualization)
    )

    if (headerNames.includes(savedDimension)) {
        return savedDimension
    }

    const wireDimension =
        getHeadersMap(visualization)[savedDimension as DimensionId]

    return wireDimension
        ? headerNames.find(
              (headerName) => getWireDimension(headerName) === wireDimension
          )
        : undefined
}

/* A saved sort as the header name analytics sorts by, or nothing when it
 * names no column of the line list. */
export const normalizeSavedSorting = (
    visualization: CurrentVisualization
): Sorting[] | undefined => {
    const [sorting] = visualization.sorting ?? []
    const headerName =
        sorting && findSortedHeaderName(sorting.dimension, visualization)

    return headerName
        ? [{ dimension: headerName, direction: sorting.direction }]
        : undefined
}

export const getVisUiConfigSorting = (
    sorting: Sorting[] | undefined,
    visualization: CurrentVisualization
): SortingObject | undefined => {
    const [firstSorting] = sorting ?? []

    return firstSorting
        ? {
              ...getSortColumn(
                  firstSorting.dimension,
                  transformVisualizationForAnalyticsRequest(visualization)
              ),
              direction: firstSorting.direction,
          }
        : undefined
}

/* The sort as the header name the line list has for its column now, or
 * nothing when the line list no longer has that column. */
export const getLineListSorting = (
    sorting: SortingObject | undefined,
    visualization: CurrentVisualization
): Sorting[] | undefined => {
    if (!sorting) {
        return undefined
    }

    const analyticsVisualization =
        transformVisualizationForAnalyticsRequest(visualization)
    const headerName = getSortableHeaderNames(analyticsVisualization).find(
        (name) =>
            isSameColumn(getSortColumn(name, analyticsVisualization), sorting)
    )

    return headerName
        ? [{ dimension: headerName, direction: sorting.direction }]
        : undefined
}
