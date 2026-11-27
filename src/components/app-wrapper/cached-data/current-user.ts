import type { CurrentUser as CurrentUserInfo } from '@dhis2/app-service-user'

const FALLBACK_LOCALE = 'en'

/* DHIS2 stores locales in Java's Locale.toString() format,
 * language[_REGION[_Script]], which Intl rejects. BCP 47 uses hyphens and puts
 * the script before the region: language[-Script[-REGION]]. */
export const toIntlLocale = (dhis2Locale: string | undefined): string => {
    if (!dhis2Locale) {
        return FALLBACK_LOCALE
    }

    const [language, region, script] = dhis2Locale.split('_')
    const languageTag = [language, script, region].filter(Boolean).join('-')

    try {
        return new Intl.Locale(languageTag).baseName
    } catch {
        return FALLBACK_LOCALE
    }
}

type DisplayNameProperty = 'displayName' | 'displayShortName'

export type CurrentUser = Pick<
    CurrentUserInfo,
    'id' | 'username' | 'authorities'
> & {
    name: string
    settings: {
        /* BCP 47 tags, for Intl */
        dbLocale: string
        uiLocale: string
        displayProperty: string | undefined
        displayNameProperty: DisplayNameProperty
    }
}

export const toCurrentUser = ({
    id,
    username,
    displayName,
    authorities,
    settings,
}: CurrentUserInfo): CurrentUser => ({
    id,
    username,
    name: displayName,
    authorities,
    settings: {
        dbLocale: toIntlLocale(settings?.keyDbLocale),
        uiLocale: toIntlLocale(settings?.keyUiLocale),
        displayProperty: settings?.keyAnalysisDisplayProperty,
        displayNameProperty:
            settings?.keyAnalysisDisplayProperty === 'name'
                ? 'displayName'
                : 'displayShortName',
    },
})
