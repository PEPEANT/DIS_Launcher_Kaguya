import { getCurrentContentSeasonId } from "./runtime.js";
import { ITEM_TYPES as S1_ITEM_TYPES } from "../seasons/s1/items.js";
import { ITEM_TYPES as S2_ITEM_TYPES } from "../seasons/s2/items.js";

const ITEM_TYPE_SETS = Object.freeze({
  s1: S1_ITEM_TYPES,
  s2: S2_ITEM_TYPES
});

export function getItemTypes(seasonId = getCurrentContentSeasonId()) {
  return ITEM_TYPE_SETS[seasonId] || ITEM_TYPE_SETS.s1;
}

export const ITEM_TYPES = getItemTypes();
