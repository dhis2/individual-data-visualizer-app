import type { CachedData } from '@components/app-wrapper/cached-data/cached-data-provider'
import { toCurrentUser } from '@components/app-wrapper/cached-data/current-user'
import { getRelativePeriodsName } from '@dhis2/analytics'
import type { AppCachedData } from '@types'
import meData from './__fixtures__/me.json'

/* For specs that render a metadata provider without the cached data provider
 * it reads from. */
export const stubCachedData = (): CachedData => ({
    relativePeriodsNames: getRelativePeriodsName(),
    currentUser: toCurrentUser(meData),
})

export const stubAppCachedData =
    (rootOrgUnits: AppCachedData['rootOrgUnits'] = []) =>
    (): Pick<AppCachedData, 'rootOrgUnits' | 'relativePeriodsNames'> => ({
        rootOrgUnits,
        relativePeriodsNames: getRelativePeriodsName(),
    })
