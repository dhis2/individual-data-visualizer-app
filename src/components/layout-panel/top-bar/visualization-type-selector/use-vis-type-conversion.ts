import { useSystemSettings } from '@components/app-wrapper/cached-data/app-cached-data-provider'
import { useAppDispatch, useAppStore, useMetadataStore } from '@hooks'
import { getDefaultItemsForDimension } from '@modules/dimension/default-items'
import { convertLayoutForVisType } from '@modules/layout'
import {
    setVisUiConfigItemsByDimension,
    setVisUiConfigLayout,
    setVisUiConfigVisualizationType,
    getVisUiConfigLayout,
    getVisUiConfigVisualizationType,
} from '@store/vis-ui-config-slice'
import type { Layout, VisualizationType } from '@types'
import { useState } from 'react'

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

export const useVisTypeConversion = () => {
    const dispatch = useAppDispatch()
    const metadataStore = useMetadataStore()
    const { relativePeriod } = useSystemSettings()

    const store = useAppStore()

    const [pendingConversion, setPendingConversion] =
        useState<PendingConversion | null>(null)

    const applyConversion = ({
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

    const convertTo = (targetVisType: VisualizationType) => {
        const state = store.getState()
        if (targetVisType === getVisUiConfigVisualizationType(state)) {
            return
        }
        const { convertedLayout, invalidDimensionIds, emptyDimensionIds } =
            convertLayoutForVisType({
                layout: getVisUiConfigLayout(state),
                itemsByDimension: state.visUiConfig.itemsByDimension,
                targetVisType,
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
            targetVisType,
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
            applyConversion(conversion)
            return
        }
        const defaultItemIds = [
            ...new Set(Object.values(defaultItemsByDimension).flat()),
        ]
        setPendingConversion({
            ...conversion,
            discardedNames: invalidDimensionIds.map(
                (id) => metadataStore.getDimensionMetadataItemOrThrow(id).name
            ),
            emptyDimensionNames: emptyDimensionIdsWithDefaults.map(
                (id) => metadataStore.getDimensionMetadataItemOrThrow(id).name
            ),
            defaultItemNames: defaultItemIds.map(
                (id) => metadataStore.getMetadataItem(id)?.name ?? id
            ),
        })
    }

    const confirmConversion = () => {
        if (pendingConversion) {
            applyConversion(pendingConversion)
            setPendingConversion(null)
        }
    }

    const cancelConversion = () => setPendingConversion(null)

    return {
        pendingConversion,
        convertTo,
        confirmConversion,
        cancelConversion,
    }
}
