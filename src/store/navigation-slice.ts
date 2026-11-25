import { getNavigationStateFromLocation } from '@modules/history'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type NavigationTarget = {
    visualizationId: string | 'new'
    interpretationId?: string | null
}

export interface NavigationState {
    visualizationId: string | 'new'
    interpretationId: string | null
    /* Where the user asked to go while there are unsaved changes, kept until
     * they confirm or cancel leaving */
    pendingNavigation: NavigationTarget | null
}

export const initialState: NavigationState = {
    ...getNavigationStateFromLocation(),
    pendingNavigation: null,
}

export const navigationSlice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        setNavigationState: (
            state,
            action: PayloadAction<NavigationTarget>
        ) => {
            state.visualizationId = action.payload.visualizationId
            state.interpretationId = action.payload.interpretationId ?? null
        },
        setNavigationInterpretationId: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.interpretationId = action.payload
        },
        setPendingNavigation: (
            state,
            action: PayloadAction<NavigationTarget | null>
        ) => {
            state.pendingNavigation = action.payload
        },
    },
    selectors: {
        getNavigationInterpretationId: (state) => state.interpretationId,
        getPendingNavigation: (state) => state.pendingNavigation,
    },
})

export const {
    setNavigationState,
    setNavigationInterpretationId,
    setPendingNavigation,
} = navigationSlice.actions
export const { getNavigationInterpretationId, getPendingNavigation } =
    navigationSlice.selectors
