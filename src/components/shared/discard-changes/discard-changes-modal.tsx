import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getPendingNavigation,
    setPendingNavigation,
} from '@store/navigation-slice'
import { tConfirmPendingNavigation } from '@store/thunks'
import { useCallback, type FC } from 'react'

export const DiscardChangesModal: FC = () => {
    const dispatch = useAppDispatch()
    const pendingNavigation = useAppSelector(getPendingNavigation)

    const onConfirm = useCallback(
        () => dispatch(tConfirmPendingNavigation()),
        [dispatch]
    )
    const onCancel = useCallback(
        () => dispatch(setPendingNavigation(null)),
        [dispatch]
    )

    if (!pendingNavigation) {
        return null
    }

    return (
        <Modal
            onClose={onCancel}
            position="top"
            dataTest="discard-changes-modal"
        >
            <ModalTitle>{i18n.t('Discard unsaved changes?')}</ModalTitle>
            <ModalContent>
                {i18n.t(
                    'Are you sure you want to leave this visualization? Any unsaved changes will be lost.'
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button
                        type="button"
                        secondary
                        onClick={onCancel}
                        dataTest="discard-changes-modal-cancel"
                    >
                        {i18n.t('No, cancel')}
                    </Button>
                    <Button
                        type="button"
                        primary
                        onClick={onConfirm}
                        dataTest="discard-changes-modal-confirm"
                    >
                        {i18n.t('Yes, leave')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
