import type { EngineError } from '@api/parse-engine-error'

/* The session ended, for example after logging out in another tab. Every
 * request fails until the user logs in again, so it is shown over the whole
 * app instead of where the request was made. */
export const isUnauthorizedError = (error: EngineError) =>
    error.type === 'access' && error.httpStatusCode === 401

export class UnauthorizedError extends Error {
    readonly engineError: EngineError

    constructor(engineError: EngineError) {
        super(engineError.message)
        this.name = 'UnauthorizedError'
        this.engineError = engineError
    }
}
