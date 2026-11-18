import type { AnalyticsModule } from '@test-utils/relative-periods-names-stub'
import { configure } from '@testing-library/dom'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import ResizeObserver from 'resize-observer-polyfill'
import { expect, afterEach, beforeEach, vi } from 'vitest'
import 'vitest-canvas-mock'

expect.extend(matchers)

vi.mock('@dhis2/analytics', async (importOriginal) => {
    const analytics = await importOriginal<AnalyticsModule>()
    const { stubUseRelativePeriodsNames } =
        await import('@test-utils/relative-periods-names-stub')
    return {
        ...analytics,
        useRelativePeriodsNames: stubUseRelativePeriodsNames(analytics),
    }
})

configure({
    testIdAttribute: 'data-test',
})
// Emulate CSS.supports API
// Needed with Highcharts >= 12.2.0
// See: https://github.com/highcharts/highcharts/issues/22910
global.CSS.supports = () => true

// Add ResizeObserver polyfill
global.ResizeObserver = ResizeObserver

/* Store creation reads preferences from localStorage, so one test's change
 * would otherwise leak into the next. */
beforeEach(() => {
    globalThis.localStorage.clear()
})

afterEach(() => {
    cleanup()
})
