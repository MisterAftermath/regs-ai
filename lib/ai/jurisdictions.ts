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
  // Texas jurisdictions
  {
    id: 'houston',
    name: 'Houston, TX',
    collection: 'regsai-houston',
    state: 'TX',
    isDefault: true, // Set one as default
  },
  {
    id: 'austin',
    name: 'Austin, TX',
    collection: 'regsai-austin',
    state: 'TX',
  },
  {
    id: 'dallas',
    name: 'Dallas, TX',
    collection: 'regsai-dallas',
    state: 'TX',
  },
  {
    id: 'san-antonio',
    name: 'San Antonio, TX',
    collection: 'regsai-san-antonio',
    state: 'TX',
  },
  {
    id: 'fort-worth',
    name: 'Fort Worth, TX',
    collection: 'regsai-fort-worth',
    state: 'TX',
  },

  // Add more jurisdictions as needed
  // California jurisdictions example:
  // {
  //   id: 'los-angeles',
  //   name: 'Los Angeles, CA',
  //   collection: 'regsai-los-angeles',
  //   state: 'CA',
  // },
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
