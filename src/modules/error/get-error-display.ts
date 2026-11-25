import type { EngineError } from '@api/parse-engine-error'
import i18n from '@dhis2/d2-i18n'
import type { CanvasErrorDisplay } from './canvas-error-display'
import { EmptyResponseError } from './empty-response-error'
import { getBackendErrorCodeDisplay } from './error-codes'

/* The display for the first recognised backend error code — checking the primary
 * errorCode and then the errorCodes list — or undefined if none is recognised. */
const findKnownBackendErrorDisplay = (error: EngineError) => {
    if (error.errorCode) {
        const display = getBackendErrorCodeDisplay(error.errorCode)
        if (display) {
            return display
        }
    }
    if (Array.isArray(error.errorCodes)) {
        for (const code of error.errorCodes) {
            const display = getBackendErrorCodeDisplay(code)
            if (display) {
                return display
            }
        }
    }
    return undefined
}

/* Single source of the user-facing canvas screen for any canvas error: an empty
 * response, a known backend error code, an ended session, restricted access, or
 * a generic server problem. `retryable` drives whether CanvasError shows a Retry button. */
export const getErrorDisplay = (
    error: EngineError | EmptyResponseError
): CanvasErrorDisplay => {
    if (error instanceof EmptyResponseError) {
        return {
            icon: 'emptyBox',
            title: i18n.t('No data available'),
            description: i18n.t(
                "The selected dimensions didn't return any data. There may be no data, or you may not have access to it."
            ),
        }
    }

    const backendDisplay = findKnownBackendErrorDisplay(error)
    if (backendDisplay) {
        return backendDisplay
    }

    /* The engine types 401, 403 and 409 alike. httpStatusCode is read from the
     * response body, so an access error without a JSON body has none and gets
     * the generic screen below. */
    if (error.type === 'access') {
        switch (error.httpStatusCode) {
            case 401:
                return {
                    icon: 'generic',
                    title: i18n.t('Logged out'),
                    description: i18n.t(
                        'Your session has ended. Log in again, then retry.'
                    ),
                    retryable: true,
                }
            /* Analytics refuses access to data with a 409 that names a code, so
             * a 403 is a missing authority. */
            case 403:
                return {
                    icon: 'data',
                    title: i18n.t('Restricted access'),
                    description: i18n.t(
                        "Your account doesn't have permission to do this. Contact a system administrator."
                    ),
                }
            /* A 409 whose code has copy is matched above. With a code, the
             * message is the server's own text for it and names the offending
             * dimension, so it is shown untranslated. Without one, the engine
             * may have filled in "Forbidden" itself. */
            case 409:
                return {
                    icon: 'generic',
                    title: i18n.t('Analytics request error'),
                    description:
                        error.errorCode || error.errorCodes?.length
                            ? error.message
                            : i18n.t(
                                  'An unknown analytics request error occurred.'
                              ),
                }
        }
    }

    return {
        icon: 'generic',
        title: i18n.t('Something went wrong'),
        description: i18n.t(
            'There was a problem getting the data from the server.'
        ),
        retryable: true,
    }
}
