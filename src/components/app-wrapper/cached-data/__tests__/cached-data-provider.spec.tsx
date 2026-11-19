import {
    CachedDataProvider,
    useCachedData,
} from '@components/app-wrapper/cached-data/cached-data-provider'
import { render, screen } from '@testing-library/react'
import { expect, describe, it } from 'vitest'

const PeriodName = () => (
    <div data-test="period-name">
        {useCachedData().relativePeriodsNames.LAST_YEAR}
    </div>
)

const data = { relativePeriodsNames: { LAST_YEAR: 'Last year' } }

describe('CachedDataProvider', () => {
    it('provides the data to its children', () => {
        render(
            <CachedDataProvider data={data}>
                <PeriodName />
            </CachedDataProvider>
        )

        expect(screen.getByTestId('period-name')).toHaveTextContent('Last year')
    })

    it('shows a loader while there is no data', () => {
        render(
            <CachedDataProvider data={undefined}>
                <PeriodName />
            </CachedDataProvider>
        )

        expect(screen.getByRole('progressbar')).toBeInTheDocument()
        expect(screen.queryByTestId('period-name')).not.toBeInTheDocument()
    })

    it('shows the error instead of its children', () => {
        render(
            <CachedDataProvider
                data={data}
                error={new Error('Could not load the period types')}
            >
                <PeriodName />
            </CachedDataProvider>
        )

        expect(screen.getByText('Network error')).toBeInTheDocument()
        expect(
            screen.getByText('Could not load the period types')
        ).toBeInTheDocument()
        expect(screen.queryByTestId('period-name')).not.toBeInTheDocument()
    })

    it('shows a general message for an error without one', () => {
        render(
            <CachedDataProvider data={undefined} error={new Error('')}>
                <PeriodName />
            </CachedDataProvider>
        )

        expect(
            screen.getByText('This app could not retrieve required data.')
        ).toBeInTheDocument()
    })
})
