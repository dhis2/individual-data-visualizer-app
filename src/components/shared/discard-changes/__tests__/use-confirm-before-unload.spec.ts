import { populatedVis } from '@components/layout-panel/bottom-bar/__fixtures__/unapplied-changes'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import type { RootState } from '@types'
import { describe, it, expect } from 'vitest'
import { useConfirmBeforeUnload } from '../use-confirm-before-unload'

const renderHookWithState = (preloadedState: Partial<RootState>) =>
    renderHookWithAppWrapper(useConfirmBeforeUnload, {
        partialStore: { preloadedState },
    })

const unloadPage = () => {
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    return event
}

describe('useConfirmBeforeUnload', () => {
    it('lets the page unload when there are no changes', async () => {
        await renderHookWithState({})

        expect(unloadPage().defaultPrevented).toBe(false)
    })

    it('asks the browser to confirm when there are changes', async () => {
        await renderHookWithState({ currentVis: populatedVis })

        expect(unloadPage().defaultPrevented).toBe(true)
    })

    it('stops asking once unmounted', async () => {
        const { unmount } = await renderHookWithState({
            currentVis: populatedVis,
        })

        unmount()

        expect(unloadPage().defaultPrevented).toBe(false)
    })
})
