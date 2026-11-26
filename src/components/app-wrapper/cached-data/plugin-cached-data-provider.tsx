import { CachedDataProvider } from '@components/app-wrapper/cached-data/cached-data-provider'
import { toCurrentUser } from '@components/app-wrapper/cached-data/current-user'
import { useRelativePeriodsNames } from '@dhis2/analytics'
import { useCurrentUserInfo } from '@dhis2/app-runtime'
import { freeze } from '@reduxjs/toolkit'
import type { FC, ReactNode } from 'react'

export const PluginCachedDataProvider: FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { relativePeriodsNames, loading, error } = useRelativePeriodsNames()
    const currentUserInfo = useCurrentUserInfo()

    if (!currentUserInfo) {
        throw new Error('Current user info is not available')
    }

    return (
        <CachedDataProvider
            data={
                loading
                    ? undefined
                    : freeze({
                          relativePeriodsNames,
                          currentUser: toCurrentUser(currentUserInfo),
                      })
            }
            error={error}
        >
            {children}
        </CachedDataProvider>
    )
}
