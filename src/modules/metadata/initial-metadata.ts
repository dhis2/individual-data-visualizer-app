import i18n from '@dhis2/d2-i18n'
import { getCreatedDimension } from '@modules/dimension/fixed'
import { getStatusNames } from '@modules/status'
import type { InitialMetadataItems, UserOrgUnit } from '@types'

const getOrganisationUnits = (): Record<UserOrgUnit, string> => ({
    USER_ORGUNIT: i18n.t('User organisation unit'),
    USER_ORGUNIT_CHILDREN: i18n.t('User sub-units'),
    USER_ORGUNIT_GRANDCHILDREN: i18n.t('User sub-x2-units'),
})

export const getInitialMetadata = (
    relativePeriodsNames: Record<string, string>
): InitialMetadataItems => ({
    /* pe must be a DimensionMetadataItem (with dimensionType) so that
     * getDimensionMetadataItem('pe') succeeds when buildAxis processes
     * period dimensions from the layout during visualization updates. */
    pe: {
        id: 'pe',
        name: i18n.t('Period'),
        dimensionType: 'PERIOD',
    },
    ...getStatusNames(),
    ...getCreatedDimension(),
    ...relativePeriodsNames,
    ...getOrganisationUnits(),
})
