import {
    RadioCard,
    RadioCardGroup,
} from '@components/shared/radio-card/radio-card'
import i18n from '@dhis2/d2-i18n'
import { useAppDispatch, useAppSelector, useListFormatter } from '@hooks'
import {
    getVisUiConfigConditionsByDimension,
    setVisUiConfigGroupingByDimension,
} from '@store/vis-ui-config-slice'
import type { LegendSetMetadataItem } from '@types'
import { type FC, useCallback } from 'react'

const NO_GROUPING_VALUE = 'NO_GROUPING'
const MAX_PREVIEW_LEGENDS = 3

const useLegendsPreview = (): ((
    legends: LegendSetMetadataItem['legends']
) => string) => {
    const listFormatter = useListFormatter()

    return useCallback(
        (legends) => {
            const previewNames = legends
                .slice(0, MAX_PREVIEW_LEGENDS)
                .map((legend) => legend.name)
            const remainingCount = legends.length - MAX_PREVIEW_LEGENDS

            return listFormatter.format(
                remainingCount > 0
                    ? [
                          ...previewNames,
                          i18n.t('{{- count}} more', { count: remainingCount }),
                      ]
                    : previewNames
            )
        },
        [listFormatter]
    )
}

type GroupingSectionProps = {
    dimensionId: string
    legendSets: LegendSetMetadataItem[]
}

export const GroupingSection: FC<GroupingSectionProps> = ({
    dimensionId,
    legendSets,
}) => {
    const dispatch = useAppDispatch()
    const getLegendsPreview = useLegendsPreview()
    const { legendSet: selectedLegendSetId } = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimensionId)
    )

    const dataTest = `grouping-${dimensionId}`

    const selectLegendSet = useCallback(
        (legendSet?: string) => {
            if (legendSet === selectedLegendSetId) {
                return
            }
            dispatch(
                setVisUiConfigGroupingByDimension({ dimensionId, legendSet })
            )
        },
        [dispatch, dimensionId, selectedLegendSetId]
    )

    return (
        <RadioCardGroup legend={i18n.t('Grouping')} horizontal>
            {legendSets.map((legendSet) => (
                <RadioCard
                    key={legendSet.id}
                    selected={selectedLegendSetId === legendSet.id}
                    label={legendSet.name}
                    value={legendSet.id}
                    name={dataTest}
                    emphasized
                    dataTest={`${dataTest}-${legendSet.id}`}
                    helpText={getLegendsPreview(legendSet.legends)}
                    onSelect={() => selectLegendSet(legendSet.id)}
                />
            ))}
            <RadioCard
                selected={!selectedLegendSetId}
                label={i18n.t('No grouping')}
                value={NO_GROUPING_VALUE}
                name={dataTest}
                emphasized
                dataTest={`${dataTest}-none`}
                helpText={i18n.t('Show each value individually')}
                onSelect={() => selectLegendSet(undefined)}
            />
        </RadioCardGroup>
    )
}
