import { elements } from "../../../core/dom.js";
import { state } from "../../../core/state.js";

export function createSnackRushResultController({
  openPrestart,
  returnToLobby
} = {}) {
  function restartRound() {
    if (state.phase === "submitting") {
      return;
    }

    openPrestart?.({ refreshRankings: true });
  }

  function bindEvents() {
    elements.restartButton.addEventListener("click", () => {
      restartRound();
    });

    elements.lobbyButton.addEventListener("click", () => {
      returnToLobby();
    });
  }

  return {
    bindEvents,
    restartRound
  };
}
