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
