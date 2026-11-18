import { FixColumnHeaders } from '@components/options/fields/fix-column-headers'
import { FixRowHeaders } from '@components/options/fields/fix-row-headers'
import {
    initialState as visUiConfigInitialState,
    visUiConfigSlice,
} from '@store/vis-ui-config-slice'
import { renderWithReduxStoreProvider } from '@test-utils/render-with-redux-store-provider'
import { setupStore } from '@test-utils/setup-store'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EventVisualizationOptions, Layout } from '@types'
import type { FC } from 'react'
import { describe, expect, it } from 'vitest'

type FixedHeaderCase = {
    Field: FC
    option: 'fixColumnHeaders' | 'fixRowHeaders'
    axis: 'columns' | 'rows'
    label: string
    emptyAxisHelpText: string
}

const cases: FixedHeaderCase[] = [
    {
        Field: FixColumnHeaders,
        option: 'fixColumnHeaders',
        axis: 'columns',
        label: 'Fix column headers to top of table',
        emptyAxisHelpText:
            'There aren’t any column headers because Columns is empty.',
    },
    {
        Field: FixRowHeaders,
        option: 'fixRowHeaders',
        axis: 'rows',
        label: 'Fix row headers to left of table',
        emptyAxisHelpText:
            'There aren’t any row headers because Rows is empty.',
    },
]

const renderField = (
    Field: FC,
    {
        options = {},
        layout = {},
    }: {
        options?: Partial<EventVisualizationOptions>
        layout?: Partial<Layout>
    } = {}
) => {
    const store = setupStore(
        { [visUiConfigSlice.name]: visUiConfigSlice.reducer },
        {
            visUiConfig: {
                ...visUiConfigInitialState,
                visualizationType: 'PIVOT_TABLE',
                options: { ...visUiConfigInitialState.options, ...options },
                layout: { ...visUiConfigInitialState.layout, ...layout },
            },
        }
    )
    renderWithReduxStoreProvider(<Field />, store)
    return { store }
}

describe.each(cases)(
    'the $option option',
    ({ Field, option, axis, label, emptyAxisHelpText }) => {
        it('is off by default', () => {
            renderField(Field)

            expect(screen.getByLabelText(label)).not.toBeChecked()
        })

        it('is checked when the option is on', () => {
            renderField(Field, { options: { [option]: true } })

            expect(screen.getByLabelText(label)).toBeChecked()
        })

        it('stores the option when checked', async () => {
            const user = userEvent.setup()
            const { store } = renderField(Field)

            await user.click(screen.getByLabelText(label))

            expect(store.getState().visUiConfig.options[option]).toBe(true)
        })

        it('clears the option when unchecked', async () => {
            const user = userEvent.setup()
            const { store } = renderField(Field, {
                options: { [option]: true },
            })

            await user.click(screen.getByLabelText(label))

            expect(store.getState().visUiConfig.options[option]).toBe(false)
        })

        it(`explains that there are no headers when ${axis} is empty`, () => {
            renderField(Field)

            expect(screen.getByText(emptyAxisHelpText)).toBeInTheDocument()
        })

        it(`shows no help text when ${axis} has a dimension`, () => {
            renderField(Field, { layout: { [axis]: ['Zj7UnCAulEk.ou'] } })

            expect(screen.queryByText(emptyAxisHelpText)).toBeNull()
        })
    }
)
