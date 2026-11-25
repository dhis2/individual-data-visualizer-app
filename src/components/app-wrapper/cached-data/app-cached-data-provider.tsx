import {
    CachedDataProvider,
    useCachedData,
    type CachedData,
} from '@components/app-wrapper/cached-data/cached-data-provider'
import { toIntlLocale } from '@components/app-wrapper/cached-data/current-user'
import { useRelativePeriodsNames } from '@dhis2/analytics'
/* useDataQuery, not the RTK-query hooks: the Redux store is created from this
 * data, so it does not exist yet. */
// eslint-disable-next-line no-restricted-imports
import { useCurrentUserInfo, useDataQuery } from '@dhis2/app-runtime'
import type { Query } from '@dhis2/app-service-data'
import { freeze } from '@reduxjs/toolkit'
import type {
    OrganisationUnit,
    OrganisationUnitLevel,
    PickWithFieldFilters,
    SystemSettings,
} from '@types'
import type { FC, ReactNode } from 'react'

const rootOrgUnitsFields = ['id', 'displayName', 'name', 'path'] as const
const orgUnitLevelsFields = ['id', 'level', 'displayName', 'name'] as const
const query: Query = {
    systemSettings: {
        resource: 'systemSettings',
    },
    rootOrgUnits: {
        resource: 'organisationUnits',
        params: {
            fields: rootOrgUnitsFields.join(','),
            userDataViewFallback: true,
            paging: false,
        },
    },
    orgUnitLevels: {
        resource: 'organisationUnitLevels',
        params: {
            fields: orgUnitLevelsFields.join(','),
            paging: false,
        },
    },
}
type CurrentUserInfo = NonNullable<ReturnType<typeof useCurrentUserInfo>>
type CurrentUserData = Pick<
    CurrentUserInfo,
    'id' | 'username' | 'authorities'
> & {
    name: string
    settings?: Record<string, string | undefined>
}
type RootOrgUnitsData = Array<
    PickWithFieldFilters<Required<OrganisationUnit>, typeof rootOrgUnitsFields>
>
type OrgUnitLevelsData = Array<
    PickWithFieldFilters<
        Required<OrganisationUnitLevel>,
        typeof orgUnitLevelsFields
    >
>

type AppCachedQueryData = {
    systemSettings: SystemSettings
    rootOrgUnits: {
        organisationUnits: RootOrgUnitsData
    }
    orgUnitLevels: { organisationUnitLevels: OrgUnitLevelsData }
}
type DisplayNameProperty = 'displayName' | 'displayShortName'
type TransformedCurrentUserSettings = {
    dbLocale: string
    uiLocale: string
    displayProperty: string | undefined
    displayNameProperty: DisplayNameProperty
}
type TransformedSystemSettings = {
    dateFormat: SystemSettings['keyDateFormat']
    relativePeriod: SystemSettings['keyAnalysisRelativePeriod']
    digitGroupSeparator: SystemSettings['keyAnalysisDigitGroupSeparator']
    hideDailyPeriods: SystemSettings['keyHideDailyPeriods']
    hideWeeklyPeriods: SystemSettings['keyHideWeeklyPeriods']
    hideBiWeeklyPeriods: SystemSettings['keyHideBiWeeklyPeriods']
    hideMonthlyPeriods: SystemSettings['keyHideMonthlyPeriods']
    hideBiMonthlyPeriods: SystemSettings['keyHideBiMonthlyPeriods']
    ignoreApprovalYearThreshold: SystemSettings['keyIgnoreAnalyticsApprovalYearThreshold']
}
export type TransformedAppCachedData = {
    currentUser: CurrentUserData & { settings: TransformedCurrentUserSettings }
    systemSettings: TransformedSystemSettings
    rootOrgUnits: RootOrgUnitsData
    orgUnitLevels: OrgUnitLevelsData
    relativePeriodsNames: CachedData['relativePeriodsNames']
    locale: CachedData['locale']
}

const toCurrentUserData = ({
    id,
    username,
    displayName,
    authorities,
    settings,
}: CurrentUserInfo): CurrentUserData => ({
    id,
    username,
    name: displayName,
    authorities,
    settings,
})

const providerDataTransformation = (
    { systemSettings, rootOrgUnits, orgUnitLevels }: AppCachedQueryData,
    relativePeriodsNames: CachedData['relativePeriodsNames'],
    currentUser: CurrentUserData
): TransformedAppCachedData => {
    const displayNameProperty: DisplayNameProperty =
        currentUser.settings?.keyAnalysisDisplayProperty === 'name'
            ? 'displayName'
            : 'displayShortName'
    const transformedCurrentUser = {
        ...currentUser,
        settings: {
            dbLocale: toIntlLocale(currentUser.settings?.keyDbLocale),
            uiLocale: toIntlLocale(currentUser.settings?.keyUiLocale),
            displayProperty: currentUser.settings?.keyAnalysisDisplayProperty,
            displayNameProperty,
        },
    }
    const transformedSystemSettings: TransformedSystemSettings = {
        dateFormat: systemSettings.keyDateFormat,
        relativePeriod: systemSettings.keyAnalysisRelativePeriod,
        digitGroupSeparator: systemSettings.keyAnalysisDigitGroupSeparator,
        hideDailyPeriods: systemSettings.keyHideDailyPeriods,
        hideWeeklyPeriods: systemSettings.keyHideWeeklyPeriods,
        hideBiWeeklyPeriods: systemSettings.keyHideBiWeeklyPeriods,
        hideMonthlyPeriods: systemSettings.keyHideMonthlyPeriods,
        hideBiMonthlyPeriods: systemSettings.keyHideBiMonthlyPeriods,
        ignoreApprovalYearThreshold:
            systemSettings.keyIgnoreAnalyticsApprovalYearThreshold,
    }
    const transformedRootOrgUnits = rootOrgUnits.organisationUnits
    const transformedOrgUnitLevels = orgUnitLevels.organisationUnitLevels

    // This is read only data, so we freeze it
    return freeze({
        currentUser: transformedCurrentUser,
        systemSettings: transformedSystemSettings,
        rootOrgUnits: transformedRootOrgUnits,
        orgUnitLevels: transformedOrgUnitLevels,
        relativePeriodsNames,
        locale: transformedCurrentUser.settings.uiLocale,
    })
}

/* The app-shell fetches `/api/me` before rendering the app and exposes it
 * through `useCurrentUserInfo`, so the current user is not part of the query. */
export const AppCachedDataProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const currentUserInfo = useCurrentUserInfo()
    const queryResult = useDataQuery<AppCachedQueryData>(query)
    const relativePeriods = useRelativePeriodsNames()

    if (!currentUserInfo) {
        throw new Error('Current user info is not available')
    }

    const data =
        queryResult.data && !relativePeriods.loading
            ? providerDataTransformation(
                  queryResult.data,
                  relativePeriods.relativePeriodsNames,
                  toCurrentUserData(currentUserInfo)
              )
            : undefined

    return (
        <CachedDataProvider
            data={data}
            error={queryResult.error ?? relativePeriods.error}
        >
            {children}
        </CachedDataProvider>
    )
}

const isAppCachedData = (
    cachedData: CachedData
): cachedData is TransformedAppCachedData => 'currentUser' in cachedData

export const useAppCachedData = (): TransformedAppCachedData => {
    const cachedData = useCachedData()

    if (!isAppCachedData(cachedData)) {
        throw new Error('useAppCachedData can only be used in the app')
    }

    return cachedData
}
export const useCurrentUser = (): TransformedAppCachedData['currentUser'] => {
    const { currentUser } = useAppCachedData()
    return currentUser
}
export const useSystemSettings = (): TransformedSystemSettings => {
    const { systemSettings } = useAppCachedData()
    return systemSettings
}
export const useRootOrgUnits = (): TransformedAppCachedData['rootOrgUnits'] => {
    const { rootOrgUnits } = useAppCachedData()
    return rootOrgUnits
}
export const useOrgUnitLevels =
    (): TransformedAppCachedData['orgUnitLevels'] => {
        const { orgUnitLevels } = useAppCachedData()
        return orgUnitLevels
    }
