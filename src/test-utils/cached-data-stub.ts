import type { PluginCachedData } from '@components/app-wrapper/cached-data/plugin-cached-data-provider'
import { getRelativePeriodsName } from '@dhis2/analytics'
import type { AppCachedData } from '@types'

/* For specs that render a metadata provider without the cached data provider
 * it reads from. */
export const stubPluginCachedData = (): PluginCachedData => ({
    relativePeriodsNames: getRelativePeriodsName(),
})

export const stubAppCachedData =
    (rootOrgUnits: AppCachedData['rootOrgUnits'] = []) =>
    (): Pick<AppCachedData, 'rootOrgUnits' | 'relativePeriodsNames'> => ({
        rootOrgUnits,
        relativePeriodsNames: getRelativePeriodsName(),
    })
