import type {
    VisualizationType,
    OptionsTabKey,
    OptionsTabKeyLineList,
    OptionsTabKeyPivotTable,
} from '@types'
import type { FC } from 'react'
import { LegendTab } from './tabs/legend-tab'
import { LineListDataTab } from './tabs/line-list-data-tab'
import { LineListStyleTab } from './tabs/line-list-style-tab'
import { PivotTableDataTab } from './tabs/pivot-table-data-tab'
import { PivotTableStyleTab } from './tabs/pivot-table-style-tab'

type OptionsTabContentProps = {
    visType: VisualizationType
    tabKey: OptionsTabKey
}
export const OptionsTabContent: FC<OptionsTabContentProps> = ({
    visType,
    tabKey,
}) => {
    if (visType === 'LINE_LIST') {
        switch (tabKey as OptionsTabKeyLineList) {
            case 'data':
                return <LineListDataTab />
            case 'legend':
                return <LegendTab />
            case 'style':
                return <LineListStyleTab />
        }
    } else if (visType === 'PIVOT_TABLE') {
        switch (tabKey as OptionsTabKeyPivotTable) {
            case 'data':
                return <PivotTableDataTab />
            case 'legend':
                return <LegendTab />
            case 'style':
                return <PivotTableStyleTab />
        }
    } else {
        throw new Error(
            `Unknown option tab for visType ${visType} tab key ${tabKey}`
        )
    }
}
