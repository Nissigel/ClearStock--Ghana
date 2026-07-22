export type Region =
  | 'Greater Accra'
  | 'Ashanti'
  | 'Western'
  | 'Eastern'
  | 'Central'
  | 'Northern'
  | 'Upper East'
  | 'Upper West'
  | 'Volta'
  | 'Brong-Ahafo'
  | 'Western North'
  | 'Ahafo'
  | 'Bono East'
  | 'North East'
  | 'Savannah'
  | 'Oti';

export interface RegionData {
  name: Region;
  cities: string[];
}

export const REGIONS: RegionData[] = [
  {
    name: 'Greater Accra',
    cities: [
      'Accra',
      'Tema',
      'Madina',
      'Kasoa',
      'Adenta',
      'Ashaiman',
      'Teshie',
      'Nungua',
      'Dome',
      'Achimota',
    ],
  },
  {
    name: 'Ashanti',
    cities: [
      'Kumasi',
      'Obuasi',
      'Ejisu',
      'Konongo',
      'Mampong',
      'Bekwai',
      'Ashanti Mampong',
      'Juaben',
    ],
  },
  {
    name: 'Western',
    cities: [
      'Takoradi',
      'Sekondi',
      'Tarkwa',
      'Axim',
      'Prestea',
      'Bogoso',
      'Dixcove',
    ],
  },
  {
    name: 'Eastern',
    cities: [
      'Koforidua',
      'Nkawkaw',
      'Akim Oda',
      'Somanya',
      'Mpraeso',
      'Aburi',
      'Nsawam',
    ],
  },
  {
    name: 'Central',
    cities: [
      'Cape Coast',
      'Winneba',
      'Kasoa',
      'Swedru',
      'Saltpond',
      'Anomabo',
      'Mankessim',
    ],
  },
  {
    name: 'Northern',
    cities: [
      'Tamale',
      'Yendi',
      'Savelugu',
      'Tolon',
      'Gushegu',
      'Karaga',
      'Nanton',
    ],
  },
  {
    name: 'Upper East',
    cities: [
      'Bolgatanga',
      'Navrongo',
      'Bawku',
      'Zebilla',
      'Paga',
      'Chiana',
    ],
  },
  {
    name: 'Upper West',
    cities: [
      'Wa',
      'Lawra',
      'Nandom',
      'Jirapa',
      'Tumu',
      'Gwollu',
    ],
  },
  {
    name: 'Volta',
    cities: [
      'Ho',
      'Hohoe',
      'Keta',
      'Aflao',
      'Sogakope',
      'Kpando',
    ],
  },
  {
    name: 'Brong-Ahafo',
    cities: [
      'Sunyani',
      'Techiman',
      'Berekum',
      'Wenchi',
      'Dormaa Ahenkro',
      'Kintampo',
    ],
  },
  {
    name: 'Western North',
    cities: ['Sefwi Wiawso', 'Bibiani', 'Enchi', 'Juaboso'],
  },
  {
    name: 'Ahafo',
    cities: ['Goaso', 'Kukuom', 'Acherensua', 'Bechem'],
  },
  {
    name: 'Bono East',
    cities: ['Techiman', 'Nkoranza', 'Atebubu', 'Kintampo'],
  },
  {
    name: 'North East',
    cities: ['Nalerigu', 'Gambaga', 'Walewale', 'Bunkpurugu'],
  },
  {
    name: 'Savannah',
    cities: ['Damongo', 'Bole', 'Sawla', 'Salaga'],
  },
  {
    name: 'Oti',
    cities: ['Dambai', 'Jasikan', 'Kadjebi', 'Nkwanta'],
  },
];

export const getRegionNames = (): Region[] => {
  return REGIONS.map((r) => r.name);
};

export const getCitiesByRegion = (region: Region): string[] => {
  const found = REGIONS.find((r) => r.name === region);
  return found ? found.cities : [];
};