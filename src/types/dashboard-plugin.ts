import type { PluginFilters, SavedVisualization } from '@types'

export type DashboardPluginProps = {
    visualizationId: SavedVisualization['id']
    filters?: PluginFilters
}
