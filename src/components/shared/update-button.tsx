import {
    getAvailableOutputTypes,
    getLayoutSelectionTooltipConfig,
} from '@components/layout-panel/bottom-bar/output-type-validity'
import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { Button, Tooltip } from '@dhis2/ui'
import { useAppSelector, useMetadataStore } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization/guards'
import { getCurrentVis } from '@store/current-vis-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import { useMemo, type FC } from 'react'

type UpdateButtonProps = {
    onClick?: () => void
    dataTest?: string
    type?: 'button' | 'submit'
    form?: string
}

export const UpdateButton: FC<UpdateButtonProps> = ({
    onClick,
    dataTest = 'update-button',
    type = 'button',
    form,
}) => {
    const currentVis = useAppSelector(getCurrentVis)
    const visType = useAppSelector(getVisUiConfigVisualizationType)
    const visUiConfig = useAppSelector((state) => state.visUiConfig)
    const metadataStore = useMetadataStore()

    const disabledReason = useMemo(() => {
        const isOutputTypeUnavailable = !getAvailableOutputTypes(
            visType
        ).includes(visUiConfig.outputType)

        if (isVisualizationEmpty(currentVis) || isOutputTypeUnavailable) {
            return i18n.t('Create a {{- visType}} before updating', {
                visType: visTypeDisplayNames[visType],
            })
        }
        return getLayoutSelectionTooltipConfig({
            visUiConfig,
            metadataStore,
        })?.content
    }, [currentVis, visType, visUiConfig, metadataStore])

    if (disabledReason) {
        return (
            <Tooltip content={disabledReason}>
                {({ onMouseOver, onMouseOut, onFocus, onBlur, ref }) => (
                    <span
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        ref={ref}
                    >
                        <Button
                            disabled
                            type={type}
                            form={form}
                            dataTest={dataTest}
                        >
                            {i18n.t('Update')}
                        </Button>
                    </span>
                )}
            </Tooltip>
        )
    }

    return (
        <Button
            type={type}
            form={form}
            primary
            onClick={onClick}
            dataTest={dataTest}
        >
            {i18n.t('Update')}
        </Button>
    )
}
