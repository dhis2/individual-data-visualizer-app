import type { CurrentVisualization } from '@types'

export const PROGRAM_ID = 'program1'
export const STAGE_ID = 'stage1'
export const DIMENSION_ID = `${STAGE_ID}.de1`
const PERIOD_ID = `${STAGE_ID}.eventDate`
const ORG_UNIT_ID = `${STAGE_ID}.ou`

/* An event program, so the EVENT output type is the applicable one — the same
 * shape a real layout dimension carries. Without the program the layout would
 * have no program at all, which makes every output type inapplicable. */
export const metadata = {
    [PROGRAM_ID]: {
        id: PROGRAM_ID,
        name: 'Program 1',
        programType: 'WITHOUT_REGISTRATION',
    },
    [STAGE_ID]: {
        id: STAGE_ID,
        name: 'Stage 1',
        repeatable: false,
        hideDueDate: false,
        program: { id: PROGRAM_ID },
    },
    [DIMENSION_ID]: {
        id: DIMENSION_ID,
        name: 'Data element 1',
        dimensionId: 'de1',
        programId: PROGRAM_ID,
        programStageId: STAGE_ID,
        dimensionType: 'DATA_ELEMENT',
        valueType: 'TEXT',
    },
    [PERIOD_ID]: {
        id: PERIOD_ID,
        name: 'Event date',
        dimensionId: 'eventDate',
        programId: PROGRAM_ID,
        programStageId: STAGE_ID,
        dimensionType: 'PERIOD',
        valueType: 'DATE',
    },
    [ORG_UNIT_ID]: {
        id: ORG_UNIT_ID,
        name: 'Event org. unit',
        dimensionId: 'ou',
        programId: PROGRAM_ID,
        programStageId: STAGE_ID,
        dimensionType: 'ORGANISATION_UNIT',
        valueType: 'ORGANISATION_UNIT',
    },
}

/* A period and an org unit in filters, which every applicable layout needs. */
export const selectionInFilters = {
    filters: [PERIOD_ID, ORG_UNIT_ID],
    itemsByDimension: {
        [PERIOD_ID]: ['LAST_12_MONTHS'],
        [ORG_UNIT_ID]: ['USER_ORGUNIT'],
    },
}

/* digitGroupSeparator is seeded onto the default store's visUiConfig from the
 * mocked system settings (src/test-utils/__fixtures__/system-settings.json),
 * so a currentVis that matches the default ui config must carry the same
 * value. The real load path is not affected: the API always returns a
 * digitGroupSeparator, so both sides agree there. */
export const populatedVis = {
    type: 'LINE_LIST',
    outputType: 'EVENT',
    digitGroupSeparator: 'SPACE',
    columns: [],
    rows: [],
    filters: [],
} as unknown as CurrentVisualization
