import { useSystemSettings } from '@components/app-wrapper/cached-data/app-cached-data-provider'
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
import { useAppDispatch, useAppSelector, useMetadataStore } from '@hooks'
import { getDefaultItemsForDimension } from '@modules/dimension/default-items'
import { convertLayoutForVisType } from '@modules/layout'
import {
    setVisUiConfigItemsByDimension,
    setVisUiConfigLayout,
    setVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { EventVisualizationType, Layout, VisualizationType } from '@types'
import cx from 'classnames'
import type { FC, ReactNode } from 'react'
import { useState, useRef } from 'react'
import { ConversionConfirmationModal } from './conversion-confirmation-modal'
import classes from './styles/visualization-type-selector.module.css'

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

type Conversion = {
    targetVisType: VisualizationType
    convertedLayout: Layout
    defaultItemsByDimension: Record<string, string[]>
}

type PendingConversion = Conversion & {
    discardedNames: string[]
    emptyDimensionNames: string[]
    defaultItemNames: string[]
}

export const VisualizationTypeSelector: FC = () => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()
    const { relativePeriod } = useSystemSettings()

    const visualizationType = useAppSelector(getVisUiConfigVisualizationType)
    const layout = useAppSelector(getVisUiConfigLayout)
    const itemsByDimension = useAppSelector(
        (state) => state.visUiConfig.itemsByDimension
    )

    const [listIsOpen, setListIsOpen] = useState(false)
    const [pendingConversion, setPendingConversion] =
        useState<PendingConversion | null>(null)

    const toggleList = () => setListIsOpen(!listIsOpen)

    const getDimensionName = (id: string) =>
        metadataStore.getDimensionMetadataItem(id)?.name ?? id

    const applyChange = ({
        targetVisType,
        convertedLayout,
        defaultItemsByDimension,
    }: Conversion) => {
        dispatch(setVisUiConfigLayout(convertedLayout))
        dispatch(setVisUiConfigVisualizationType(targetVisType))
        for (const [dimensionId, itemIds] of Object.entries(
            defaultItemsByDimension
        )) {
            dispatch(setVisUiConfigItemsByDimension({ dimensionId, itemIds }))
        }
    }

    const handleListItemClick = (nextVisType: VisualizationType) => () => {
        setListIsOpen(false)
        if (nextVisType === visualizationType) {
            return
        }
        const { convertedLayout, invalidDimensionIds, emptyDimensionIds } =
            convertLayoutForVisType({
                layout,
                itemsByDimension,
                targetVisType: nextVisType,
                getDimension: metadataStore.getDimensionMetadataItemOrThrow,
            })
        const defaultItemsByDimension: Record<string, string[]> = {}
        for (const id of emptyDimensionIds) {
            const defaultItems = getDefaultItemsForDimension(id, relativePeriod)
            if (defaultItems) {
                defaultItemsByDimension[id] = defaultItems
            }
        }
        const conversion: Conversion = {
            targetVisType: nextVisType,
            convertedLayout,
            defaultItemsByDimension,
        }
        const emptyDimensionIdsWithDefaults = Object.keys(
            defaultItemsByDimension
        )
        if (
            invalidDimensionIds.length === 0 &&
            emptyDimensionIdsWithDefaults.length === 0
        ) {
            applyChange(conversion)
            return
        }
        const defaultItemIds = [
            ...new Set(Object.values(defaultItemsByDimension).flat()),
        ]
        setPendingConversion({
            ...conversion,
            discardedNames: invalidDimensionIds.map(getDimensionName),
            emptyDimensionNames:
                emptyDimensionIdsWithDefaults.map(getDimensionName),
            defaultItemNames: defaultItemIds.map(
                (id) => metadataStore.getMetadataItem(id)?.name ?? id
            ),
        })
    }

    const buttonRef = useRef<HTMLDivElement>(null)

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
                            <div className={classes.section}>
                                <div className={classes.sectionHeader}>
                                    {i18n.t('Individual data view')}
                                </div>
                                <div className={classes.grid}>
                                    {INDIVIDUAL_VISUALIZATION_TYPES.map(
                                        (visType) => (
                                            <ListItem
                                                key={visType}
                                                visType={visType}
                                                isSelected={
                                                    visType ===
                                                    visualizationType
                                                }
                                                onClick={handleListItemClick(
                                                    visType
                                                )}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                            <div className={classes.section}>
                                <div className={classes.sectionHeader}>
                                    {i18n.t('Aggregated view')}
                                </div>
                                <div className={classes.grid}>
                                    {AGGREGATED_VISUALIZATION_TYPES.map(
                                        (visType) => (
                                            <ListItem
                                                key={visType}
                                                visType={visType}
                                                isSelected={
                                                    visType ===
                                                    visualizationType
                                                }
                                                onClick={handleListItemClick(
                                                    visType
                                                )}
                                            />
                                        )
                                    )}
                                    {COMING_SOON_VIS_TYPES.map((visType) => (
                                        <ComingSoonListItem
                                            key={visType}
                                            visType={visType}
                                        />
                                    ))}
                                </div>
                            </div>
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
                    onConfirm={() => {
                        applyChange(pendingConversion)
                        setPendingConversion(null)
                    }}
                    onCancel={() => setPendingConversion(null)}
                />
            )}
        </>
    )
}
