import { CanvasError } from '@components/canvas-error/canvas-error'
import { useAppDispatch, useAppSelector } from '@hooks'
import { UnauthorizedError } from '@modules/error/unauthorized-error'
import {
    clearUnauthorizedError,
    getUnauthorizedError,
} from '@store/loader-slice'
import { useCallback, type FC, type ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import classes from './styles/app-error-boundary.module.css'

/* A 401 is caught where the request was made, often outside React, so it is
 * stored and thrown from here to reach the boundary */
const UnauthorizedErrorThrower: FC = () => {
    const unauthorizedError = useAppSelector(getUnauthorizedError)

    if (unauthorizedError) {
        throw new UnauthorizedError(unauthorizedError)
    }

    return null
}

export const AppErrorFallback: FC<FallbackProps> = ({
    error,
    resetErrorBoundary,
}) => {
    if (error instanceof UnauthorizedError) {
        return (
            <div className={classes.container} data-test="app-error">
                <CanvasError
                    error={error.engineError}
                    onRetry={resetErrorBoundary}
                />
            </div>
        )
    }

    throw error
}

/* Retry remounts the app, which fetches everything again. The store is kept,
 * so unsaved changes survive. */
export const AppErrorBoundary: FC<{ children: ReactNode }> = ({ children }) => {
    const dispatch = useAppDispatch()
    const onReset = useCallback(
        () => dispatch(clearUnauthorizedError()),
        [dispatch]
    )

    return (
        <ErrorBoundary FallbackComponent={AppErrorFallback} onReset={onReset}>
            <UnauthorizedErrorThrower />
            {children}
        </ErrorBoundary>
    )
}
