import { isEngineError } from '@api/parse-engine-error'
import { setSidebarWidthToLocalStorage } from '@components/sidebar/local-storage'
import { isUnauthorizedError } from '@modules/error/unauthorized-error'
import { setLastUsedVisualizationTypeToLocalStorage } from '@modules/visualization/local-storage'
import { isAnyOf, isRejectedWithValue } from '@reduxjs/toolkit'
import { setUnauthorizedError } from './loader-slice'
import { startAppListening } from './middleware-listener'
import { setNavigationState } from './navigation-slice'
import {
    tClearVisualization,
    tLoadSavedVisualization,
    tSeedDefaultGrouping,
} from './thunks'
import {
    resetUiSidebarWidth,
    setUiActiveDimensionModal,
    setUiSidebarWidth,
} from './ui-slice'
import {
    addVisUiConfigLayoutDimension,
    addVisUiConfigLayoutDimensions,
    setVisUiConfigOption,
    setVisUiConfigVisualizationType,
} from './vis-ui-config-slice'

export const registerAppListeners = () => {
    startAppListening({
        actionCreator: setNavigationState,
        effect: (action, { dispatch, getOriginalState }) => {
            const originalState = getOriginalState()
            const originalVisualizationId =
                originalState.navigation.visualizationId
            const newVisualizationId = action.payload.visualizationId
            /* Saving as a new visualization loads it before navigating to it */
            const isAlreadyLoaded =
                originalState.currentVis.id === newVisualizationId

            if (isAlreadyLoaded) {
                return
            }
            /* Since the InterpretationsModal loads its own visualization plugin
             * we are only interested in visualizationId changes in this
             * listener middleware */
            if (originalVisualizationId !== newVisualizationId) {
                // always clear the "old" visualization to keep consistency between the URL address, metadata store and Redux store
                dispatch(tClearVisualization())

                if (newVisualizationId !== 'new') {
                    dispatch(
                        tLoadSavedVisualization({
                            id: newVisualizationId,
                            updateStatistics: true,
                        })
                    )
                }
            } else if (newVisualizationId === 'new') {
                dispatch(tClearVisualization())
            }
        },
    })

    startAppListening({
        actionCreator: setVisUiConfigVisualizationType,
        effect: (action, { dispatch, getState }) => {
            setLastUsedVisualizationTypeToLocalStorage(action.payload)

            /* A custom title rarely fits another visualization type, so it is
             * reset to Auto generated. A hidden title stays hidden. */
            if (!getState().visUiConfig.options.hideTitle) {
                dispatch(setVisUiConfigOption({ key: 'title', value: '' }))
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(setUiSidebarWidth, resetUiSidebarWidth),
        effect: (_, { getState }) => {
            setSidebarWidthToLocalStorage(getState().ui.sidebarWidth)
        },
    })

    startAppListening({
        matcher: isAnyOf(
            addVisUiConfigLayoutDimension,
            addVisUiConfigLayoutDimensions,
            setUiActiveDimensionModal
        ),
        effect: (action, { dispatch }) => {
            if (addVisUiConfigLayoutDimension.match(action)) {
                dispatch(tSeedDefaultGrouping([action.payload.dimensionId]))
            } else if (addVisUiConfigLayoutDimensions.match(action)) {
                dispatch(tSeedDefaultGrouping(action.payload.dimensionIds))
            } else if (
                setUiActiveDimensionModal.match(action) &&
                action.payload !== null
            ) {
                dispatch(tSeedDefaultGrouping([action.payload]))
            }
        },
    })

    /* Every RTK request rejects with the parsed engine error, so this one
     * listener catches a 401 from any of them */
    startAppListening({
        matcher: isRejectedWithValue,
        effect: (action, { dispatch }) => {
            if (
                isEngineError(action.payload) &&
                isUnauthorizedError(action.payload)
            ) {
                dispatch(setUnauthorizedError(action.payload))
            }
        },
    })
}
