import type { AsyncDataResult } from '@components/app-wrapper/cached-data/cached-data-provider'
import { useRelativePeriodsNames } from '@dhis2/analytics'

export type RelativePeriodsNamesData = {
    relativePeriodsNames: Record<string, string>
}

export const useRelativePeriodsNamesData =
    (): AsyncDataResult<RelativePeriodsNamesData> => {
        const { relativePeriodsNames, loading, error } =
            useRelativePeriodsNames()
        return { data: { relativePeriodsNames }, loading, error }
    }
