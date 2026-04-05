import { playGameMusic, playLobbyMusic } from "../../../core/audio.js";
import { exitLandscapePresentation, isPortraitTouchViewport, isTouchDevice, requestLandscapePresentation } from "../../../core/device.js";
import { elements } from "../../../core/dom.js";
import { handleMovementKey, startRound, triggerSlide } from "./snack-rush-logic.js";
import { state } from "../../../core/state.js";
import { hideGameResult, setLobbyMobilePanel, setOrientationGateState, showGameScreen, showLobbyScreen } from "../../../core/ui.js";

function bindHoldButton(element, code) {
  if (!element) {
    return;
  }

  const press = (event) => {
    event.preventDefault();
    handleMovementKey(code, true, { trackTap: false });
  };

  const release = (event) => {
    event.preventDefault();
    handleMovementKey(code, false, { trackTap: false });
  };

  element.addEventListener("pointerdown", press);
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener("pointerleave", release);
}

function bindTapButton(element, handler) {
  if (!element || typeof handler !== "function") {
    return;
  }

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handler();
  });
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

export function createSnackRushSessionController({
  getActiveNickname,
  getOrientationGateCopy,
  isPlaytestActive,
  postPlaytestStatus,
  refreshMessagesInbox,
  refreshRankings,
  syncBootStatusUi,
  syncMobileNavigationState,
  syncResponsiveUi,
  updateLobbyPlayerInfo
}) {
  function openPrestart({ refreshRankings: shouldRefreshRankings = true } = {}) {
    hideGameResult();
    setLobbyMobilePanel("none");

    if (state.phase !== "loading" && state.phase !== "submitting") {
      state.phase = "ready";
    }

    syncBootStatusUi?.();
    showGameScreen({ mode: "prestart" });
    playGameMusic();
    syncResponsiveUi();
    postPlaytestStatus();

    if (!isPlaytestActive() && shouldRefreshRankings) {
      void refreshRankings();
    }
  }

  function launchGame() {
    hideGameResult();
    setLobbyMobilePanel("none");
    syncMobileNavigationState();
    showGameScreen({ mode: "playing" });
    playGameMusic();
    syncResponsiveUi();
    postPlaytestStatus();
    window.setTimeout(() => {
      syncResponsiveUi();
      void requestLandscapePresentation(elements.gameScreen);
      postPlaytestStatus();
    }, 180);
  }

  function queueRoundStart(nickname) {
    if (isTouchDevice() && isPortraitTouchViewport()) {
      setOrientationGateState({
        visible: true,
        ...getOrientationGateCopy("start")
      });
      void requestLandscapePresentation(document.documentElement);
      return;
    }

    startRound(nickname);
    launchGame();
  }

  function returnToLobby() {
    state.phase = "ready";
    hideGameResult();
    setLobbyMobilePanel("none");
    showLobbyScreen();
    updateLobbyPlayerInfo();
    syncMobileNavigationState();
    playLobbyMusic();
    syncResponsiveUi();
    void refreshMessagesInbox({ triggerLobbyPrompt: true });
    if (!isPlaytestActive()) {
      refreshRankings();
    }
    exitLandscapePresentation();
    postPlaytestStatus();
  }

  function bindEvents() {
    window.addEventListener("keydown", (event) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "KeyA", "KeyD", "KeyS", "KeyW", "Space"].includes(event.code)) {
        event.preventDefault();
      }

      handleMovementKey(event.code, true, { repeat: event.repeat });
    });

    window.addEventListener("keyup", (event) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      handleMovementKey(event.code, false);
    });

    bindHoldButton(elements.moveLeftButton, "ArrowLeft");
    bindHoldButton(elements.moveRightButton, "ArrowRight");
    bindTapButton(elements.duckButton, () => {
      triggerSlide();
    });
    elements.snackRushPrestartBackButton?.addEventListener("click", () => {
      returnToLobby();
    });

    elements.jumpButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handleMovementKey("Space", true);
    });
  }

  return {
    bindEvents,
    launchGame,
    openPrestart,
    queueRoundStart,
    returnToLobby
  };
}
