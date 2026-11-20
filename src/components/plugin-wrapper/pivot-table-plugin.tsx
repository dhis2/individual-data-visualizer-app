import { LegendKey } from '@components/shared/legend-key'
import { PivotTable } from '@dhis2/analytics'
import {
    getAnalyticsRequestHeaderName,
    transformVisualizationForAnalyticsRequest,
} from '@modules/analytics-request'
import { isActiveFilterDimensionRecord } from '@modules/dimension/active-filter'
import { logger } from '@modules/logger'
import type { CurrentUser, CurrentVisualization, DimensionArray } from '@types'
import { type FC, useEffect, useMemo } from 'react'
import {
    type FetchedLegendSet,
    getPivotTableEngineLegend,
} from './hooks/legend-sets'
import { usePivotTableAnalyticsData } from './hooks/use-pivot-table-analytics-data'
import classes from './styles/pivot-table-plugin.module.css'

const formatVisualizationForPivotTableEngine = (
    visualization: CurrentVisualization,
    legendSet: FetchedLegendSet | undefined
): CurrentVisualization => {
    const formatDimensions = (dimensions: DimensionArray): DimensionArray =>
        dimensions.map((dim) => ({
            ...dim,
            dimension: getAnalyticsRequestHeaderName({
                dimensionId: dim.dimension,
                programId: dim.program?.id,
                programStageId: dim.programStage?.id,
                visualization,
            }),
        }))

    return {
        ...visualization,
        columns: formatDimensions(visualization.columns),
        rows: formatDimensions(visualization.rows),
        /* The engine shows a filter row whenever there are filters, so it gets
         * only those that are sent to analytics. */
        filters: formatDimensions(
            visualization.filters.filter(isActiveFilterDimensionRecord)
        ),
        legend: getPivotTableEngineLegend(visualization.legend, legendSet),
    }
}

type PivotTablePluginProps = {
    displayProperty: CurrentUser['settings']['displayProperty']
    visualization: CurrentVisualization
    relativePeriodDate?: string
    isInDashboard: boolean
    isInModal: boolean
    onResponseReceived: () => void
    filterText?: string
}

export const PivotTablePlugin: FC<PivotTablePluginProps> = ({
    displayProperty,
    visualization,
    relativePeriodDate,
    onResponseReceived,
    filterText,
    isInDashboard,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isInModal,
}) => {
    const [fetchAnalyticsData, { data, legendSet }] =
        usePivotTableAnalyticsData()

    // the dimension ids need to be formatted to match the ones returned in the analytics metaData, otherwise the PT engine fails to lookup the metadata
    const eventVisualization = useMemo(
        () =>
            formatVisualizationForPivotTableEngine(
                transformVisualizationForAnalyticsRequest(visualization),
                legendSet
            ),
        [visualization, legendSet]
    )

    const legendSets = useMemo(
        () => (legendSet ? [legendSet] : []),
        [legendSet]
    )

    // TODO: implement onDataSorted and any other function/callback that cannot rely on the Redux store

    useEffect(() => {
        void fetchAnalyticsData({
            visualization:
                transformVisualizationForAnalyticsRequest(visualization),
            relativePeriodDate,
            displayProperty,
            onResponseReceived,
        })
    }, [
        displayProperty,
        relativePeriodDate,
        visualization,
        onResponseReceived,
        fetchAnalyticsData,
    ])

    logger.debug('PT eventVisualization', eventVisualization)
    logger.debug('PT analytics data', data)

    if (!data) {
        return null
    }

    return (
        <div className={classes.grid}>
            <div className={classes.table}>
                <PivotTable
                    visualization={eventVisualization}
                    data={data}
                    legendSets={legendSets}
                    filterText={filterText}
                />
            </div>
            <div className={classes.endColumn} data-test="end-column">
                <LegendKey
                    isInDashboard={isInDashboard}
                    legendSets={legendSets}
                    showKey={visualization.legend?.showKey ?? false}
                />
            </div>
        </div>
    )
}
