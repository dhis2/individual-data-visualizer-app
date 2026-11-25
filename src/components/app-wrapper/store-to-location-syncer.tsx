import { useAppDispatch, useAppSelector, useAppStore } from '@hooks'
import { getNavigationStateFromLocation, history } from '@modules/history'
import {
    getPendingNavigation,
    setNavigationState,
} from '@store/navigation-slice'
import { tRequestNavigation } from '@store/thunks'
import type { Location } from 'history'
import queryString from 'query-string'
import { useEffect, useRef } from 'react'

export const StoreToLocationSyncer = () => {
    const lastLocationRef = useRef<Location | null>(null)
    const store = useAppStore()
    const dispatch = useAppDispatch()
    const { visualizationId, interpretationId } = useAppSelector(
        (state) => state.navigation
    )
    const hasPendingNavigation = useAppSelector(
        (state) => getPendingNavigation(state) !== null
    )

    // Sync URL → Redux
    useEffect(() => {
        const updateFromLocation = (location: Location) => {
            /* GLOBAL SHELL RELATED CODE:
             * Avoid duplicate actions for the same update object. This also
             * avoids a loop, because dispatching a pop state effect below also
             * triggers listeners again (but with the same location object key) */
            const { key, pathname, search } = location
            if (
                key === lastLocationRef.current?.key &&
                pathname === lastLocationRef.current?.pathname &&
                search === lastLocationRef.current?.search
            ) {
                return
            }
            lastLocationRef.current = location
            // Dispatch this event for external routing listeners to observe,
            // e.g. global shell
            const popStateEvent = new PopStateEvent('popstate', {
                state: location.state,
            })
            dispatchEvent(popStateEvent)

            const locationState = getNavigationStateFromLocation()
            const { navigation: storeState } = store.getState()
            /* The app's own navigation updates the store before the URL, so
             * only browser back/forward and a typed URL get here with another
             * visualization. */
            if (locationState.visualizationId !== storeState.visualizationId) {
                dispatch(tRequestNavigation(locationState))
            } else if (
                locationState.interpretationId !== storeState.interpretationId
            ) {
                dispatch(setNavigationState(locationState))
            }
        }

        // Initial sync
        updateFromLocation(history.location)

        // Listen for changes
        const unlisten = history.listen(({ location }) => {
            updateFromLocation(location)
        })

        return unlisten
    }, [dispatch, store])

    // Sync Redux → URL
    useEffect(() => {
        /* Browser back/forward changes the URL before the user confirms
         * leaving, so the URL is left alone until then. Cancelling puts it
         * back here. */
        if (
            hasPendingNavigation ||
            !visualizationId ||
            // Treat `/` and `/new` the same
            (visualizationId === 'new' && history.location.pathname === '/')
        ) {
            return
        }
        const currentPath = history.location.pathname + history.location.search
        let newPath = `/${visualizationId}`

        if (interpretationId) {
            const interpretationQueryString = queryString.stringify({
                interpretationId: interpretationId,
            })
            newPath += `?${interpretationQueryString}`
        }

        if (currentPath !== newPath) {
            history.push(newPath)
        }
    }, [visualizationId, interpretationId, hasPendingNavigation])

    return null
}
