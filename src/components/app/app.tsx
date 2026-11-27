import { AppWrapper } from '@components/app-wrapper'
import { Canvas } from '@components/canvas/canvas'
import { DetailsPanel } from '@components/details-panel/details-panel'
import { DimensionModal } from '@components/dimension-modal/dimension-modal'
import {
    GridCenterColumnBottom,
    GridCenterColumnTop,
    GridContainer,
    GridEndColumn,
    GridStartColumn,
    GridTopRow,
} from '@components/grid'
import { InterpretationModal } from '@components/interpretation-modal/interpretation-modal'
import { LayoutPanel } from '@components/layout-panel/layout-panel'
import { DiscardChangesModal } from '@components/shared/discard-changes/discard-changes-modal'
import { useConfirmBeforeUnload } from '@components/shared/discard-changes/use-confirm-before-unload'
import { Sidebar } from '@components/sidebar/sidebar'
import { Toolbar } from '@components/toolbar/toolbar'
import { CssVariables } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    getUiActiveDimensionModal,
    setUiActiveDimensionModal,
} from '@store/ui-slice'
import { useCallback, type FC } from 'react'
import { AppErrorBoundary } from './app-error-boundary'
import { useLoadVisualizationOnMount } from './use-load-visualization-on-mount'
import './styles/app.css'

const IndividualDataVisualizer: FC = () => {
    const dispatch = useAppDispatch()
    const activeDimensionModal = useAppSelector(getUiActiveDimensionModal)

    const onDimensionModalClose = useCallback(
        () => dispatch(setUiActiveDimensionModal(null)),
        [dispatch]
    )

    return (
        <GridContainer>
            <GridTopRow>
                <Toolbar />
            </GridTopRow>
            <GridStartColumn>
                <Sidebar />
                {activeDimensionModal && (
                    <DimensionModal onClose={onDimensionModalClose} />
                )}
            </GridStartColumn>
            <GridCenterColumnTop>
                <LayoutPanel />
            </GridCenterColumnTop>
            <GridCenterColumnBottom>
                <Canvas />
            </GridCenterColumnBottom>
            <GridEndColumn>
                <DetailsPanel />
            </GridEndColumn>
            <InterpretationModal />
            <DiscardChangesModal />
        </GridContainer>
    )
}

/* Outside the error boundary, so a retry after an error does not load the
 * visualization again over unsaved changes, and leaving still asks to discard
 * them while the error shows */
const AppEffects: FC = () => {
    useLoadVisualizationOnMount()
    useConfirmBeforeUnload()
    return null
}

export const App: FC = () => (
    <>
        <CssVariables colors spacers theme elevations />
        <AppWrapper>
            <AppEffects />
            <AppErrorBoundary>
                <IndividualDataVisualizer />
            </AppErrorBoundary>
        </AppWrapper>
    </>
)
