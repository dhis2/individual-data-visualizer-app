import { type TooltipConfig } from '@components/layout-panel/bottom-bar/tooltip-config'
import i18n from '@dhis2/d2-i18n'
import { isDataSourceProgramWithoutRegistration } from '@modules/data-source'
import {
    isEventOnlyAggregationType,
    resolveAggregationType,
} from '@modules/dimension/aggregation-type'
import { getEmptyPeriodAndOrgUnitDimensionIds } from '@modules/dimension/empty-dimensions'
import { resolveCellValueContext, resolveLayoutContext } from '@modules/layout'
import {
    selectLayoutAllDimensionIds,
    type VisUiConfigState,
} from '@store/vis-ui-config-slice'
import type {
    DimensionType,
    MetadataStore,
    OutputType,
    VisualizationType,
} from '@types'

/* The output types the bottom bar offers for a visualization type. A pivot
 * table has no tracked entity output. */
export const getAvailableOutputTypes = (
    visualizationType: VisualizationType
): OutputType[] =>
    visualizationType === 'PIVOT_TABLE'
        ? ['ENROLLMENT', 'EVENT']
        : ['TRACKED_ENTITY_INSTANCE', 'ENROLLMENT', 'EVENT']

type CategoryLayoutState = {
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
}

const getCategoryTooltipConfig = ({
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
}: CategoryLayoutState): TooltipConfig => {
    if (hasCategoryInLayout && hasCategoryOptionGroupSetInLayout) {
        return {
            content: i18n.t(
                'Not valid with categories or category option group sets'
            ),
        }
    }
    if (hasCategoryInLayout) {
        return { content: i18n.t('Not valid with categories') }
    }
    if (hasCategoryOptionGroupSetInLayout) {
        return { content: i18n.t('Not valid with category option group sets') }
    }
    return undefined
}

type EventTooltipConfigParams = {
    hasNoProgramInLayout: boolean
    hasMultipleProgramsSelected: boolean
    hasMultipleProgramStagesSelected: boolean
    hasTrackedEntityDimensionWithEventProgram: boolean
    visualizationType: string
}

const getEventTooltipConfig = ({
    hasNoProgramInLayout,
    hasMultipleProgramsSelected,
    hasMultipleProgramStagesSelected,
    hasTrackedEntityDimensionWithEventProgram,
    visualizationType,
}: EventTooltipConfigParams): TooltipConfig => {
    if (hasNoProgramInLayout) {
        return { content: i18n.t('Not valid without a program') }
    }

    if (
        hasMultipleProgramsSelected &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (hasTrackedEntityDimensionWithEventProgram) {
        return {
            content: i18n.t(
                'Not valid with tracked entity attributes and event programs'
            ),
        }
    }

    if (hasMultipleProgramStagesSelected) {
        return { content: i18n.t('Not valid with multiple program stages') }
    }

    return undefined
}

type EnrollmentTooltipConfigParams = {
    hasEventOnlyCellValueAggregation: boolean
    hasEventProgramSelected: boolean
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasMultipleProgramsSelected: boolean
    hasNoProgramInLayout: boolean
    visualizationType: string
}

const getEnrollmentTooltipConfig = ({
    hasEventOnlyCellValueAggregation,
    hasEventProgramSelected,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasNoProgramInLayout,
    hasMultipleProgramsSelected,
    visualizationType,
}: EnrollmentTooltipConfigParams): TooltipConfig => {
    if (hasNoProgramInLayout) {
        return { content: i18n.t('Not valid without a program') }
    }

    if (
        hasMultipleProgramsSelected &&
        (visualizationType === 'LINE_LIST' ||
            visualizationType === 'PIVOT_TABLE')
    ) {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (hasEventProgramSelected) {
        return { content: i18n.t('Not valid with event programs') }
    }

    if (hasEventOnlyCellValueAggregation) {
        return {
            content: i18n.t('Not valid with first or last value aggregation'),
        }
    }

    return getCategoryTooltipConfig({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}

/* `DEFAULT` counts as the item's own type, since that is what analytics
 * applies. */
const hasEventOnlyCellValueAggregation = (
    visUiConfig: VisUiConfigState,
    metadataStore: MetadataStore
): boolean => {
    const { cellValue, visualizationType } = visUiConfig

    if (visualizationType !== 'PIVOT_TABLE' || !cellValue) {
        return false
    }

    const item = metadataStore.getDimensionMetadataItem(cellValue.id)

    return isEventOnlyAggregationType(
        resolveAggregationType(cellValue.aggregationType, {
            aggregationType: item?.aggregationType,
        })
    )
}

type TrackedEntityInstanceTooltipConfigParams = {
    hasEventProgramSelected: boolean
    hasCategoryInLayout: boolean
    hasCategoryOptionGroupSetInLayout: boolean
    hasCompletedOnInLayout: boolean
    hasMultipleProgramsSelected: boolean
    hasMultipleTetSelected: boolean
    hasNoTetInLayout: boolean
    hasProgramIndicatorsInLayout: boolean
    visualizationType: string
}

const getTrackedEntityInstanceTooltipConfig = ({
    hasEventProgramSelected,
    hasCategoryInLayout,
    hasCategoryOptionGroupSetInLayout,
    hasCompletedOnInLayout,
    hasMultipleProgramsSelected,
    hasMultipleTetSelected,
    hasNoTetInLayout,
    hasProgramIndicatorsInLayout,
    visualizationType,
}: TrackedEntityInstanceTooltipConfigParams): TooltipConfig => {
    if (hasCompletedOnInLayout) {
        return {
            content: i18n.t('Not valid with Completed on'),
        }
    }

    if (hasMultipleTetSelected) {
        return {
            content: i18n.t('Not valid with multiple tracked entity types'),
        }
    }

    if (hasMultipleProgramsSelected && visualizationType === 'PIVOT_TABLE') {
        return { content: i18n.t('Not valid with multiple programs') }
    }

    if (hasEventProgramSelected) {
        return { content: i18n.t('Not valid with event programs') }
    }

    /* No tracked entity type can be resolved from the layout, so the output
     * cannot be built. Reported after the event-program case, which is the
     * more informative reason when it applies. */
    if (hasNoTetInLayout) {
        return { content: i18n.t('Not valid without a tracked entity type') }
    }

    if (visualizationType === 'LINE_LIST' && hasProgramIndicatorsInLayout) {
        return { content: i18n.t('Not valid with program indicators') }
    }

    return getCategoryTooltipConfig({
        hasCategoryInLayout,
        hasCategoryOptionGroupSetInLayout,
    })
}
/* Without a period or an org unit the analytics API applies a fallback (the
 * last 12 months, the user's org unit), so the result would show data the user
 * never asked for. Only fixed period and org unit dimensions count: a date or
 * org unit data element does not stop the fallback, even with a condition.
 * A pivot table also needs items on every period and org unit on columns or
 * rows, because an empty one splits the table by raw value. */
export const getLayoutSelectionTooltipConfig = ({
    visUiConfig,
    metadataStore,
}: {
    visUiConfig: VisUiConfigState
    metadataStore: MetadataStore
}): TooltipConfig => {
    const { layout, itemsByDimension, visualizationType } = visUiConfig
    const layoutDimensionIds = selectLayoutAllDimensionIds(visUiConfig)

    if (!layoutDimensionIds.length) {
        return {
            content: i18n.t(
                'Nothing selected. Add items to the layout to get started.'
            ),
            openDelay: 1000,
        }
    }

    if (visualizationType === 'PIVOT_TABLE') {
        if (!layout.columns.length && !layout.rows.length) {
            return {
                content: i18n.t(
                    'Add at least one dimension to columns or rows'
                ),
            }
        }
    } else if (!layout.columns.length) {
        return { content: i18n.t('Add at least one dimension to columns') }
    }

    if (
        visualizationType === 'PIVOT_TABLE' &&
        getEmptyPeriodAndOrgUnitDimensionIds({
            layout,
            itemsByDimension,
            getDimension: metadataStore.getDimensionMetadataItemOrThrow,
        }).length
    ) {
        return {
            content: i18n.t(
                'Select at least one item for every period and org unit dimension'
            ),
        }
    }

    const hasDimensionWithItems = (dimensionType: DimensionType): boolean =>
        layoutDimensionIds.some(
            (dimensionId) =>
                metadataStore.getDimensionMetadataItemOrThrow(dimensionId)
                    .dimensionType === dimensionType &&
                Boolean(itemsByDimension[dimensionId]?.length)
        )

    if (!hasDimensionWithItems('PERIOD')) {
        return {
            content: i18n.t('Select at least one period'),
        }
    }

    if (!hasDimensionWithItems('ORGANISATION_UNIT')) {
        return {
            content: i18n.t('Select at least one organisation unit'),
        }
    }

    return undefined
}

/* Why an output type cannot be produced from this config, or undefined when it
 * can. The single source of truth for output type validity: the buttons
 * disable on it, and the unapplied changes hint uses it to decide whether the
 * config is applicable at all. */
export const getOutputTypeTooltipConfig = ({
    outputType,
    visUiConfig,
    metadataStore,
}: {
    outputType: OutputType
    visUiConfig: VisUiConfigState
    metadataStore: MetadataStore
}): TooltipConfig => {
    const layoutSelectionTooltipConfig = getLayoutSelectionTooltipConfig({
        visUiConfig,
        metadataStore,
    })
    if (layoutSelectionTooltipConfig) {
        return layoutSelectionTooltipConfig
    }

    const { visualizationType } = visUiConfig
    const layoutDimensionIds = selectLayoutAllDimensionIds(visUiConfig)

    const { tetId, programIds, programStageIds } = resolveLayoutContext(
        layoutDimensionIds,
        metadataStore
    )

    /* The cell value is not a layout dimension, but it carries the same
     * program/stage/TET context and the output type has to be valid for it too
     * — a cell value from another program is what the "multiple programs" rule
     * is there to catch. Only a pivot table has one: in a line list it is
     * neither shown nor sent, so it must not make an output type look invalid
     * for a reason nothing on screen explains. */
    const cellValueContext = resolveCellValueContext(
        visualizationType === 'PIVOT_TABLE'
            ? visUiConfig.cellValue?.id
            : undefined,
        metadataStore
    )

    const dimensionTypeCount = (dimensionType: string): number =>
        layoutDimensionIds.filter(
            (dimensionId) =>
                metadataStore.getDimensionMetadataItemOrThrow(dimensionId)
                    .dimensionType === dimensionType
        ).length

    const tetIdsInLayout = new Set(
        layoutDimensionIds
            .map(
                (dimensionId) =>
                    metadataStore.getDimensionMetadataItemOrThrow(dimensionId)
                        .trackedEntityTypeId
            )
            .filter(Boolean)
    )

    // Unique TET ids in layout and value axis
    const selectedTetIds = new Set(tetIdsInLayout)
    if (cellValueContext.tetId) {
        selectedTetIds.add(cellValueContext.tetId)
    }

    const hasCategoryInLayout = dimensionTypeCount('CATEGORY') > 0
    const hasCategoryOptionGroupSetInLayout =
        dimensionTypeCount('CATEGORY_OPTION_GROUP_SET') > 0
    /* Layout-only: a cell value on its own is not a layout, so it must not make
     * an empty one look valid. */
    const hasNoProgramInLayout = programIds.length === 0
    const selectedProgramIds = new Set([
        ...programIds,
        ...cellValueContext.programIds,
    ])
    const hasMultipleProgramsSelected = selectedProgramIds.size > 1
    const hasEventProgramSelected = [...selectedProgramIds].some((programId) =>
        isDataSourceProgramWithoutRegistration(
            metadataStore.getProgramMetadataItemOrThrow(programId)
        )
    )
    switch (outputType) {
        case 'EVENT':
            return getEventTooltipConfig({
                hasNoProgramInLayout,
                hasMultipleProgramsSelected,
                hasMultipleProgramStagesSelected:
                    new Set([
                        ...programStageIds,
                        ...cellValueContext.programStageIds,
                    ]).size > 1,
                /* An event program has no tracked entity type, so with an
                 * event program in the layout a tracked entity type can only
                 * come from a dimension of one, such as an attribute. */
                hasTrackedEntityDimensionWithEventProgram:
                    hasEventProgramSelected &&
                    Boolean(tetId || cellValueContext.tetId),
                visualizationType,
            })
        case 'ENROLLMENT':
            return getEnrollmentTooltipConfig({
                hasEventOnlyCellValueAggregation:
                    hasEventOnlyCellValueAggregation(
                        visUiConfig,
                        metadataStore
                    ),
                hasEventProgramSelected,
                hasCategoryInLayout,
                hasCategoryOptionGroupSetInLayout,
                hasNoProgramInLayout,
                hasMultipleProgramsSelected,
                visualizationType,
            })
        case 'TRACKED_ENTITY_INSTANCE':
            return getTrackedEntityInstanceTooltipConfig({
                hasEventProgramSelected,
                hasCategoryInLayout,
                hasCategoryOptionGroupSetInLayout,
                hasCompletedOnInLayout:
                    layoutDimensionIds.includes('completed'),
                hasMultipleProgramsSelected,
                hasMultipleTetSelected: selectedTetIds.size > 1,
                hasNoTetInLayout: !tetId,
                hasProgramIndicatorsInLayout:
                    dimensionTypeCount('PROGRAM_INDICATOR') > 0,
                visualizationType,
            })
    }
}
