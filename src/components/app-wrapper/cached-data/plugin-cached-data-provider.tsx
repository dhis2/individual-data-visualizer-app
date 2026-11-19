import {
    CachedDataProvider,
    useCachedData,
    type CachedData,
} from '@components/app-wrapper/cached-data/cached-data-provider'
import { useRelativePeriodsNames } from '@dhis2/analytics'
import { freeze } from '@reduxjs/toolkit'
import type { FC, ReactNode } from 'react'

export type PluginCachedData = CachedData

export const PluginCachedDataProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { relativePeriodsNames, loading, error } = useRelativePeriodsNames()

    return (
        <CachedDataProvider
            data={loading ? undefined : freeze({ relativePeriodsNames })}
            error={error}
        >
            {children}
        </CachedDataProvider>
    )
}

export const usePluginCachedData = (): PluginCachedData => useCachedData()
