import { getCurrentContentSeasonId } from "./runtime.js";
import { FINAL_BOSS_PREP_CONFIG as S2_FINAL_BOSS_PREP_CONFIG } from "../seasons/s2/final-boss-prep.js";

const DEFAULT_FINAL_BOSS_PREP_CONFIG = Object.freeze({
  enabled: false,
  scoreThreshold: Number.POSITIVE_INFINITY,
  bonusTime: 0,
  backgroundKey: "",
  labelKey: "",
  transitionKey: "",
  musicTrackKey: "game",
  effects: null,
  roundOverride: null
});

export function getFinalBossPrepConfig(seasonId = getCurrentContentSeasonId()) {
  if (seasonId === "s2") {
    return S2_FINAL_BOSS_PREP_CONFIG;
  }

  return DEFAULT_FINAL_BOSS_PREP_CONFIG;
}

export const FINAL_BOSS_PREP_CONFIG = getFinalBossPrepConfig();
