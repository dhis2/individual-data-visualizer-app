import {
    getHeadersMap,
    getLineListHeaderNames,
    transformVisualizationForAnalyticsRequest,
} from '@modules/analytics-request'
import type { CurrentVisualization, DimensionId, Sorting } from '@types'

/* Analytics sorts a line list by the name of one of its headers, so those are
 * the names a sort can use. A pivot table is not sorted by a column. */
const getSortableHeaderNames = (
    visualization: CurrentVisualization
): string[] =>
    visualization.type === 'LINE_LIST'
        ? getLineListHeaderNames(
              transformVisualizationForAnalyticsRequest(visualization)
          ).flat()
        : []

const getWireDimension = (headerName: string): string =>
    headerName.slice(headerName.lastIndexOf('.') + 1)

/* The Line Listing app saves a sort on a column whose header has no prefix
 * under the column's dimension id (`eventDate`) instead of its header name
 * (`eventdate`), and analytics rejects the dimension id. */
const findSortedHeaderName = (
    savedDimension: string,
    visualization: CurrentVisualization
): string | undefined => {
    const headerNames = getSortableHeaderNames(visualization)

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
