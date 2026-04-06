import { getRankingClosureNotice, isRankingClosed } from "../../../config/runtime.js";

export function createLauncherRankingSync({
  accountSyncService,
  renderRankingList,
  setRankingStatus,
  state,
  t
}) {
  async function syncAuthenticatedAccount() {
    await accountSyncService?.syncAuthenticatedAccount?.();
  }

  async function syncAuthenticatedRankingNicknames({ user = state.authUser, nickname = "" } = {}) {
    const syncResult = await accountSyncService?.syncAuthenticatedRankingNicknames?.({ user, nickname })
      || { updated: false, currentSeasonRankings: null };

    if (Array.isArray(syncResult.currentSeasonRankings)) {
      state.rankings = syncResult.currentSeasonRankings;
      renderRankingList(state.rankings);
      setRankingStatus(
        isRankingClosed()
          ? getRankingClosureNotice()
          : (state.rankings.length ? t("ranking.best") : t("ranking.empty"))
      );
    }

    return Boolean(syncResult.updated);
  }

  return {
    syncAuthenticatedAccount,
    syncAuthenticatedRankingNicknames
  };
}
