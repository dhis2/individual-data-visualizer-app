// eslint-disable-next-line no-restricted-imports
import type { useDataEngine } from '@dhis2/app-runtime'
import { getCellValueMetadataItemOrThrow } from '@modules/dimension/cell-value'
import { getDataItemResource } from '@modules/dimension/dimension-type'
import type { CurrentVisualization, LegendSet, MetadataStore } from '@types'

export type FetchedLegendSet = Required<Pick<LegendSet, 'id' | 'name'>> &
    Pick<LegendSet, 'legends'>

type DataEngine = ReturnType<typeof useDataEngine>

/* Legend sets and legends have no shortName, so the name always comes from
 * displayName. */
const LEGEND_SET_FIELDS =
    'id,displayName~rename(name),legends[id,displayName~rename(name),startValue,endValue,color]'

const legendSetsQuery = {
    resource: 'legendSets',
    params: (variables: Record<string, unknown>) => ({
        fields: LEGEND_SET_FIELDS,
        filter: `id:in:[${(variables.ids as string[]).join(',')}]`,
        paging: false,
    }),
}

export const fetchLegendSets = async ({
    legendSetIds,
    dataEngine,
    signal,
}: {
    legendSetIds: string[]
    dataEngine: DataEngine
    signal?: AbortSignal
}): Promise<FetchedLegendSet[]> => {
    if (!legendSetIds.length) {
        return []
    }

    const legendSetsData = (await dataEngine.query(
        { legendSets: legendSetsQuery },
        { variables: { ids: legendSetIds }, signal }
    )) as { legendSets: { legendSets: FetchedLegendSet[] } }

    return legendSetsData.legendSets.legendSets
}

export const getFixedLegendSetIds = ({
    legend,
}: Pick<CurrentVisualization, 'legend'>): string[] =>
    legend?.strategy === 'FIXED' && legend.set?.id ? [legend.set.id] : []

/* A pivot table's only data item is its cell value. It is coloured with the
 * first legend set assigned to the item, as analytics does for a line list
 * column. */
const fetchCellValueLegendSet = async ({
    visualization,
    metadataStore,
    dataEngine,
}: {
    visualization: CurrentVisualization
    metadataStore: MetadataStore
    dataEngine: DataEngine
}): Promise<FetchedLegendSet | undefined> => {
    if (!visualization.value) {
        return undefined
    }

    const item = getCellValueMetadataItemOrThrow(
        visualization.value,
        visualization,
        metadataStore
    )
    const resource = getDataItemResource(item.dimensionType)

    if (!resource) {
        return undefined
    }

    const response = (await dataEngine.query({
        dataItem: {
            resource,
            id: item.dimensionId,
            params: { fields: `legendSets[${LEGEND_SET_FIELDS}]` },
        },
    })) as { dataItem: { legendSets?: FetchedLegendSet[] } }

    return response.dataItem.legendSets?.[0]
}

export const fetchPivotTableLegendSet = async ({
    visualization,
    metadataStore,
    dataEngine,
}: {
    visualization: CurrentVisualization
    metadataStore: MetadataStore
    dataEngine: DataEngine
}): Promise<FetchedLegendSet | undefined> => {
    switch (visualization.legend?.strategy) {
        case 'FIXED': {
            const [legendSet] = await fetchLegendSets({
                legendSetIds: getFixedLegendSetIds(visualization),
                dataEngine,
            })
            return legendSet
        }
        case 'BY_DATA_ITEM':
            return fetchCellValueLegendSet({
                visualization,
                metadataStore,
                dataEngine,
            })
        default:
            return undefined
    }
}

/* The pivot table engine looks for a data item's legend set on the `dx`
 * dimension, which this app's pivot tables don't have. The legend set
 * resolved for the table is handed to the engine as a fixed one instead. */
export const getPivotTableEngineLegend = (
    legend: CurrentVisualization['legend'] | undefined,
    legendSet: FetchedLegendSet | undefined
): CurrentVisualization['legend'] | undefined =>
    legend && legendSet
        ? {
              ...legend,
              strategy: 'FIXED',
              set: { id: legendSet.id, displayName: legendSet.name },
          }
        : legend
