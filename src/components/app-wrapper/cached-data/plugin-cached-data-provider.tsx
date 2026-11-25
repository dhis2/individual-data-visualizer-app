import {
    CachedDataProvider,
    useCachedData,
    type CachedData,
} from '@components/app-wrapper/cached-data/cached-data-provider'
import { toIntlLocale } from '@components/app-wrapper/cached-data/current-user'
import { useRelativePeriodsNames } from '@dhis2/analytics'
import { useCurrentUserInfo } from '@dhis2/app-runtime'
import { freeze } from '@reduxjs/toolkit'
import type { FC, ReactNode } from 'react'

export type PluginCachedData = CachedData

export const PluginCachedDataProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { relativePeriodsNames, loading, error } = useRelativePeriodsNames()
    const locale = toIntlLocale(useCurrentUserInfo()?.settings?.keyUiLocale)

    return (
        <CachedDataProvider
            data={
                loading ? undefined : freeze({ relativePeriodsNames, locale })
            }
            error={error}
        >
            {children}
        </CachedDataProvider>
    )
}

export const usePluginCachedData = (): PluginCachedData => useCachedData()
