import i18n from '@dhis2/d2-i18n'
import { Center, CircularLoader, Layer, NoticeBox } from '@dhis2/ui'
import { createContext, useContext, type FC, type ReactNode } from 'react'

export type CachedData = {
    relativePeriodsNames: Record<string, string>
    /* The user's UI locale as a BCP 47 tag, for Intl */
    locale: string
}

const CachedDataContext = createContext<CachedData | null>(null)

export const CachedDataProvider: FC<{
    data: CachedData | undefined
    error?: Error | null
    children: ReactNode
}> = ({ data, error, children }) => {
    if (error) {
        return (
            <NoticeBox error title={i18n.t('Network error')}>
                {error.message ||
                    i18n.t('This app could not retrieve required data.')}
            </NoticeBox>
        )
    }

    if (!data) {
        return (
            <Layer translucent>
                <Center>
                    <CircularLoader />
                </Center>
            </Layer>
        )
    }

    return (
        <CachedDataContext.Provider value={data}>
            {children}
        </CachedDataContext.Provider>
    )
}

export const useCachedData = (): CachedData => {
    const cachedData = useContext(CachedDataContext)

    if (!cachedData) {
        throw new Error(
            'useCachedData must be used within a CachedDataProvider'
        )
    }

    return cachedData
}

export const useUserLocale = (): CachedData['locale'] => useCachedData().locale
