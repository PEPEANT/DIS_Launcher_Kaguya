import { doc, getDb, getDoc, normalizeIsoDate, normalizeNonNegativeInt, normalizePlayerId, normalizeRank, normalizeRewardIds, normalizeScore, normalizeSeasonNumber, normalizeUid, runTransaction, serverTimestamp } from "../api/account-firestore-core.js";
import { normalizeName } from "../../core/state.js";

export async function saveSeasonSummary({
  uid,
  season,
  playerId,
  nickname = "",
  score,
  rank,
  submittedAt = ""
}) {
  const safeUid = normalizeUid(uid);
  const safeSeason = normalizeSeasonNumber(season);
  const safePlayerId = normalizePlayerId(playerId);
  const safeNickname = normalizeName(nickname);
  const safeScore = normalizeScore(score);
  const safeRank = normalizeRank(rank);
  const safeSubmittedAt = normalizeIsoDate(submittedAt) || new Date().toISOString();

  if (!safeUid || safeScore === null) {
    return null;
  }

  const seasonRef = doc(getDb(), "users", safeUid, "seasons", String(safeSeason));
  return runTransaction(getDb(), async (transaction) => {
    const seasonSnapshot = await transaction.get(seasonRef);
    const existing = seasonSnapshot.exists() ? seasonSnapshot.data() || {} : {};
    const existingBestScore = normalizeScore(existing.bestScore);
    const existingBestRank = normalizeRank(existing.bestRank);
    const shouldUpdateBest = existingBestScore === null
      || safeScore > existingBestScore
      || (
        safeScore === existingBestScore
        && safeRank !== null
        && (existingBestRank === null || safeRank < existingBestRank)
      );

    const effectiveBestScore = shouldUpdateBest ? safeScore : existingBestScore;

    const payload = {
      season: safeSeason,
      playerId: safePlayerId,
      lastNickname: safeNickname,
      lastScore: safeScore,
      lastRank: safeRank,
      lastSubmittedAt: safeSubmittedAt,
      updatedAt: serverTimestamp()
    };

    if (!seasonSnapshot.exists()) {
      payload.createdAt = serverTimestamp();
    }

    if (shouldUpdateBest) {
      payload.bestNickname = safeNickname;
      payload.bestScore = safeScore;
      payload.bestRank = safeRank;
      payload.bestSubmittedAt = safeSubmittedAt;
    }

    transaction.set(seasonRef, payload, { merge: true });

    return {
      season: safeSeason,
      playerId: safePlayerId,
      lastNickname: safeNickname,
      lastScore: safeScore,
      lastRank: safeRank,
      lastSubmittedAt: safeSubmittedAt,
      bestNickname: shouldUpdateBest ? safeNickname : normalizeName(existing.bestNickname),
      bestScore: effectiveBestScore,
      bestRank: shouldUpdateBest ? safeRank : existingBestRank,
      bestSubmittedAt: shouldUpdateBest ? safeSubmittedAt : normalizeIsoDate(existing.bestSubmittedAt)
    };
  });
}

export async function fetchSeasonSummary({ uid, season }) {
  const safeUid = normalizeUid(uid);
  const safeSeason = normalizeSeasonNumber(season);

  if (!safeUid) {
    return {
      season: safeSeason,
      playerId: "",
      lastNickname: "",
      lastScore: null,
      lastRank: null,
      lastSubmittedAt: "",
      bestNickname: "",
      bestScore: null,
      bestRank: null,
      bestSubmittedAt: "",
      hujupayEarned: 0,
      scoreRewardIds: []
    };
  }

  const snapshot = await getDoc(doc(getDb(), "users", safeUid, "seasons", String(safeSeason)));
  const data = snapshot.exists() ? snapshot.data() || {} : {};

  return {
    season: safeSeason,
    playerId: normalizePlayerId(data.playerId),
    lastNickname: normalizeName(data.lastNickname),
    lastScore: normalizeScore(data.lastScore),
    lastRank: normalizeRank(data.lastRank),
    lastSubmittedAt: normalizeIsoDate(data.lastSubmittedAt),
    bestNickname: normalizeName(data.bestNickname),
    bestScore: normalizeScore(data.bestScore),
    bestRank: normalizeRank(data.bestRank),
    bestSubmittedAt: normalizeIsoDate(data.bestSubmittedAt),
    hujupayEarned: normalizeNonNegativeInt(data.hujupayEarned),
    scoreRewardIds: normalizeRewardIds(data.scoreRewardIds)
  };
}
