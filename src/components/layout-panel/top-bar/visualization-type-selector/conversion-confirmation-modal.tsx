import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import { useListFormatter } from '@hooks'
import type { VisualizationType } from '@types'
import type { FC } from 'react'

type ConversionConfirmationModalProps = {
    targetVisType: VisualizationType
    discardedDimensionNames: string[]
    emptyDimensionNames: string[]
    defaultItemNames: string[]
    onConfirm: () => void
    onCancel: () => void
}

export const ConversionConfirmationModal: FC<
    ConversionConfirmationModalProps
> = ({
    targetVisType,
    discardedDimensionNames,
    emptyDimensionNames,
    defaultItemNames,
    onConfirm,
    onCancel,
}) => {
    const listFormatter = useListFormatter({ type: 'conjunction' })
    const hasEmptyDimensions = emptyDimensionNames.length > 0

    return (
        <Modal
            onClose={onCancel}
            position="top"
            dataTest="conversion-confirmation-modal"
        >
            <ModalTitle>
                {i18n.t('Convert to {{- visType}}', {
                    visType: visTypeDisplayNames[targetVisType],
                })}
            </ModalTitle>
            <ModalContent>
                {discardedDimensionNames.length > 0 && (
                    <p>
                        {i18n.t(
                            '{{- names}} will be removed from the layout because program indicators are not supported in pivot tables.',
                            {
                                names: listFormatter.format(
                                    discardedDimensionNames
                                ),
                            }
                        )}
                    </p>
                )}
                {hasEmptyDimensions && (
                    <p>
                        {i18n.t(
                            '{{- names}} has no items. In a pivot table every org unit and period dimension needs at least one item, so the default selection will be used: {{- defaults}}.',
                            {
                                names: listFormatter.format(
                                    emptyDimensionNames
                                ),
                                defaults:
                                    listFormatter.format(defaultItemNames),
                                count: emptyDimensionNames.length,
                                nsSeparator: '^^',
                                defaultValue:
                                    '{{- names}} has no items. In a pivot table every org unit and period dimension needs at least one item, so the default selection will be used: {{- defaults}}.',
                                defaultValue_plural:
                                    '{{- names}} have no items. In a pivot table every org unit and period dimension needs at least one item, so the default selection will be used: {{- defaults}}.',
                            }
                        )}
                    </p>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button type="button" secondary onClick={onCancel}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button type="button" primary onClick={onConfirm}>
                        {hasEmptyDimensions
                            ? i18n.t('Use defaults and convert')
                            : i18n.t('Convert')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
