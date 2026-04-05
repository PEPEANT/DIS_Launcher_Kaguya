import { elements } from "../../../core/dom.js";
import { state } from "../../../core/state.js";
import {
  closeAllRankingsModal,
  closeGuideModal,
  openAllRankingsModal,
  openGuideModal,
  setRankingStatus
} from "../../../core/ui.js";

export function createSnackRushEntryController({
  currentSeason,
  getActiveNickname,
  isPlaytestActive,
  queueRoundStart,
  refreshRankings,
  showAllRankingsForSeason,
  toggleAllRankingsExpansion
}) {
  function showRankingsModal(season) {
    openAllRankingsModal();
    void showAllRankingsForSeason(season);
  }

  function bindEvents() {
    elements.startForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (state.phase === "loading" || state.phase === "submitting") {
        return;
      }

      const nickname = getActiveNickname();
      elements.nicknameInput.value = nickname;
      queueRoundStart(nickname);
    });

    elements.refreshRankingButton.addEventListener("click", () => {
      if (isPlaytestActive()) {
        setRankingStatus("Playtest mode: rankings are disabled.");
        return;
      }

      refreshRankings();
    });

    elements.viewAllRankingsButton.addEventListener("click", () => {
      showRankingsModal(1);
    });

    elements.rankingViewAllBottomButton?.addEventListener("click", () => {
      showRankingsModal(currentSeason);
    });

    elements.closeAllRankingsButton.addEventListener("click", () => {
      closeAllRankingsModal();
    });

    elements.allRankingsModal.addEventListener("click", (event) => {
      if (event.target === elements.allRankingsModal) {
        closeAllRankingsModal();
      }
    });

    elements.seasonTab2.addEventListener("click", async () => {
      if (elements.seasonTab2.classList.contains("season-tab--active")) {
        return;
      }

      await showAllRankingsForSeason(2);
    });

    elements.seasonTab1.addEventListener("click", async () => {
      if (elements.seasonTab1.classList.contains("season-tab--active")) {
        return;
      }

      await showAllRankingsForSeason(1);
    });

    elements.toggleAllRankingsButton.addEventListener("click", () => {
      toggleAllRankingsExpansion();
    });

    elements.snackRushGuideButton?.addEventListener("click", () => {
      openGuideModal();
    });

    elements.closeGuideModalButton?.addEventListener("click", () => {
      closeGuideModal();
    });

    elements.guideModal?.addEventListener("click", (event) => {
      if (event.target === elements.guideModal) {
        closeGuideModal();
      }
    });
  }

  return {
    bindEvents
  };
}
