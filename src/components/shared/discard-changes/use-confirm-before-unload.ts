import { useAppStore } from '@hooks'
import { getHasUnsavedChanges } from '@modules/visualization/state'
import { useEffect } from 'react'

/* Closing or reloading the tab can't show the app's own modal: the browser
 * shows its own generic prompt instead, with text the page can't set. */
export const useConfirmBeforeUnload = () => {
    const store = useAppStore()

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            const { savedVis, currentVis } = store.getState()

            if (getHasUnsavedChanges(savedVis, currentVis)) {
                event.preventDefault()
            }
        }

        window.addEventListener('beforeunload', onBeforeUnload)

        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [store])
}
