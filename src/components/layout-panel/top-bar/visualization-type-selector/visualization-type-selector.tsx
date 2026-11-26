import {
    AGGREGATED_VISUALIZATION_TYPES,
    INDIVIDUAL_VISUALIZATION_TYPES,
} from '@constants/visualization-types'
import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import {
    Popper,
    Layer,
    IconChevronDown16,
    IconVisualizationLinelist16,
    IconVisualizationPivotTable16,
    IconVisualizationColumn16,
    IconVisualizationBar16,
    IconVisualizationLine16,
    IconVisualizationArea16,
} from '@dhis2/ui'
import { useAppSelector } from '@hooks'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import type { EventVisualizationType, VisualizationType } from '@types'
import cx from 'classnames'
import type { FC, ReactNode } from 'react'
import { useState, useRef } from 'react'
import { ConversionConfirmationModal } from './conversion-confirmation-modal'
import classes from './styles/visualization-type-selector.module.css'
import { useVisTypeConversion } from './use-vis-type-conversion'

const visTypeIcons: Record<VisualizationType, ReactNode> = {
    LINE_LIST: <IconVisualizationLinelist16 />,
    PIVOT_TABLE: <IconVisualizationPivotTable16 />,
}

const COMING_SOON_VIS_TYPES = [
    'COLUMN',
    'BAR',
    'LINE',
    'AREA',
] as const satisfies ReadonlyArray<EventVisualizationType>

type ComingSoonVisType = (typeof COMING_SOON_VIS_TYPES)[number]

const comingSoonVisTypeIcons: Record<ComingSoonVisType, ReactNode> = {
    COLUMN: <IconVisualizationColumn16 />,
    BAR: <IconVisualizationBar16 />,
    LINE: <IconVisualizationLine16 />,
    AREA: <IconVisualizationArea16 />,
}

type ListItemProps = {
    visType: VisualizationType
    isSelected: boolean
    onClick: () => void
}

export const ListItem: FC<ListItemProps> = ({
    visType,
    isSelected,
    onClick,
}) => {
    return (
        <button
            className={cx(classes.gridItem, {
                [classes.active]: isSelected,
            })}
            onClick={onClick}
            type="button"
        >
            {visTypeIcons[visType]}
            <span className={classes.gridItemLabel}>
                {visTypeDisplayNames[visType]}
            </span>
        </button>
    )
}

const ComingSoonListItem: FC<{ visType: ComingSoonVisType }> = ({
    visType,
}) => (
    <div
        className={cx(classes.gridItem, classes.comingSoon)}
        aria-disabled="true"
    >
        <span className={classes.comingSoonBadge}>{i18n.t('Coming soon')}</span>
        {comingSoonVisTypeIcons[visType]}
        <span className={classes.gridItemLabel}>
            {visTypeDisplayNames[visType]}
        </span>
    </div>
)

type VisTypeSectionProps = {
    title: string
    visTypes: readonly VisualizationType[]
    selectedVisType: VisualizationType
    onSelect: (visType: VisualizationType) => void
    children?: ReactNode
}

const VisTypeSection: FC<VisTypeSectionProps> = ({
    title,
    visTypes,
    selectedVisType,
    onSelect,
    children,
}) => (
    <div className={classes.section}>
        <div className={classes.sectionHeader}>{title}</div>
        <div className={classes.grid}>
            {visTypes.map((visType) => (
                <ListItem
                    key={visType}
                    visType={visType}
                    isSelected={visType === selectedVisType}
                    onClick={() => onSelect(visType)}
                />
            ))}
            {children}
        </div>
    </div>
)

export const VisualizationTypeSelector: FC = () => {
    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const {
        pendingConversion,
        convertTo,
        confirmConversion,
        cancelConversion,
    } = useVisTypeConversion()

    const [listIsOpen, setListIsOpen] = useState(false)
    const buttonRef = useRef<HTMLDivElement>(null)

    const toggleList = () => setListIsOpen(!listIsOpen)

    const selectVisType = (visType: VisualizationType) => {
        setListIsOpen(false)
        convertTo(visType)
    }

    return (
        <>
            <div ref={buttonRef}>
                <button
                    onClick={toggleList}
                    className={cx(classes.button, {
                        [classes.listIsOpen]: listIsOpen,
                    })}
                    data-test={'visualization-type-selector-button'}
                >
                    {visTypeIcons[visualizationType]}
                    <span
                        className={classes.selectedVisTypeLabel}
                        data-test="visualization-type-selector-currently-selected-text"
                    >
                        {visTypeDisplayNames[visualizationType]}
                    </span>
                    <span className={classes.chevron}>
                        <IconChevronDown16 />
                    </span>
                </button>
            </div>
            {listIsOpen && (
                <Layer onBackdropClick={toggleList}>
                    <Popper reference={buttonRef} placement="bottom-start">
                        <div
                            className={classes.container}
                            data-test="visualization-type-selector-list"
                        >
                            <VisTypeSection
                                title={i18n.t('Individual data view')}
                                visTypes={INDIVIDUAL_VISUALIZATION_TYPES}
                                selectedVisType={visualizationType}
                                onSelect={selectVisType}
                            />
                            <VisTypeSection
                                title={i18n.t('Aggregated view')}
                                visTypes={AGGREGATED_VISUALIZATION_TYPES}
                                selectedVisType={visualizationType}
                                onSelect={selectVisType}
                            >
                                {COMING_SOON_VIS_TYPES.map((visType) => (
                                    <ComingSoonListItem
                                        key={visType}
                                        visType={visType}
                                    />
                                ))}
                            </VisTypeSection>
                        </div>
                    </Popper>
                </Layer>
            )}
            {pendingConversion && (
                <ConversionConfirmationModal
                    targetVisType={pendingConversion.targetVisType}
                    discardedDimensionNames={pendingConversion.discardedNames}
                    emptyDimensionNames={pendingConversion.emptyDimensionNames}
                    defaultItemNames={pendingConversion.defaultItemNames}
                    onConfirm={confirmConversion}
                    onCancel={cancelConversion}
                />
            )}
        </>
    )
}
