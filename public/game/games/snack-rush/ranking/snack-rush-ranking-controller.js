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

  function renderActiveAllRankings() {
    const { season, rankings, expanded } = allRankingsModalState;
    const shouldShowAll = season === currentSeason || expanded;
    const visibleRankings = shouldShowAll ? rankings : rankings.slice(0, allRankingsPreviewCount);

    if (elements.allRankingsTitle) {
      elements.allRankingsTitle.textContent = season === 1
        ? t("ranking.previousSeasonTitle")
        : t("ranking.currentFullTitle");
    }

    if (season === 1) {
      renderSeason1Archive(visibleRankings, getRankingSeasonConfig(1).period || t("ranking.season1ArchivePeriod"));
    } else {
      renderAllRankingsList(visibleRankings);
    }

    setAllRankingsToggle({
      visible: season !== currentSeason && rankings.length > allRankingsPreviewCount,
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
      elements.allRankingsTitle.textContent = season === 1
        ? t("ranking.previousSeasonTitle")
        : t("ranking.currentFullTitle");
    }
    setAllRankingsToggle({ visible: false, expanded: false });

    try {
      const { rankings } = await fetchAllRankings({ season });
      allRankingsModalState.season = season;
      allRankingsModalState.rankings = rankings;
      allRankingsModalState.expanded = season === currentSeason;
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
