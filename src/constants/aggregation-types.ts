import i18n from '@dhis2/d2-i18n'
import type { AggregationType } from '@types'

/* Analytics supports these for enrollment aggregate too. */
const ALL_OUTPUT_AGGREGATION_TYPES: ReadonlySet<AggregationType> = new Set([
    'SUM',
    'AVERAGE',
    'COUNT',
    'MIN',
    'MAX',
    'STDDEV',
    'VARIANCE',
])

/* Analytics applies these only to event aggregate: enrollment aggregate
 * rejects them or returns wrong data. */
export const EVENT_ONLY_AGGREGATION_TYPES: ReadonlySet<AggregationType> =
    new Set([
        'LAST',
        'LAST_AVERAGE_ORG_UNIT',
        'FIRST',
        'FIRST_AVERAGE_ORG_UNIT',
    ])

/* The types a cell value can be aggregated by. Analytics rejects the others or
 * returns wrong data for them. `DEFAULT` is supported too, when the item's own
 * type is one of these. */
export const SUPPORTED_AGGREGATION_TYPES: ReadonlySet<AggregationType> =
    new Set([...ALL_OUTPUT_AGGREGATION_TYPES, ...EVENT_ONLY_AGGREGATION_TYPES])

export const aggregationTypeDisplayNames: Record<AggregationType, string> = {
    DEFAULT: i18n.t('Use item default'),
    SUM: i18n.t('Sum'),
    AVERAGE: i18n.t('Average'),
    AVERAGE_SUM_ORG_UNIT: i18n.t('Average (sum in org unit hierarchy)'),
    LAST: i18n.t('Last value (sum in org unit hierarchy)'),
    LAST_AVERAGE_ORG_UNIT: i18n.t('Last value (average in org unit hierarchy)'),
    LAST_LAST_ORG_UNIT: i18n.t(
        'Last value in period (last value in org unit hierarchy)'
    ),
    LAST_IN_PERIOD: i18n.t('Last value in period (sum in org unit hierarchy)'),
    LAST_IN_PERIOD_AVERAGE_ORG_UNIT: i18n.t(
        'Last value in period (average in org unit hierarchy)'
    ),
    FIRST: i18n.t('First value (sum in org unit hierarchy)'),
    FIRST_AVERAGE_ORG_UNIT: i18n.t(
        'First value (average in org unit hierarchy)'
    ),
    FIRST_FIRST_ORG_UNIT: i18n.t(
        'First value in period (first value in org unit hierarchy)'
    ),
    COUNT: i18n.t('Count'),
    STDDEV: i18n.t('Standard deviation'),
    VARIANCE: i18n.t('Variance'),
    MIN: i18n.t('Min'),
    MAX: i18n.t('Max'),
    MIN_SUM_ORG_UNIT: i18n.t('Min value (sum in org unit hierarchy)'),
    MAX_SUM_ORG_UNIT: i18n.t('Max value (sum in org unit hierarchy)'),
    NONE: i18n.t('None'),
    CUSTOM: i18n.t('Custom'),
}
