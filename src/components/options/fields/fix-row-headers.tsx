import i18n from '@dhis2/d2-i18n'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const FixRowHeaders: FC = () => {
    const hasRows = useAppSelector(
        (state) => getVisUiConfigLayout(state).rows.length > 0
    )

    return (
        <CheckboxBaseOption
            label={i18n.t('Fix row headers to left of table')}
            helpText={
                hasRows
                    ? undefined
                    : i18n.t(
                          'There aren’t any row headers because Rows is empty.'
                      )
            }
            option={{
                name: 'fixRowHeaders',
            }}
        />
    )
}
