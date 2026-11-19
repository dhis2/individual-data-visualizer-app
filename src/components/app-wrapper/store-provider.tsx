import { useAppCachedData } from '@components/app-wrapper/cached-data/app-cached-data-provider'
// eslint-disable-next-line no-restricted-imports
import { useDataEngine } from '@dhis2/app-runtime'
import { createStore } from '@store/store'
import { useState } from 'react'
import type { FC, ReactNode } from 'react'
import { Provider } from 'react-redux'
import { useMetadataStore } from './metadata-provider/metadata-provider'

export const StoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const engine = useDataEngine()
    const metadataStore = useMetadataStore()
    const appCachedData = useAppCachedData()
    const [store] = useState(() =>
        createStore(engine, metadataStore, appCachedData)
    )
    return <Provider store={store}>{children}</Provider>
}
