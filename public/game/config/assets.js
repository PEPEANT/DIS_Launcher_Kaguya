import { getCurrentContentSeasonId } from "./runtime.js";
import { ASSET_DEFINITIONS as S1_ASSET_DEFINITIONS } from "../seasons/s1/assets.js";
import { ASSET_DEFINITIONS as S2_ASSET_DEFINITIONS } from "../seasons/s2/assets.js";

const ASSET_DEFINITION_SETS = Object.freeze({
  s1: S1_ASSET_DEFINITIONS,
  s2: S2_ASSET_DEFINITIONS
});

const SOURCE_FILE_ALIASES = Object.freeze({
  "Fuju.png": "item/Fuju.png",
  "z1.png": "item/z1.png",
  "z2.png": "item/z2.png",
  "z3.png": "item/z3.png"
});

function normalizeAssetDefinition(definition) {
  const sourceFile = definition?.sourceFile
    ? (SOURCE_FILE_ALIASES[definition.sourceFile] || definition.sourceFile)
    : definition?.sourceFile;

  return sourceFile === definition?.sourceFile
    ? definition
    : { ...definition, sourceFile };
}

export function getAssetDefinitions(seasonId = getCurrentContentSeasonId()) {
  const baseDefinitions = (ASSET_DEFINITION_SETS[seasonId] || ASSET_DEFINITION_SETS.s1).map(normalizeAssetDefinition);
  return baseDefinitions;
}

export const ASSET_DEFINITIONS = getAssetDefinitions();
