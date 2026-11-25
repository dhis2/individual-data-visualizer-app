import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import {
    getConditionsMetadataIds,
    getConditionsTexts,
    type Conditions,
    type FormatValueOptions,
} from '@modules/conditions'
import { isItemBasedDimensionType } from '@modules/dimension/dimension-type'
import {
    getItemDisplayNames,
    getItemMetadataIds,
} from '@modules/dimension/item-names'
import type { MetadataItem } from '@types'

type DimensionValues = {
    dimension: LayoutDimension
    itemIds: string[]
    conditions: Conditions
}

export const getDimensionValueMetadataIds = ({
    dimension,
    itemIds,
    conditions,
}: DimensionValues): string[] =>
    isItemBasedDimensionType(dimension.dimensionType)
        ? getItemMetadataIds(itemIds)
        : getConditionsMetadataIds({ conditions, dimension })

export const getDimensionValueTexts = ({
    dimension,
    itemIds,
    conditions,
    metadataItems,
    formatValueOptions,
    locale,
}: DimensionValues & {
    metadataItems: Record<string, MetadataItem | undefined>
    formatValueOptions: FormatValueOptions
    locale: string
}): string[] =>
    isItemBasedDimensionType(dimension.dimensionType)
        ? getItemDisplayNames({ itemIds, metadataItems, locale })
        : getConditionsTexts({
              conditions,
              dimension,
              formatValueOptions,
              metadataItems,
          })
