import type { CustomDataProvider } from '@dhis2/app-runtime'
import type { ComponentProps } from 'react'
import dataOutputPeriodTypesData from './__fixtures__/data-output-period-types.json'

type QueryData = ComponentProps<typeof CustomDataProvider>['data']

export const mockRuntimeConfig = {
    baseUrl: '..',
    apiVersion: 44,
    serverVersion: { major: 2, minor: 44, patch: 0, full: '2.44.0' },
}

/* The requests useRelativePeriodsNames makes on 2.44. */
export const mockPeriodTypesQueryData: QueryData = {
    /* The JSON import types the period ids missing from some period types as
     * `?: undefined`, which is not JSON. */
    'configuration/dataOutputPeriodTypes':
        dataOutputPeriodTypesData as unknown as QueryData[string],
    'systemSettings/keyAnalysisRelativePeriod': {
        keyAnalysisRelativePeriod: 'LAST_12_MONTHS',
    },
    'systemSettings/analyticsWeeklyStart': { analyticsWeeklyStart: 'WEEKLY' },
    'systemSettings/analyticsFinancialYearStart': {
        analyticsFinancialYearStart: 'FINANCIAL_YEAR_OCTOBER',
    },
}
