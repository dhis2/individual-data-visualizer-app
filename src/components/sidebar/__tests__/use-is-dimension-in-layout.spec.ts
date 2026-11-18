import { useIsDimensionInLayout } from '@components/sidebar/use-is-dimension-in-layout'
import {
    initialState as visUiConfigInitialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import type { VisUiConfigState } from '@store/vis-ui-config-slice'
import { renderHookWithAppWrapper } from '@test-utils/app-wrapper'
import { describe, expect, it } from 'vitest'

const renderWithVisUiConfig = (visUiConfig: Partial<VisUiConfigState>) =>
    renderHookWithAppWrapper(() => useIsDimensionInLayout('stage1.de1'), {
        partialStore: {
            reducer: { visUiConfig: visUiConfigSlice.reducer },
            preloadedState: {
                visUiConfig: { ...visUiConfigInitialState, ...visUiConfig },
            },
        },
    })

describe('useIsDimensionInLayout', () => {
    it('is true for a dimension on a layout axis', async () => {
        const { result } = await renderWithVisUiConfig({
            visualizationType: 'PIVOT_TABLE',
            layout: { columns: [], rows: ['stage1.de1'], filters: [] },
        })
        expect(result.current).toBe(true)
    })

    /* Cell value and layout are non-exclusive: the dimension used as the cell
     * value stays available in the sidebar. */
    it('is false for the dimension used as the cell value', async () => {
        const { result } = await renderWithVisUiConfig({
            visualizationType: 'PIVOT_TABLE',
            cellValue: { id: 'stage1.de1', aggregationType: 'SUM' },
        })
        expect(result.current).toBe(false)
    })
})
