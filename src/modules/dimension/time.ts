import { TIME_DIMENSION_IDS } from '@constants/dimensions'
import type {
    DimensionId,
    DimensionRecord,
    OutputType,
    TimeDimensionId,
} from '@types'

export const outputTypeTimeDimensionMap: Record<OutputType, DimensionId> = {
    EVENT: 'eventDate',
    ENROLLMENT: 'enrollmentDate',
    TRACKED_ENTITY_INSTANCE: 'created',
}

/* Mapping from the UPPER_SNAKE_CASE enum values that `timeField` can hold
 * (backend source of truth: `TimeField.java` in dhis2-core) onto the
 * concrete time-dimension id the app uses internally. Used when
 * materialising a legacy `pe` dimension into a proper time dimension. */
export const timeFieldTimeDimensionMap: Record<string, DimensionId> = {
    COMPLETED_DATE: 'completed',
    CREATED: 'created',
    CREATED_DATE: 'created',
    ENROLLMENT_DATE: 'enrollmentDate',
    EVENT_DATE: 'eventDate',
    INCIDENT_DATE: 'incidentDate',
    LAST_UPDATED: 'lastUpdated',
    /* OCCURRED_DATE is the newer tracker enum name for event date. Mapped
     * the same as EVENT_DATE; revisit if a semantic distinction emerges. */
    OCCURRED_DATE: 'eventDate',
    SCHEDULED_DATE: 'scheduledDate',
}

/* Full set of enum values the backend accepts for `timeField`. Derived from
 * the map keys so the two cannot drift. Any value outside this set is
 * treated by the backend as a custom data-element / attribute UID. */
export const KNOWN_TIME_FIELD_VALUES: ReadonlySet<string> = new Set(
    Object.keys(timeFieldTimeDimensionMap)
)

export const isTimeDimensionId = (
    dimensionId: DimensionRecord['dimension']
): dimensionId is TimeDimensionId =>
    (TIME_DIMENSION_IDS as readonly string[]).includes(dimensionId)
