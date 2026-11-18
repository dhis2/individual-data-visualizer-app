import i18n from '@dhis2/d2-i18n'
import { useAppSelector } from '@hooks'
import { getVisUiConfigLayout } from '@store/vis-ui-config-slice'
import { type FC } from 'react'
import { CheckboxBaseOption } from './checkbox-base-option'

export const FixColumnHeaders: FC = () => {
    const hasColumns = useAppSelector(
        (state) => getVisUiConfigLayout(state).columns.length > 0
    )

    return (
        <CheckboxBaseOption
            label={i18n.t('Fix column headers to top of table')}
            helpText={
                hasColumns
                    ? undefined
                    : i18n.t(
                          'There aren’t any column headers because Columns is empty.'
                      )
            }
            option={{
                name: 'fixColumnHeaders',
            }}
        />
    )
}
