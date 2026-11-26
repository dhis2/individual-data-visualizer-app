import type { EngineError } from '@api/parse-engine-error'
import { UnauthorizedError } from '@modules/error/unauthorized-error'
import {
    getUnauthorizedError,
    loaderSlice,
    setUnauthorizedError,
} from '@store/loader-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { suppressWindowError } from '@test-utils/suppress-window-error'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Component, type PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary, AppErrorFallback } from '../app-error-boundary'

class CatchAll extends Component<PropsWithChildren, { caught: boolean }> {
    state = { caught: false }
    static getDerivedStateFromError() {
        return { caught: true }
    }
    render() {
        return this.state.caught ? <div>bubbled</div> : this.props.children
    }
}

const unauthorizedError: EngineError = {
    type: 'access',
    message: 'Unauthorized',
    httpStatusCode: 401,
}

describe('AppErrorBoundary', () => {
    it(
        'replaces the app with the logged out screen on a 401',
        suppressWindowError('Unauthorized', () => {
            const store = setupStore({ loader: loaderSlice.reducer })
            renderWithReduxStoreProvider(
                <AppErrorBoundary>
                    <div>app</div>
                </AppErrorBoundary>,
                store
            )

            expect(screen.getByText('app')).toBeInTheDocument()

            act(() => {
                store.dispatch(setUnauthorizedError(unauthorizedError))
            })

            expect(screen.queryByText('app')).not.toBeInTheDocument()
            expect(screen.getByText('Logged out')).toBeInTheDocument()
        })
    )

    it(
        'shows the app again on retry',
        suppressWindowError('Unauthorized', () => {
            const store = setupStore(
                { loader: loaderSlice.reducer },
                {
                    loader: {
                        ...loaderSlice.getInitialState(),
                        unauthorizedError,
                    },
                }
            )
            renderWithReduxStoreProvider(
                <AppErrorBoundary>
                    <div>app</div>
                </AppErrorBoundary>,
                store
            )

            fireEvent.click(screen.getByText('Retry'))

            expect(screen.getByText('app')).toBeInTheDocument()
            expect(getUnauthorizedError(store.getState())).toBeNull()
        })
    )
})

describe('AppErrorFallback', () => {
    it('renders the logged out screen for an UnauthorizedError', () => {
        render(
            <AppErrorFallback
                error={new UnauthorizedError(unauthorizedError)}
                resetErrorBoundary={vi.fn()}
            />
        )

        expect(screen.getByText('Logged out')).toBeInTheDocument()
    })

    it(
        're-throws any other error',
        suppressWindowError('boom', () => {
            render(
                <CatchAll>
                    <AppErrorFallback
                        error={new Error('boom')}
                        resetErrorBoundary={vi.fn()}
                    />
                </CatchAll>
            )

            expect(screen.getByText('bubbled')).toBeInTheDocument()
        })
    )
})
