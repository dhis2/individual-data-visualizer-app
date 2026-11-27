import { useCurrentUser } from '@components/app-wrapper/cached-data/cached-data-provider'
import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useMetadataItems } from '@hooks'
import type { Conditions, FormatValueOptions } from '@modules/conditions'
import {
    getDimensionValueMetadataIds,
    getDimensionValueTexts,
} from '@modules/dimension/value-texts'
import { useMemo } from 'react'

type UseDimensionValueTextsParams = {
    dimension: LayoutDimension
    itemIds: string[]
    conditions: Conditions
    formatValueOptions: FormatValueOptions
}

export const useDimensionValueTexts = ({
    dimension,
    itemIds,
    conditions,
    formatValueOptions,
}: UseDimensionValueTextsParams): string[] => {
    const locale = useCurrentUser().settings.uiLocale
    const metadataIds = useMemo(
        () => getDimensionValueMetadataIds({ dimension, itemIds, conditions }),
        [dimension, itemIds, conditions]
    )
    const metadataItems = useMetadataItems(metadataIds)

    return useMemo(
        () =>
            getDimensionValueTexts({
                dimension,
                itemIds,
                conditions,
                metadataItems,
                formatValueOptions,
                locale,
            }),
        [
            dimension,
            itemIds,
            conditions,
            metadataItems,
            formatValueOptions,
            locale,
        ]
    )
}
