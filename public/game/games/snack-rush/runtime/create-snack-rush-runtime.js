import { createSnackRushEntryController } from "../entry/snack-rush-entry-controller.js";
import { createSnackRushRankingController } from "../ranking/snack-rush-ranking-controller.js";
import { createSnackRushSessionController } from "../gameplay/snack-rush-session-controller.js";
import { createSnackRushResultController } from "../result/snack-rush-result-controller.js";

export function createSnackRushRuntime({
  currentSeason,
  entry,
  ranking,
  session,
  state,
  t
}) {
  const snackRushRankingController = createSnackRushRankingController({
    allRankingsPreviewCount: ranking.allRankingsPreviewCount,
    currentSeason,
    fetchAllRankings: ranking.fetchAllRankings,
    fetchEntryRankings: ranking.fetchEntryRankings,
    getRankingSeasonConfig: ranking.getRankingSeasonConfig,
    isPlaytestActive: entry.isPlaytestActive,
    renderAllRankingsList: ranking.renderAllRankingsList,
    renderRankingList: ranking.renderRankingList,
    renderSeason1Archive: ranking.renderSeason1Archive,
    setActiveSeasonTab: ranking.setActiveSeasonTab,
    setAllRankingsStatus: ranking.setAllRankingsStatus,
    setAllRankingsToggle: ranking.setAllRankingsToggle,
    setRankingStatus: ranking.setRankingStatus,
    state,
    t
  });

  const snackRushSessionController = createSnackRushSessionController({
    getActiveNickname: entry.getCurrentRoundNickname,
    getOrientationGateCopy: session.getOrientationGateCopy,
    isPlaytestActive: session.isPlaytestActive,
    postPlaytestStatus: session.postPlaytestStatus,
    refreshMessagesInbox: session.refreshMessagesInbox,
    refreshRankings: session.refreshRankings,
    syncBootStatusUi: () => syncBootStatusUi({
      setRankingStatus: ranking.setRankingStatus,
      setStartButtonState: entry.setStartButtonState
    }),
    syncMobileNavigationState: session.syncMobileNavigationState,
    syncResponsiveUi: session.syncResponsiveUi,
    updateLobbyPlayerInfo: session.updateLobbyPlayerInfo
  });

  const snackRushEntryController = createSnackRushEntryController({
    currentSeason,
    getActiveNickname: entry.getCurrentRoundNickname,
    isPlaytestActive: entry.isPlaytestActive,
    queueRoundStart: (...args) => snackRushSessionController.queueRoundStart(...args),
    refreshRankings: entry.refreshRankings,
    showAllRankingsForSeason: (...args) => snackRushRankingController.showAllRankingsForSeason(...args),
    toggleAllRankingsExpansion: (...args) => snackRushRankingController.toggleAllRankingsExpansion(...args)
  });

  const snackRushResultController = createSnackRushResultController({
    openPrestart: (...args) => snackRushSessionController.openPrestart(...args),
    returnToLobby: (...args) => snackRushSessionController.returnToLobby(...args)
  });

  function syncLanguageState({ setRankingStatus, setStartButtonState }) {
    snackRushRankingController.syncLanguageState();
    syncBootStatusUi({ setRankingStatus, setStartButtonState });
  }

  function syncBootStatusUi({ setRankingStatus, setStartButtonState }) {
    if (state.phase === "loading") {
      setStartButtonState({
        label: t("boot.loading.button"),
        disabled: true
      });
      return;
    }

    if (state.phase === "ready") {
      setStartButtonState({
        label: t("boot.ready.button"),
        disabled: false
      });

      if (entry.isPlaytestActive()) {
        setRankingStatus("Playtest mode: rankings are disabled.");
      } else {
        setRankingStatus(state.rankings.length ? t("ranking.best") : t("ranking.empty"));
      }
      return;
    }

    if (state.phase === "error") {
      setStartButtonState({
        label: t("boot.error.button"),
        disabled: true
      });
      setRankingStatus(t("boot.error.status"));
    }
  }

  return {
    refreshEntryRankings: (...args) => snackRushRankingController.refreshEntryRankings(...args),
    snackRushEntryController,
    snackRushResultController,
    snackRushRankingController,
    snackRushSessionController,
    syncBootStatusUi,
    syncLanguageState
  };
}
