import {
    EVENT_ONLY_AGGREGATION_TYPES,
    SUPPORTED_AGGREGATION_TYPES,
} from '@constants/aggregation-types'
import type { AggregationType } from '@types'

/* Stands in for a type the cell value cannot use: an item whose own type is
 * unsupported (many tracked entity attributes and some data elements aggregate
 * by NONE, which analytics rejects with E7265), or a saved type analytics does
 * not handle. A neutral numeric choice the user can override. The same stands
 * in when the item's own type is unknown, which happens for dimensions whose
 * metadata came from an analytics response rather than the sidebar. */
export const FALLBACK_AGGREGATION_TYPE: AggregationType = 'AVERAGE'

type AggregatableItem = { aggregationType?: AggregationType }

export const isSupportedAggregationType = (
    aggregationType: AggregationType | undefined
): aggregationType is AggregationType =>
    Boolean(aggregationType && SUPPORTED_AGGREGATION_TYPES.has(aggregationType))

export const isEventOnlyAggregationType = (
    aggregationType: AggregationType
): boolean => EVENT_ONLY_AGGREGATION_TYPES.has(aggregationType)

/* `DEFAULT` means "whatever this item aggregates by", and it is saved and sent
 * to analytics as is, so the visualization keeps following the item. It is
 * resolved to a real type to show an aggregation name and to tell whether the
 * output type can use it. */
export const resolveAggregationType = (
    aggregationType: AggregationType,
    item: AggregatableItem
): AggregationType => {
    if (aggregationType !== 'DEFAULT') {
        return aggregationType
    }

    return isSupportedAggregationType(item.aggregationType)
        ? item.aggregationType
        : FALLBACK_AGGREGATION_TYPE
}

/* An item whose own type is unsupported has no default to follow, so `DEFAULT`
 * is replaced by the fallback. It is stored that way too: should the item get a
 * supported type later, the visualization keeps showing the values the user saw
 * rather than quietly switching to that type. An unknown item type is left to
 * analytics. */
export const replaceDefaultForUnsupportedItem = (
    aggregationType: AggregationType,
    item: AggregatableItem
): AggregationType =>
    aggregationType === 'DEFAULT' &&
    item.aggregationType &&
    !isSupportedAggregationType(item.aggregationType)
        ? FALLBACK_AGGREGATION_TYPE
        : aggregationType

/* For a saved visualization, which may name a type the app no longer offers:
 * ER let users save any of them. */
export const replaceUnsupportedAggregationType = (
    aggregationType: AggregationType,
    item: AggregatableItem
): AggregationType =>
    aggregationType === 'DEFAULT' || isSupportedAggregationType(aggregationType)
        ? replaceDefaultForUnsupportedItem(aggregationType, item)
        : FALLBACK_AGGREGATION_TYPE
