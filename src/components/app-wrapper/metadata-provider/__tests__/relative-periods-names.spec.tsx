import { useRelativePeriodsNames } from '@dhis2/analytics'
import { render, screen } from '@testing-library/react'
import { expect, describe, it, vi } from 'vitest'
import { PluginMetadataProvider, useMetadataItem } from '../metadata-provider'

vi.mock('@dhis2/analytics', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useRelativePeriodsNames: vi.fn(),
}))

const PeriodName = ({ id }: { id: string }) => (
    <div data-test="period-name">{useMetadataItem(id)?.name}</div>
)

describe('PluginMetadataProvider relative period names', () => {
    it('names relative periods with the names from the hook', () => {
        vi.mocked(useRelativePeriodsNames).mockReturnValue({
            relativePeriodsNames: { LAST_5_YEARS: 'Les 5 dernières années' },
            loading: false,
            error: null,
        })

        render(
            <PluginMetadataProvider>
                <PeriodName id="LAST_5_YEARS" />
            </PluginMetadataProvider>
        )

        expect(screen.getByTestId('period-name')).toHaveTextContent(
            'Les 5 dernières années'
        )
    })

    it('renders nothing below it while the names are loading', () => {
        vi.mocked(useRelativePeriodsNames).mockReturnValue({
            relativePeriodsNames: {},
            loading: true,
            error: null,
        })

        render(
            <PluginMetadataProvider>
                <PeriodName id="LAST_5_YEARS" />
            </PluginMetadataProvider>
        )

        expect(screen.queryByTestId('period-name')).not.toBeInTheDocument()
    })
})
