// eslint-disable-next-line no-restricted-imports
import type { useDataEngine } from '@dhis2/app-runtime'
import type { CurrentVisualization, LegendSet } from '@types'

export type FetchedLegendSet = Pick<LegendSet, 'id' | 'name' | 'legends'>

const legendSetsQuery = {
    resource: 'legendSets',
    params: (variables: Record<string, unknown>) => ({
        /* Legend sets and legends have no shortName, so the name always comes
         * from displayName. */
        fields: 'id,displayName~rename(name),legends[id,displayName~rename(name),startValue,endValue,color]',
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
    dataEngine: ReturnType<typeof useDataEngine>
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
