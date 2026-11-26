import type { EngineError } from '@api/parse-engine-error'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface LoaderState {
    visualizationLoadError: EngineError | null
    isVisualizationLoading: boolean
    unauthorizedError: EngineError | null
}

export const initialState: LoaderState = {
    visualizationLoadError: null,
    isVisualizationLoading: false,
    unauthorizedError: null,
}

export const loaderSlice = createSlice({
    name: 'loader',
    initialState,
    reducers: {
        setIsVisualizationLoading: (state, action: PayloadAction<boolean>) => {
            state.isVisualizationLoading = action.payload
            if (action.payload) {
                state.visualizationLoadError = null
            }
        },
        setVisualizationLoadError: (
            state,
            action: PayloadAction<EngineError>
        ) => {
            state.visualizationLoadError = action.payload
        },
        clearVisualizationLoadError: (state) => {
            state.visualizationLoadError = initialState.visualizationLoadError
        },
        setUnauthorizedError: (state, action: PayloadAction<EngineError>) => {
            state.unauthorizedError = action.payload
        },
        clearUnauthorizedError: (state) => {
            state.unauthorizedError = null
        },
    },
    selectors: {
        getIsVisualizationLoading: (state) => state.isVisualizationLoading,
        getVisualizationLoadError: (state) => state.visualizationLoadError,
        getUnauthorizedError: (state) => state.unauthorizedError,
    },
})

export const {
    setIsVisualizationLoading,
    setVisualizationLoadError,
    clearVisualizationLoadError,
    setUnauthorizedError,
    clearUnauthorizedError,
} = loaderSlice.actions
export const {
    getIsVisualizationLoading,
    getVisualizationLoadError,
    getUnauthorizedError,
} = loaderSlice.selectors
