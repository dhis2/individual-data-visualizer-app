export type AnalyticsModule = {
    getRelativePeriodsName: () => Record<string, string>
}

/* The real hook reads the server version from the app-runtime config, which
 * tests don't provide, and fetches the period types on 2.43+. */
export const stubUseRelativePeriodsNames =
    ({ getRelativePeriodsName }: AnalyticsModule) =>
    () => ({
        relativePeriodsNames: getRelativePeriodsName(),
        loading: false,
        error: null,
    })
