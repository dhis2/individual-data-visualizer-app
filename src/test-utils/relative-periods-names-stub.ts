export type AnalyticsModule = {
    getRelativePeriodsName: () => Record<string, string>
}

/* For specs that render a metadata provider without the mock app wrapper,
 * which is what supplies the runtime config and the period types responses
 * the real hook needs. */
export const stubUseRelativePeriodsNames =
    ({ getRelativePeriodsName }: AnalyticsModule) =>
    () => ({
        relativePeriodsNames: getRelativePeriodsName(),
        loading: false,
        error: null,
    })
