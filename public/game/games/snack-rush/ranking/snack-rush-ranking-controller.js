import { elements } from "../../../core/dom.js";

export function createSnackRushRankingController({
  allRankingsPreviewCount,
  currentSeason,
  fetchAllRankings,
  fetchEntryRankings,
  getRankingSeasonConfig,
  isPlaytestActive,
  renderAllRankingsList,
  renderRankingList,
  renderSeason1Archive,
  setActiveSeasonTab,
  setAllRankingsStatus,
  setAllRankingsToggle,
  setRankingStatus,
  state,
  t
}) {
  const allRankingsModalState = {
    season: currentSeason,
    rankings: [],
    expanded: false
  };

  function isEndedRankingSeason(season) {
    return getRankingSeasonConfig(season).status !== "current";
  }

  function getAllRankingsTitleForSeason(season) {
    return season === currentSeason
      ? t("ranking.currentFullTitle")
      : t("ranking.previousSeasonTitle");
  }

  function renderActiveAllRankings() {
    const { season, rankings, expanded } = allRankingsModalState;
    const seasonConfig = getRankingSeasonConfig(season);
    const seasonEnded = isEndedRankingSeason(season);
    const shouldShowAll = !seasonEnded || expanded;
    const visibleRankings = shouldShowAll ? rankings : rankings.slice(0, allRankingsPreviewCount);

    if (elements.allRankingsTitle) {
      elements.allRankingsTitle.textContent = getAllRankingsTitleForSeason(season);
    }

    if (seasonEnded) {
      renderAllRankingsList(visibleRankings, {
        archived: true,
        archivedTitle: getAllRankingsTitleForSeason(season),
        period: seasonConfig.period || t("ranking.season1ArchivePeriod")
      });
    } else {
      renderAllRankingsList(visibleRankings);
    }

    setAllRankingsToggle({
      visible: seasonEnded && rankings.length > allRankingsPreviewCount,
      expanded
    });
  }

  async function showAllRankingsForSeason(season) {
    const rankingsScrollBody = elements.allRankingsList?.closest(".all-rankings-body");
    if (rankingsScrollBody) {
      rankingsScrollBody.scrollTop = 0;
    }

    if (isPlaytestActive()) {
      allRankingsModalState.season = season;
      allRankingsModalState.rankings = [];
      allRankingsModalState.expanded = false;
      if (elements.allRankingsList) {
        elements.allRankingsList.innerHTML = "";
      }
      setAllRankingsStatus("Playtest mode: rankings are disabled.");
      setAllRankingsToggle({ visible: false, expanded: false });
      return;
    }

    setActiveSeasonTab(season);
    if (elements.allRankingsList) {
      elements.allRankingsList.innerHTML = "";
    }
    if (elements.allRankingsStatus) {
      elements.allRankingsStatus.textContent = t("ranking.loading");
      elements.allRankingsStatus.hidden = false;
    }
    if (elements.allRankingsTitle) {
      elements.allRankingsTitle.textContent = getAllRankingsTitleForSeason(season);
    }
    setAllRankingsToggle({ visible: false, expanded: false });

    try {
      const { rankings } = await fetchAllRankings({ season });
      allRankingsModalState.season = season;
      allRankingsModalState.rankings = rankings;
      allRankingsModalState.expanded = !isEndedRankingSeason(season);
      renderActiveAllRankings();
    } catch {
      setAllRankingsStatus(t("ranking.failed"));
      setAllRankingsToggle({ visible: false, expanded: false });
    }
  }

  function toggleAllRankingsExpansion() {
    allRankingsModalState.expanded = !allRankingsModalState.expanded;
    renderActiveAllRankings();
  }

  function refreshEntryRankings() {
    if (!isPlaytestActive()) {
      fetchEntryRankings({ background: true });
    }
  }

  function syncLanguageState() {
    renderRankingList(state.rankings);

    if (!elements.allRankingsModal?.hidden) {
      renderActiveAllRankings();
    }
  }

  return {
    refreshEntryRankings,
    renderActiveAllRankings,
    showAllRankingsForSeason,
    syncLanguageState,
    toggleAllRankingsExpansion
  };
}
