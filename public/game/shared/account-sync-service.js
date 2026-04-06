import { getRankingSeasonConfig, isRankingClosed } from "../config/runtime.js";

export function createAccountSyncService({
  currentSeason,
  profileSeason,
  fetchAccountIdentity,
  fetchAllRankingsFromProvider,
  getMemberDisplayName,
  isPlaytestActive,
  normalizeName,
  state,
  submitScoreToProvider,
  syncAccountIdentity
}) {
  function collectLinkedPlayerIds(accountIdentity = null) {
    return [...new Set(
      [
        state.playerId,
        accountIdentity?.firstLinkedPlayerId,
        accountIdentity?.lastSeenPlayerId,
        ...(Array.isArray(accountIdentity?.linkedPlayerIds) ? accountIdentity.linkedPlayerIds : [])
      ]
        .map((playerId) => String(playerId || "").trim())
        .filter(Boolean)
    )];
  }

  async function syncRankingNicknameForSeason({ season, user, nickname, linkedPlayerIds }) {
    if (!user?.uid || !nickname || !linkedPlayerIds.length) {
      return { updated: false, rankings: null };
    }

    if (isRankingClosed() || getRankingSeasonConfig(season).status !== "current") {
      return { updated: false, rankings: null };
    }

    const { rankings = [] } = await fetchAllRankingsFromProvider({ season });
    const existingEntry = rankings.find((entry) => linkedPlayerIds.includes(String(entry?.playerId || "").trim()));

    if (!existingEntry?.playerId || !Number.isFinite(Number(existingEntry.score))) {
      return { updated: false, rankings: null };
    }

    const existingNickname = normalizeName(existingEntry.nicknameSnapshot || existingEntry.name);
    const existingUid = String(existingEntry.uid || "").trim();
    if (existingNickname === nickname && existingUid === user.uid) {
      return { updated: false, rankings: null };
    }

    const result = await submitScoreToProvider({
      season,
      playerId: existingEntry.playerId,
      uid: user.uid,
      name: nickname,
      score: existingEntry.score
    });

    return {
      updated: true,
      rankings: season === currentSeason && Array.isArray(result?.rankings) ? result.rankings : null
    };
  }

  async function syncAuthenticatedAccount() {
    if (isPlaytestActive() || !state.authUser) {
      return;
    }

    try {
      const linkResult = await syncAccountIdentity({
        user: state.authUser,
        playerId: state.playerId,
        nickname: state.nickname || getMemberDisplayName(state.authUser)
      });

      if (linkResult?.status === "conflict") {
        console.warn("Identity link conflict detected for current playerId.");
      }
    } catch (error) {
      console.warn("Failed to sync account identity.", error);
    }
  }

  async function syncAuthenticatedRankingNicknames({ user = state.authUser, nickname = "" } = {}) {
    if (isPlaytestActive() || !user?.uid) {
      return { updated: false, currentSeasonRankings: null };
    }

    const safeNickname = normalizeName(nickname || getMemberDisplayName(user) || state.nickname);
    if (!safeNickname) {
      return { updated: false, currentSeasonRankings: null };
    }

    const accountIdentity = await fetchAccountIdentity({ uid: user.uid });
    const linkedPlayerIds = collectLinkedPlayerIds(accountIdentity);
    if (!linkedPlayerIds.length) {
      return { updated: false, currentSeasonRankings: null };
    }

    const seasonsToSync = [...new Set([currentSeason, profileSeason])];
    const results = await Promise.allSettled(
      seasonsToSync.map((season) => syncRankingNicknameForSeason({
        season,
        user,
        nickname: safeNickname,
        linkedPlayerIds
      }))
    );

    const fulfilled = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    const currentSeasonResult = fulfilled.find((result) => Array.isArray(result?.rankings));

    return {
      updated: fulfilled.some((result) => result?.updated),
      currentSeasonRankings: currentSeasonResult?.rankings || null
    };
  }

  return {
    syncAuthenticatedAccount,
    syncAuthenticatedRankingNicknames
  };
}
