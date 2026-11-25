import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import type {
    DimensionMetadataItem,
    DimensionType,
    VisualizationType,
} from '@types'

/* Per-dimension validity by visualization type. Used by the sidebar to
 * disable cards and individual chips, and by the conversion strategy to
 * decide which dimensions to discard when switching vis types. */

/* Analytics can't aggregate program indicators in a pivot table. The user
 * dimensions (created by, last updated by) hold plain text, which can't be
 * aggregated either, and they can't be filtered, so they are of no use on the
 * filter axis. */
const PIVOT_TABLE_UNSUPPORTED_DIMENSION_TYPES: ReadonlySet<DimensionType> =
    new Set(['PROGRAM_INDICATOR', 'USER'])

export const isDimensionTypeUnsupportedByVisType = (
    dimensionType: DimensionType,
    visType: VisualizationType
): boolean => {
    if (visType === 'LINE_LIST') {
        return false
    }
    return PIVOT_TABLE_UNSUPPORTED_DIMENSION_TYPES.has(dimensionType)
}

export const isDimensionUnsupportedByVisType = (
    dim: Partial<Pick<DimensionMetadataItem, 'dimensionType'>>,
    visType: VisualizationType
): boolean =>
    !!dim.dimensionType &&
    isDimensionTypeUnsupportedByVisType(dim.dimensionType, visType)

export const isDimensionCrossTet = (
    dimensionTetId: string | null,
    layoutTetId: string | null
): boolean =>
    layoutTetId !== null &&
    dimensionTetId !== null &&
    dimensionTetId !== layoutTetId

// ─────────────────────────────────────────────────────────────────────────────
// Layout-blocking: whether — and why — a dimension cannot be placed in the layout
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionBlockReason = 'visType' | 'crossTet'

type DimensionBlockReasonInput = {
    dimension: DimensionMetadataItem
    visualizationType: VisualizationType
    layoutTetId: string | null
    dimensionTetId: string | null
}

/* Single source of truth for whether — and why — a dimension is blocked from
 * the layout, in precedence order. Both the item-level message and the
 * batch-add grouping derive from this. */
export const getDimensionBlockReason = ({
    dimension,
    visualizationType,
    layoutTetId,
    dimensionTetId,
}: DimensionBlockReasonInput): DimensionBlockReason | null => {
    if (isDimensionUnsupportedByVisType(dimension, visualizationType)) {
        return 'visType'
    }
    if (isDimensionCrossTet(dimensionTetId, layoutTetId)) {
        return 'crossTet'
    }
    return null
}

export const getCrossTetMessage = (
    dataSourceTetName: string,
    layoutTetName: string
): string =>
    i18n.t(
        '{{- dataSourceTetName}} dimensions cannot be combined with {{- layoutTetName}} dimensions already in the layout.',
        { dataSourceTetName, layoutTetName }
    )

type DimensionDisablingInput = DimensionBlockReasonInput & {
    crossTetMessage: string
}

export const getDimensionLayoutBlockedMessage = (
    input: DimensionDisablingInput
): string | null => {
    switch (getDimensionBlockReason(input)) {
        case 'visType':
            return i18n.t('Cannot be used in a {{- visType}}.', {
                visType: visTypeDisplayNames[input.visualizationType],
            })
        case 'crossTet':
            return input.crossTetMessage
        default:
            return null
    }
}
