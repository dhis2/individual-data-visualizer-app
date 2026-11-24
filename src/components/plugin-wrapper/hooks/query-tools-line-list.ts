import { getLineListHeaderNames } from '@modules/analytics-request'
import { isActiveFilterDimensionRecord } from '@modules/dimension/active-filter'
import type {
    Axis,
    CurrentVisualization,
    DimensionRecord,
    OutputType,
} from '@types'
import { adaptDimensions, getRequestOptions } from './query-tools-common'

/* A column that only displays a value is requested through `headers=` alone,
 * except an org unit group set: analytics fails on its header unless it is
 * also requested as a dimension. */
const isRequestedAsDimension = (dim: DimensionRecord): boolean =>
    dim.dimensionType === 'ORGANISATION_UNIT_GROUP_SET' ||
    isActiveFilterDimensionRecord(dim)

export const getAdaptedVisualization = (
    visualization: CurrentVisualization
): {
    adaptedVisualization: Record<Axis, object[]> & {
        outputType: OutputType
    }
    headers: (string | string[])[]
    parameters: Record<string, unknown>
} => {
    const parameters = getRequestOptions(visualization)

    const columns = visualization.columns ?? []
    const rows = visualization.rows ?? []
    const filters = visualization.filters ?? []

    const headers = getLineListHeaderNames(visualization)

    return {
        adaptedVisualization: {
            columns: adaptDimensions(
                columns.filter(isRequestedAsDimension),
                visualization
            ),
            rows: adaptDimensions(
                rows.filter(isRequestedAsDimension),
                visualization
            ),
            filters: adaptDimensions(
                filters.filter(isActiveFilterDimensionRecord),
                visualization
            ),
            outputType: visualization.outputType,
        },
        headers,
        parameters,
    }
}

/* The identity of the request's dataset: the visualization plus
 * relativePeriodDate. Sorting, paging and displayProperty are excluded because
 * they refetch without a remount. */
export const getBaseRequestIdentity = (
    visualization: CurrentVisualization,
    relativePeriodDate?: string
) => ({
    ...getAdaptedVisualization(visualization),
    programIds: (visualization.programDimensions ?? []).map((p) => p.id),
    trackedEntityTypeId: visualization.trackedEntityType?.id,
    relativePeriodDate: relativePeriodDate ?? null,
})
