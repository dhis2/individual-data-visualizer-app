import { CachedDataProvider } from '@components/app-wrapper/cached-data/cached-data-provider'
import {
    type RelativePeriodsNamesData,
    useRelativePeriodsNamesData,
} from '@components/app-wrapper/cached-data/relative-periods-names'
import { freeze } from '@reduxjs/toolkit'
import { createContext, useContext, type FC, type ReactNode } from 'react'

export type PluginCachedData = RelativePeriodsNamesData

const PluginCachedDataContext = createContext<PluginCachedData | null>(null)

const pluginDataTransformation = (
    _queryData: unknown,
    asyncData: RelativePeriodsNamesData
): PluginCachedData => freeze(asyncData)

export const PluginCachedDataProvider: FC<{ children: ReactNode }> = ({
    children,
}) => (
    <CachedDataProvider
        context={PluginCachedDataContext}
        useAsyncData={useRelativePeriodsNamesData}
        transformation={pluginDataTransformation}
    >
        {children}
    </CachedDataProvider>
)

export const usePluginCachedData = (): PluginCachedData => {
    const pluginCachedData = useContext(PluginCachedDataContext)

    if (!pluginCachedData) {
        throw new Error(
            'usePluginCachedData must be used within a PluginCachedDataProvider'
        )
    }

    return pluginCachedData
}
