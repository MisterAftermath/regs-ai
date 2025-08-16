/**
 * Jurisdiction Configuration
 *
 * Defines all available jurisdictions and their ChromaDB collections.
 * Add new jurisdictions here to make them available in the system.
 */

export interface Jurisdiction {
  id: string;
  name: string;
  collection: string;
  description?: string;
  state?: string;
  isDefault?: boolean;
}

export const jurisdictions: Jurisdiction[] = [
  // Texas Cities
  {
    id: 'houston',
    name: 'Houston, TX',
    collection: 'regsai',
    state: 'TX',
    isDefault: true, // Set as default
  },
  {
    id: 'alvin',
    name: 'Alvin, TX',
    collection: 'regsai-alvin',
    state: 'TX',
  },
  {
    id: 'angleton',
    name: 'Angleton, TX',
    collection: 'regsai-angleton',
    state: 'TX',
  },
  {
    id: 'baytown',
    name: 'Baytown, TX',
    collection: 'regsai-baytown',
    state: 'TX',
  },
  {
    id: 'bellaire',
    name: 'Bellaire, TX',
    collection: 'regsai-bellaire',
    state: 'TX',
  },
  {
    id: 'brookshire',
    name: 'Brookshire, TX',
    collection: 'regsai-brookshire',
    state: 'TX',
  },
  {
    id: 'conroe',
    name: 'Conroe, TX',
    collection: 'regsai-conroe',
    state: 'TX',
  },
  {
    id: 'deer-park',
    name: 'Deer Park, TX',
    collection: 'regsai-deerpark',
    state: 'TX',
  },
  {
    id: 'friendswood',
    name: 'Friendswood, TX',
    collection: 'regsai-friendswood',
    state: 'TX',
  },
  {
    id: 'fulshear',
    name: 'Fulshear, TX',
    collection: 'regsai-fulshear',
    state: 'TX',
  },
  {
    id: 'galveston',
    name: 'Galveston, TX',
    collection: 'regsai-galveston',
    state: 'TX',
  },
  {
    id: 'hempstead',
    name: 'Hempstead, TX',
    collection: 'regsai-hempstead',
    state: 'TX',
  },
  {
    id: 'humble',
    name: 'Humble, TX',
    collection: 'regsai-humble',
    state: 'TX',
  },
  {
    id: 'iowa-colony',
    name: 'Iowa Colony, TX',
    collection: 'regsai-iowacolony',
    state: 'TX',
  },
  {
    id: 'jersey-village',
    name: 'Jersey Village, TX',
    collection: 'regsai-jerseyvillage',
    state: 'TX',
  },
  {
    id: 'katy',
    name: 'Katy, TX',
    collection: 'regsai-katy',
    state: 'TX',
  },
  {
    id: 'la-marque',
    name: 'La Marque, TX',
    collection: 'regsai-lamarque',
    state: 'TX',
  },
  {
    id: 'la-porte',
    name: 'La Porte, TX',
    collection: 'regsai-laporte',
    state: 'TX',
  },
  {
    id: 'league-city',
    name: 'League City, TX',
    collection: 'regsai-leaguecity',
    state: 'TX',
  },
  {
    id: 'magnolia',
    name: 'Magnolia, TX',
    collection: 'regsai-magnolia',
    state: 'TX',
  },
  {
    id: 'missouri-city',
    name: 'Missouri City, TX',
    collection: 'regsai-missouricity',
    state: 'TX',
  },
  {
    id: 'mont-belvieu',
    name: 'Mont Belvieu, TX',
    collection: 'regsai-montbelvieu',
    state: 'TX',
  },
  {
    id: 'pasadena',
    name: 'Pasadena, TX',
    collection: 'regsai-pasadena',
    state: 'TX',
  },
  {
    id: 'pearland',
    name: 'Pearland, TX',
    collection: 'regsai-pearland',
    state: 'TX',
  },
  {
    id: 'pleak',
    name: 'Pleak, TX',
    collection: 'regsai-pleak',
    state: 'TX',
  },
  {
    id: 'prairie-view',
    name: 'Prairie View, TX',
    collection: 'regsai-prairieview',
    state: 'TX',
  },
  {
    id: 'richmond',
    name: 'Richmond, TX',
    collection: 'regsai-richmond',
    state: 'TX',
  },
  {
    id: 'rosenberg',
    name: 'Rosenberg, TX',
    collection: 'regsai-rosenberg',
    state: 'TX',
  },
  {
    id: 'santa-fe',
    name: 'Santa Fe, TX',
    collection: 'regsai-santafe',
    state: 'TX',
  },
  {
    id: 'seabrook',
    name: 'Seabrook, TX',
    collection: 'regsai-seabrook',
    state: 'TX',
  },
  {
    id: 'south-houston',
    name: 'South Houston, TX',
    collection: 'regsai-southhouston',
    state: 'TX',
  },
  {
    id: 'stafford',
    name: 'Stafford, TX',
    collection: 'regsai-stafford',
    state: 'TX',
  },
  {
    id: 'sugar-land',
    name: 'Sugar Land, TX',
    collection: 'regsai-sugarland',
    state: 'TX',
  },
  {
    id: 'texas-city',
    name: 'Texas City, TX',
    collection: 'regsai-texascity',
    state: 'TX',
  },
  {
    id: 'tomball',
    name: 'Tomball, TX',
    collection: 'regsai-tomball',
    state: 'TX',
  },
  {
    id: 'waller',
    name: 'Waller, TX',
    collection: 'regsai-waller',
    state: 'TX',
  },
  {
    id: 'webster',
    name: 'Webster, TX',
    collection: 'regsai-webster',
    state: 'TX',
  },
  {
    id: 'west-university-place',
    name: 'West University Place, TX',
    collection: 'regsai-westuniversityplace',
    state: 'TX',
  },

  // Texas Counties
  {
    id: 'austin-county',
    name: 'Austin County, TX',
    collection: 'regsai-austincounty',
    state: 'TX',
  },
  {
    id: 'brazoria-county',
    name: 'Brazoria County, TX',
    collection: 'regsai-brazoriacounty',
    state: 'TX',
  },
  {
    id: 'chambers-county',
    name: 'Chambers County, TX',
    collection: 'regsai-chamberscounty',
    state: 'TX',
  },
  {
    id: 'fort-bend-county',
    name: 'Fort Bend County, TX',
    collection: 'regsai-fortbendcounty',
    state: 'TX',
  },
  {
    id: 'galveston-county',
    name: 'Galveston County, TX',
    collection: 'regsai-galvestoncounty',
    state: 'TX',
  },
  {
    id: 'harris-county',
    name: 'Harris County, TX',
    collection: 'regsai-harriscounty',
    state: 'TX',
  },
  {
    id: 'liberty-county',
    name: 'Liberty County, TX',
    collection: 'regsai-libertycounty',
    state: 'TX',
  },
  {
    id: 'montgomery-county',
    name: 'Montgomery County, TX',
    collection: 'regsai-montgomerycounty',
    state: 'TX',
  },
  {
    id: 'san-jacinto-county',
    name: 'San Jacinto County, TX',
    collection: 'regsai-sanjacintocounty',
    state: 'TX',
  },
  {
    id: 'walker-county',
    name: 'Walker County, TX',
    collection: 'regsai-walkercounty',
    state: 'TX',
  },
  {
    id: 'waller-county',
    name: 'Waller County, TX',
    collection: 'regsai-wallercounty',
    state: 'TX',
  },
];

// Helper functions
export function getJurisdictionById(id: string): Jurisdiction | undefined {
  return jurisdictions.find((j) => j.id === id);
}

export function getDefaultJurisdiction(): Jurisdiction {
  return jurisdictions.find((j) => j.isDefault) || jurisdictions[0];
}

export function getJurisdictionsByState(state: string): Jurisdiction[] {
  return jurisdictions.filter((j) => j.state === state);
}

export function getJurisdictionCollection(jurisdictionId?: string): string {
  if (!jurisdictionId) {
    return getDefaultJurisdiction().collection;
  }

  const jurisdiction = getJurisdictionById(jurisdictionId);
  return jurisdiction?.collection || getDefaultJurisdiction().collection;
}
