import {
    type AsyncDataResult,
    CachedDataProvider,
} from '@components/app-wrapper/cached-data/cached-data-provider'
import { CustomDataProvider } from '@dhis2/app-runtime'
import { render, screen } from '@testing-library/react'
import { createContext, useContext, type ReactNode } from 'react'
import { expect, describe, it } from 'vitest'

type TestQueryData = { greeting: { text: string } }
type TestAsyncData = { name: string }
type TestData = { message: string }

const TestContext = createContext<TestData | null>(null)

const Message = () => (
    <div data-test="message">{useContext(TestContext)?.message}</div>
)

const asyncDataHook =
    (result: AsyncDataResult<TestAsyncData>) =>
    (): AsyncDataResult<TestAsyncData> =>
        result

const loadedAsyncData = asyncDataHook({
    data: { name: 'Ana' },
    loading: false,
})

const renderProvider = ({
    useAsyncData = loadedAsyncData,
    queryData = { greeting: { text: 'Hello' } },
    loadForever = false,
}: {
    useAsyncData?: () => AsyncDataResult<TestAsyncData>
    queryData?: Record<string, { text: string }>
    loadForever?: boolean
}): void => {
    const wrap = (children: ReactNode) => (
        <CustomDataProvider data={queryData} options={{ loadForever }}>
            {children}
        </CustomDataProvider>
    )

    render(
        wrap(
            <CachedDataProvider
                context={TestContext}
                query={{ greeting: { resource: 'greeting' } }}
                useAsyncData={useAsyncData}
                transformation={(
                    { greeting }: TestQueryData,
                    { name }: TestAsyncData
                ) => ({ message: `${greeting.text}, ${name}` })}
            >
                <Message />
            </CachedDataProvider>
        )
    )
}

describe('CachedDataProvider', () => {
    it('provides the query data and the async data, transformed', async () => {
        renderProvider({})

        expect(await screen.findByTestId('message')).toHaveTextContent(
            'Hello, Ana'
        )
    })

    it('shows a loader while the query loads', () => {
        renderProvider({ loadForever: true })

        expect(screen.getByRole('progressbar')).toBeInTheDocument()
        expect(screen.queryByTestId('message')).not.toBeInTheDocument()
    })

    it('shows a loader while an async hook loads', async () => {
        renderProvider({
            useAsyncData: asyncDataHook({
                data: { name: '' },
                loading: true,
            }),
        })

        expect(await screen.findByRole('progressbar')).toBeInTheDocument()
        expect(screen.queryByTestId('message')).not.toBeInTheDocument()
    })

    it('shows an error when the query fails', async () => {
        renderProvider({ queryData: {} })

        expect(await screen.findByText('Network error')).toBeInTheDocument()
        expect(screen.queryByTestId('message')).not.toBeInTheDocument()
    })

    it('shows an error when an async hook fails', async () => {
        renderProvider({
            useAsyncData: asyncDataHook({
                data: { name: '' },
                loading: false,
                error: new Error('Could not load the period types'),
            }),
        })

        expect(
            await screen.findByText('Could not load the period types')
        ).toBeInTheDocument()
        expect(screen.queryByTestId('message')).not.toBeInTheDocument()
    })
})
