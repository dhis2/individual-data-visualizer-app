import { removeNonPersistedDimensionProperties } from '@modules/dimension/translation'
import type { SavedVisualization } from '@types'

export const getSaveableVisualization = (
    vis: SavedVisualization
): SavedVisualization => {
    const result: Partial<SavedVisualization> = {
        ...vis,
        columns: removeNonPersistedDimensionProperties(vis.columns),
        rows: removeNonPersistedDimensionProperties(vis.rows),
        filters: removeNonPersistedDimensionProperties(vis.filters),
    }
    // Remove legacy flag when saving — a legacy-loaded vis is re-saved in the new format.
    delete result.legacy
    return result as SavedVisualization
}
