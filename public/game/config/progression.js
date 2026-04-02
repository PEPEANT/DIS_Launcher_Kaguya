import { getCurrentContentSeasonId } from "./runtime.js";
import { BACKGROUND_SCORE_STAGES as S1_BACKGROUND_SCORE_STAGES, ROUND_DEFINITIONS as S1_ROUND_DEFINITIONS } from "../seasons/s1/progression.js";
import { BACKGROUND_SCORE_STAGES as S2_BACKGROUND_SCORE_STAGES, ROUND_DEFINITIONS as S2_ROUND_DEFINITIONS } from "../seasons/s2/progression.js";

const ROUND_DEFINITION_SETS = Object.freeze({
  s1: S1_ROUND_DEFINITIONS,
  s2: S2_ROUND_DEFINITIONS
});

const BACKGROUND_SCORE_STAGE_SETS = Object.freeze({
  s1: S1_BACKGROUND_SCORE_STAGES,
  s2: S2_BACKGROUND_SCORE_STAGES
});

export function getRoundDefinitions(seasonId = getCurrentContentSeasonId()) {
  return ROUND_DEFINITION_SETS[seasonId] || ROUND_DEFINITION_SETS.s1;
}

export function getBackgroundScoreStages(seasonId = getCurrentContentSeasonId()) {
  return BACKGROUND_SCORE_STAGE_SETS[seasonId] || BACKGROUND_SCORE_STAGE_SETS.s1;
}

export const ROUND_DEFINITIONS = getRoundDefinitions();
export const BACKGROUND_SCORE_STAGES = getBackgroundScoreStages();
