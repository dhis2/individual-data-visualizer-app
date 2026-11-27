import type { ThunkExtraArg } from '@api/custom-base-query'
import { eventVisualizationsApi } from '@api/event-visualizations-api'
import { legendSetsApi } from '@api/legend-sets-api'
import { isEngineError, parseEngineError } from '@api/parse-engine-error'
import { extractDataSourceIdFromVisualization } from '@modules/data-source'
import { canDimensionHaveLegendSets } from '@modules/dimension/grouping'
import { isUnauthorizedError } from '@modules/error/unauthorized-error'
import { logger } from '@modules/logger'
import {
    buildCurrentVisFromVisUiConfig,
    toCurrentVis,
} from '@modules/visualization/current-vis'
import {
    isCurrentVisualizationPersisted,
    isVisualizationEmpty,
} from '@modules/visualization/guards'
import { setLastUsedVisualizationTypeToLocalStorage } from '@modules/visualization/local-storage'
import { getVisUiConfigSorting } from '@modules/visualization/sorting'
import { getHasUnsavedChanges } from '@modules/visualization/state'
import { getVisualizationUiConfig } from '@modules/visualization/ui-config'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { AppDispatch, RootState, Sorting } from '@types'
import { clearCurrentVis, setCurrentVis } from './current-vis-slice'
import { setDataSourceId } from './dimensions-selection-slice'
import {
    clearUnauthorizedError,
    setIsVisualizationLoading,
    setVisualizationLoadError,
} from './loader-slice'
import {
    setNavigationState,
    setPendingNavigation,
    type NavigationTarget,
} from './navigation-slice'
import { clearSavedVis, setSavedVis } from './saved-vis-slice'
import { clearUi, setUiUpdateAnimationShowingFor } from './ui-slice'
import {
    clearVisUiConfig,
    setVisUiConfig,
    setVisUiConfigGroupingByDimension,
    setVisUiConfigSorting,
} from './vis-ui-config-slice'

type AppAsyncThunkConfig = {
    state: RootState
    dispatch: AppDispatch
    extra: ThunkExtraArg
    rejectValue?: unknown
    serializedErrorType?: unknown
    fulfillMeta?: unknown
    rejectMeta?: unknown
}

type AppThunk = () => (
    dispatch: AppDispatch,
    getState: () => RootState,
    extra: ThunkExtraArg
) => void

export const tClearVisualization: AppThunk = () => (dispatch) => {
    dispatch(clearUi())
    dispatch(clearSavedVis())
    dispatch(clearCurrentVis())
    dispatch(clearVisUiConfig())
}

type LoadSavedVisualizationPayload = {
    id: string
    updateStatistics?: boolean
}

export const tLoadSavedVisualization = createAsyncThunk<
    void,
    LoadSavedVisualizationPayload,
    AppAsyncThunkConfig
>(
    'visualization/load',
    async ({ id, updateStatistics = false }, { dispatch, getState, extra }) => {
        dispatch(setIsVisualizationLoading(true))

        const { data, error } = await dispatch(
            eventVisualizationsApi.endpoints.getVisualization.initiate(id, {
                // This is consistent with other analytics apps
                forceRefetch: true,
            })
        )
        if (data) {
            try {
                const currentVis = toCurrentVis(data)
                const selectedDataSourceId =
                    extractDataSourceIdFromVisualization(currentVis)
                const currentOptions = getState().visUiConfig.options

                dispatch(setSavedVis(data))
                dispatch(setDataSourceId(selectedDataSourceId))
                dispatch(
                    setVisUiConfig(
                        getVisualizationUiConfig(
                            currentVis,
                            extra.metadataStore,
                            currentOptions
                        )
                    )
                )
                dispatch(setCurrentVis(currentVis))
                dispatch(setIsVisualizationLoading(false))

                if (updateStatistics) {
                    // update most viewed statistics
                    extra.engine
                        .mutate({
                            resource: 'dataStatistics',
                            type: 'create',
                            params: {
                                eventType: 'EVENT_VISUALIZATION_VIEW',
                                favorite: id,
                            },
                            data: {},
                        })
                        .catch((error) => logger.error(error))
                }
            } catch (processingError) {
                /* A failure turning the fetched visualization into current-vis
                 * state is a bug, not a fetch error; parseEngineError tags it
                 * 'runtime', so it surfaces as fatal. */
                dispatch(
                    setVisualizationLoadError(parseEngineError(processingError))
                )
                dispatch(setIsVisualizationLoading(false))
            }
        } else if (error) {
            /* The base query parses anything that came off the wire; only
             * RTK's own serialized errors still need it. Parsing twice flattens
             * a fetch failure into a fatal 'runtime' error. */
            dispatch(
                setVisualizationLoadError(
                    isEngineError(error) ? error : parseEngineError(error)
                )
            )
            dispatch(setIsVisualizationLoading(false))
        }
    }
)

/* The app remounts on retry and refetches what it shows, but a visualization
 * that failed to load is only loaded on navigation */
export const tRetryAfterUnauthorized: AppThunk = () => (dispatch, getState) => {
    const { loader, navigation } = getState()

    dispatch(clearUnauthorizedError())

    if (
        loader.visualizationLoadError &&
        isUnauthorizedError(loader.visualizationLoadError) &&
        navigation.visualizationId !== 'new'
    ) {
        dispatch(tLoadSavedVisualization({ id: navigation.visualizationId }))
    }
}

export const tUpdateCurrentVisFromVisUiConfig =
    () =>
    (
        dispatch: AppDispatch,
        getState: () => RootState,
        extra: ThunkExtraArg
    ) => {
        const { currentVis, visUiConfig } = getState()

        // Applying the config commits to the vis type; loading one does not.
        setLastUsedVisualizationTypeToLocalStorage(
            visUiConfig.visualizationType
        )

        const nextCurrentVis = buildCurrentVisFromVisUiConfig({
            previousCurrentVis: currentVis,
            visUiConfig,
            metadataStore: extra.metadataStore,
        })

        /* The sort is dropped with its column, so adding the column back later
         * starts unsorted. */
        if (visUiConfig.sorting && !nextCurrentVis.sorting) {
            dispatch(setVisUiConfigSorting(undefined))
        }
        dispatch(setCurrentVis(nextCurrentVis))
        dispatch(
            setUiUpdateAnimationShowingFor(
                isVisualizationEmpty(currentVis) ? null : visUiConfig.outputType
            )
        )
    }

/* Sorting applies straight away, but only the sort: other changes to the
 * config stay unapplied. */
export const tSetCurrentVisSorting =
    (sorting: Sorting | undefined) =>
    (dispatch: AppDispatch, getState: () => RootState) => {
        const { currentVis } = getState()

        if (isVisualizationEmpty(currentVis)) {
            throw new Error('Sorting called with an empty visualization')
        }

        const sortingArray = sorting ? [sorting] : undefined

        dispatch(
            setVisUiConfigSorting(
                getVisUiConfigSorting(sortingArray, currentVis)
            )
        )
        dispatch(setCurrentVis({ ...currentVis, sorting: sortingArray }))
    }

/* A line list defaults to no grouping, which is the absence of state, so only
 * pivot tables need a default applied. Keyed off presence rather than value so
 * an explicit "No grouping" choice is never overwritten by the default.
 *
 * A thunk rather than the listener effect itself because the listener
 * middleware is created without an extra argument, so only a thunk can reach
 * the metadata store. */
export const tSeedDefaultGrouping =
    (dimensionIds: string[]) =>
    async (
        dispatch: AppDispatch,
        getState: () => RootState,
        extra: ThunkExtraArg
    ) => {
        if (getState().visUiConfig.visualizationType !== 'PIVOT_TABLE') {
            return
        }

        const seedable = dimensionIds.filter((dimensionId) => {
            if (dimensionId in getState().visUiConfig.conditionsByDimension) {
                return false
            }
            const dimension =
                extra.metadataStore.getDimensionMetadataItem(dimensionId)

            return Boolean(dimension && canDimensionHaveLegendSets(dimension))
        })

        await Promise.all(
            seedable.map(async (dimensionId) => {
                const dimensionType =
                    extra.metadataStore.getDimensionMetadataItem(
                        dimensionId
                    )?.dimensionType

                if (!dimensionType) {
                    return
                }

                try {
                    const legendSets = await dispatch(
                        legendSetsApi.endpoints.getLegendSetsByDimension.initiate(
                            { dimensionId, dimensionType }
                        )
                    ).unwrap()

                    const defaultLegendSet = legendSets[0]

                    /* Re-checked because the user can pick a grouping while
                     * the legend sets are still being fetched. */
                    const isStillUnset = !(
                        dimensionId in
                        getState().visUiConfig.conditionsByDimension
                    )

                    if (defaultLegendSet && isStillUnset) {
                        dispatch(
                            setVisUiConfigGroupingByDimension({
                                dimensionId,
                                legendSet: defaultLegendSet.id,
                            })
                        )
                    }
                } catch (error) {
                    logger.error(
                        `Could not resolve legend sets for dimension "${dimensionId}"`,
                        error
                    )
                }
            })
        )
    }

const tNavigate =
    (target: NavigationTarget) =>
    (dispatch: AppDispatch, getState: () => RootState) => {
        const { currentVis } = getState()

        if (
            isCurrentVisualizationPersisted(currentVis) &&
            currentVis.id === target.visualizationId
        ) {
            /* Opening the visualization that is already open reloads it.
             * Cleared first, so the canvas starts over as for another
             * visualization, without unsaved changes or the page size */
            dispatch(tClearVisualization())
            dispatch(
                tLoadSavedVisualization({
                    id: target.visualizationId,
                    updateStatistics: false,
                })
            )
        } else {
            dispatch(setNavigationState(target))
        }
    }

/* For navigation the user asks for, which waits for confirmation when it
 * would lose unsaved changes. The app's own navigation, after deleting or
 * saving as, sets the navigation state directly. */
export const tRequestNavigation =
    (target: NavigationTarget) =>
    (dispatch: AppDispatch, getState: () => RootState) => {
        const { savedVis, currentVis } = getState()

        if (getHasUnsavedChanges(savedVis, currentVis)) {
            dispatch(setPendingNavigation(target))
        } else {
            dispatch(tNavigate(target))
        }
    }

export const tConfirmPendingNavigation: AppThunk =
    () => (dispatch, getState) => {
        const { pendingNavigation } = getState().navigation

        if (!pendingNavigation) {
            return
        }

        dispatch(setPendingNavigation(null))
        dispatch(tNavigate(pendingNavigation))
    }
