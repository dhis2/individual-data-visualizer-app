/* useDataQuery, not the RTK-query hooks: the plugin carries no app store (see
 * CLAUDE.md > plugin providers). */
// eslint-disable-next-line no-restricted-imports
import { useDataQuery } from '@dhis2/app-runtime'
import type { Query } from '@dhis2/app-service-data'
import i18n from '@dhis2/d2-i18n'
import { Center, CircularLoader, Layer, NoticeBox } from '@dhis2/ui'
import type { Context, ReactNode } from 'react'

export type AsyncDataResult<TAsyncData> = {
    data: TAsyncData
    loading: boolean
    error?: Error | null
}

type CachedDataProviderProps<TQueryData, TAsyncData, TData> = {
    children: ReactNode
    context: Context<TData | null>
    query?: Query
    useAsyncData: () => AsyncDataResult<TAsyncData>
    transformation: (queryData: TQueryData, asyncData: TAsyncData) => TData
}

const NO_QUERY: Query = {}

export const CachedDataProvider = <TQueryData, TAsyncData, TData>({
    children,
    context: CachedDataContext,
    query = NO_QUERY,
    useAsyncData,
    transformation,
}: CachedDataProviderProps<TQueryData, TAsyncData, TData>) => {
    const queryResult = useDataQuery<TQueryData>(query)
    const asyncResult = useAsyncData()
    const error = queryResult.error ?? asyncResult.error

    if (error) {
        return (
            <NoticeBox error title={i18n.t('Network error')}>
                {error.message ||
                    i18n.t('This app could not retrieve required data.')}
            </NoticeBox>
        )
    }

    if (queryResult.loading || asyncResult.loading || !queryResult.data) {
        return (
            <Layer translucent>
                <Center>
                    <CircularLoader />
                </Center>
            </Layer>
        )
    }

    return (
        <CachedDataContext.Provider
            value={transformation(queryResult.data, asyncResult.data)}
        >
            {children}
        </CachedDataContext.Provider>
    )
}
