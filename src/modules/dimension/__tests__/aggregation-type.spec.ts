import { describe, it, expect } from 'vitest'
import {
    FALLBACK_AGGREGATION_TYPE,
    isEventOnlyAggregationType,
    isSupportedAggregationType,
    replaceDefaultForUnsupportedItem,
    replaceUnsupportedAggregationType,
    resolveAggregationType,
} from '../aggregation-type'

describe('isSupportedAggregationType', () => {
    it.each([
        'SUM',
        'AVERAGE',
        'COUNT',
        'MIN',
        'MAX',
        'STDDEV',
        'VARIANCE',
        'LAST',
        'LAST_AVERAGE_ORG_UNIT',
        'FIRST',
        'FIRST_AVERAGE_ORG_UNIT',
    ] as const)('supports %s', (aggregationType) => {
        expect(isSupportedAggregationType(aggregationType)).toBe(true)
    })

    it.each([
        'DEFAULT',
        'NONE',
        'CUSTOM',
        'AVERAGE_SUM_ORG_UNIT',
        'LAST_IN_PERIOD',
        'LAST_IN_PERIOD_AVERAGE_ORG_UNIT',
        'LAST_LAST_ORG_UNIT',
        'FIRST_FIRST_ORG_UNIT',
        'MIN_SUM_ORG_UNIT',
        'MAX_SUM_ORG_UNIT',
    ] as const)('does not support %s', (aggregationType) => {
        expect(isSupportedAggregationType(aggregationType)).toBe(false)
    })

    it('does not support a missing type', () => {
        expect(isSupportedAggregationType(undefined)).toBe(false)
    })
})

describe('isEventOnlyAggregationType', () => {
    it.each([
        'LAST',
        'LAST_AVERAGE_ORG_UNIT',
        'FIRST',
        'FIRST_AVERAGE_ORG_UNIT',
    ] as const)('marks %s as event only', (aggregationType) => {
        expect(isEventOnlyAggregationType(aggregationType)).toBe(true)
    })

    it.each(['SUM', 'AVERAGE', 'DEFAULT'] as const)(
        'does not mark %s as event only',
        (aggregationType) => {
            expect(isEventOnlyAggregationType(aggregationType)).toBe(false)
        }
    )
})

describe('resolveAggregationType', () => {
    it('keeps an explicit choice as it is', () => {
        expect(
            resolveAggregationType('SUM', { aggregationType: 'AVERAGE' })
        ).toBe('SUM')
    })

    it("resolves DEFAULT to the item's own aggregation type", () => {
        expect(
            resolveAggregationType('DEFAULT', { aggregationType: 'MAX' })
        ).toBe('MAX')
    })

    it("resolves DEFAULT to the item's event-only aggregation type", () => {
        expect(
            resolveAggregationType('DEFAULT', { aggregationType: 'LAST' })
        ).toBe('LAST')
    })

    it.each(['NONE', 'CUSTOM', 'LAST_IN_PERIOD'] as const)(
        'resolves DEFAULT to the fallback when the item aggregates by %s',
        (aggregationType) => {
            expect(resolveAggregationType('DEFAULT', { aggregationType })).toBe(
                FALLBACK_AGGREGATION_TYPE
            )
        }
    )

    /* Dimensions whose metadata came from an analytics response rather than the
     * sidebar carry no aggregation type at all. */
    it('resolves DEFAULT to the fallback when the item has no aggregation type', () => {
        expect(resolveAggregationType('DEFAULT', {})).toBe(
            FALLBACK_AGGREGATION_TYPE
        )
    })
})

describe('replaceDefaultForUnsupportedItem', () => {
    it.each(['NONE', 'CUSTOM', 'MIN_SUM_ORG_UNIT'] as const)(
        'replaces DEFAULT with the fallback when the item aggregates by %s',
        (aggregationType) => {
            expect(
                replaceDefaultForUnsupportedItem('DEFAULT', { aggregationType })
            ).toBe(FALLBACK_AGGREGATION_TYPE)
        }
    )

    it.each(['SUM', 'LAST'] as const)(
        'keeps DEFAULT when the item aggregates by %s',
        (aggregationType) => {
            expect(
                replaceDefaultForUnsupportedItem('DEFAULT', { aggregationType })
            ).toBe('DEFAULT')
        }
    )

    it('keeps DEFAULT when the item has no aggregation type', () => {
        expect(replaceDefaultForUnsupportedItem('DEFAULT', {})).toBe('DEFAULT')
    })

    it('keeps an explicit choice for an item that aggregates by NONE', () => {
        expect(
            replaceDefaultForUnsupportedItem('MAX', { aggregationType: 'NONE' })
        ).toBe('MAX')
    })
})

describe('replaceUnsupportedAggregationType', () => {
    it.each([
        'NONE',
        'CUSTOM',
        'AVERAGE_SUM_ORG_UNIT',
        'LAST_IN_PERIOD',
        'LAST_IN_PERIOD_AVERAGE_ORG_UNIT',
        'MIN_SUM_ORG_UNIT',
        'MAX_SUM_ORG_UNIT',
    ] as const)('replaces %s with the fallback', (aggregationType) => {
        expect(
            replaceUnsupportedAggregationType(aggregationType, {
                aggregationType: 'SUM',
            })
        ).toBe(FALLBACK_AGGREGATION_TYPE)
    })

    it.each(['SUM', 'LAST', 'FIRST_AVERAGE_ORG_UNIT'] as const)(
        'keeps %s',
        (aggregationType) => {
            expect(
                replaceUnsupportedAggregationType(aggregationType, {
                    aggregationType: 'NONE',
                })
            ).toBe(aggregationType)
        }
    )

    it('replaces DEFAULT for an item with an unsupported type', () => {
        expect(
            replaceUnsupportedAggregationType('DEFAULT', {
                aggregationType: 'LAST_IN_PERIOD',
            })
        ).toBe(FALLBACK_AGGREGATION_TYPE)
    })

    it('keeps DEFAULT for an item with a supported type', () => {
        expect(
            replaceUnsupportedAggregationType('DEFAULT', {
                aggregationType: 'SUM',
            })
        ).toBe('DEFAULT')
    })
})
