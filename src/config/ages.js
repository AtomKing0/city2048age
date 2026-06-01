import agesData from './ages.json';
import buildingsData from './buildings.json';
import balance from './balance.json';

export const AGES = agesData;

export const TILE_NUMBERS = balance.tileNumbers;

// Classic building sprites (used by classic / global / space)
export const BUILDING_PNGS = buildingsData.classic;

// Per-age building sprites
export const AGE_BUILDING_PNGS = {
  stone:      buildingsData.stone,
  egypt:      buildingsData.egypt,
  medieval:   buildingsData.medieval,
  industrial: buildingsData.industrial,
  china:      buildingsData.china,
};
