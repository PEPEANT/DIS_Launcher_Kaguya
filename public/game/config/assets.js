import { getCurrentContentSeasonId } from "./runtime.js";
import { ASSET_DEFINITIONS as S1_ASSET_DEFINITIONS } from "../seasons/s1/assets.js";
import { ASSET_DEFINITIONS as S2_ASSET_DEFINITIONS } from "../seasons/s2/assets.js";

const ASSET_DEFINITION_SETS = Object.freeze({
  s1: S1_ASSET_DEFINITIONS,
  s2: S2_ASSET_DEFINITIONS
});

export function getAssetDefinitions(seasonId = getCurrentContentSeasonId()) {
  return ASSET_DEFINITION_SETS[seasonId] || ASSET_DEFINITION_SETS.s1;
}

export const ASSET_DEFINITIONS = getAssetDefinitions();
