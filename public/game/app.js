import { loadAssets } from "./assets.js";
import { initAudio, playGameMusic, playLobbyMusic, toggleMusic } from "./audio.js";
import { exitLandscapePresentation, isPortraitTouchViewport, isTouchDevice, requestLandscapePresentation } from "./device.js";
import { elements } from "./dom.js";
import { getLang, initI18n, t } from "./i18n.js";
import { fetchRankings, handleMovementKey, startRound, updateGame } from "./logic.js";
import { getOrCreatePlayerId, getSavedNickname, rememberNickname } from "./player-identity.js";
import { renderFrame } from "./render.js";
import { checkNicknameAvailabilityFromProvider } from "./ranking-service.js";
import { normalizeName, state } from "./state.js";
import {
  hideGameResult,
  renderGuideImages,
  renderRankingList,
  setLobbyMobilePanel,
  setOrientationGateVisible,
  setRankingStatus,
  setStartButtonState,
  setTouchControlsVisible,
  showGameScreen,
  showIntroScreen,
  showLobbyScreen
} from "./ui.js";

let lastFrameTime = 0;
let booted = false;
let rankingPollTimer = 0;
const RANKING_POLL_INTERVAL = 5000;
const MAX_PLAYER_NUMBER = 99;

function animate(currentTime) {
  if (!lastFrameTime) {
    lastFrameTime = currentTime;
  }

  const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.033);
  lastFrameTime = currentTime;

  updateGame(dt);
  renderFrame();
  requestAnimationFrame(animate);
}

function syncResponsiveUi() {
  setTouchControlsVisible(isTouchDevice());
  setOrientationGateVisible(isPortraitTouchViewport());
}

function refreshRankingsInBackground() {
  if (document.hidden || elements.lobbyScreen.hidden || state.phase === "loading" || state.phase === "submitting") {
    return;
  }

  fetchRankings({ background: true });
}

function startRankingPolling() {
  if (rankingPollTimer) {
    return;
  }

  rankingPollTimer = window.setInterval(refreshRankingsInBackground, RANKING_POLL_INTERVAL);
}

function getActiveNickname() {
  return normalizeName(elements.nicknameInput.value) || state.nickname;
}

function setIntroNicknameStatus(text = "") {
  elements.introNicknameStatus.textContent = text;
  elements.introNicknameStatus.hidden = !text;
}

function clearIntroNicknameValidation() {
  elements.introNicknameInput.setCustomValidity("");
  setIntroNicknameStatus("");
}

function getDefaultNicknameBase() {
  return t("lobby.defaultNickname");
}

function getPreferredPlayerNumber() {
  const seed = Array.from(state.playerId || "player").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (seed % MAX_PLAYER_NUMBER) + 1;
}

function buildNumberedNickname(number) {
  return normalizeName(`${getDefaultNicknameBase()}${number}`);
}

async function isNicknameAvailable(name) {
  const payload = await checkNicknameAvailabilityFromProvider({
    playerId: state.playerId,
    name
  });

  return Boolean(payload?.available);
}

async function findSuggestedNickname() {
  const startNumber = getPreferredPlayerNumber();

  for (let offset = 0; offset < MAX_PLAYER_NUMBER; offset += 1) {
    const candidateNumber = ((startNumber - 1 + offset) % MAX_PLAYER_NUMBER) + 1;
    const candidate = buildNumberedNickname(candidateNumber);

    if (await isNicknameAvailable(candidate)) {
      return candidate;
    }
  }

  return buildNumberedNickname(startNumber);
}

function getNicknameTakenMessage(suggestion) {
  switch (getLang()) {
    case "ja":
      return `すでに使われているニックネームです。${suggestion} を使ってください。`;
    case "en":
      return `That nickname is already taken. Try ${suggestion}.`;
    default:
      return `이미 사용 중인 닉네임이에요. ${suggestion} 을 써주세요.`;
  }
}

function getAutoNicknameMessage(nickname) {
  switch (getLang()) {
    case "ja":
      return `空欄だったので ${nickname} を設定しました。`;
    case "en":
      return `Nickname was empty, so ${nickname} was assigned.`;
    default:
      return `닉네임이 비어 있어서 ${nickname} 으로 정했어요.`;
  }
}

function getNicknameCheckFailedMessage() {
  switch (getLang()) {
    case "ja":
      return "ニックネーム確認に失敗しました。もう一度試してください。";
    case "en":
      return "Could not verify the nickname. Please try again.";
    default:
      return "닉네임 확인에 실패했어요. 한 번만 다시 시도해주세요.";
  }
}

function applyNickname(nickname) {
  state.nickname = nickname;
  elements.introNicknameInput.value = nickname;
  elements.nicknameInput.value = nickname;
  rememberNickname(nickname);
}

async function resolveIntroNickname(rawValue) {
  const requestedNickname = normalizeName(rawValue);

  if (!requestedNickname) {
    const suggestedNickname = await findSuggestedNickname();
    setIntroNicknameStatus(getAutoNicknameMessage(suggestedNickname));
    return suggestedNickname;
  }

  if (await isNicknameAvailable(requestedNickname)) {
    return requestedNickname;
  }

  const suggestion = await findSuggestedNickname();
  const message = getNicknameTakenMessage(suggestion);
  elements.introNicknameInput.setCustomValidity(message);
  elements.introNicknameInput.reportValidity();
  setIntroNicknameStatus(message);
  return "";
}

function launchGame() {
  hideGameResult();
  setLobbyMobilePanel("none");
  showGameScreen();
  playGameMusic();
  syncResponsiveUi();
  requestLandscapePresentation(elements.gameScreen);
}

function updateLobbyPlayerInfo() {
  elements.lobbyNicknameDisplay.textContent = state.nickname || "-";
  elements.lobbyRankDisplay.textContent = state.lastRank ? `#${state.lastRank}` : "-";
}

function returnToLobby() {
  state.phase = "ready";
  setLobbyMobilePanel("none");
  showLobbyScreen();
  updateLobbyPlayerInfo();
  playLobbyMusic();
  syncResponsiveUi();
  fetchRankings();
  exitLandscapePresentation();
}

function bindHoldButton(element, code) {
  const press = (event) => {
    event.preventDefault();
    handleMovementKey(code, true);
  };

  const release = (event) => {
    event.preventDefault();
    handleMovementKey(code, false);
  };

  element.addEventListener("pointerdown", press);
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener("pointerleave", release);
}

function bindEvents() {
  elements.introNicknameInput.addEventListener("input", () => {
    clearIntroNicknameValidation();
  });

  elements.introForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearIntroNicknameValidation();
    elements.introStartButton.disabled = true;
    try {
      const nickname = await resolveIntroNickname(elements.introNicknameInput.value.trim());

      if (!nickname) {
        return;
      }

      applyNickname(nickname);
      showLobbyScreen();
      updateLobbyPlayerInfo();
      playLobbyMusic();
    } catch {
      setIntroNicknameStatus(getNicknameCheckFailedMessage());
    } finally {
      elements.introStartButton.disabled = false;
    }
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "KeyW", "Space"].includes(event.code)) {
      event.preventDefault();
    }

    handleMovementKey(event.code, true);
  });

  window.addEventListener("keyup", (event) => {
    handleMovementKey(event.code, false);
  });

  window.addEventListener("resize", syncResponsiveUi);
  window.addEventListener("orientationchange", syncResponsiveUi);
  document.addEventListener("visibilitychange", refreshRankingsInBackground);

  elements.startForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (state.phase === "loading" || state.phase === "submitting") {
      return;
    }

    const nickname = getActiveNickname() || state.nickname;
    elements.nicknameInput.value = nickname;
    rememberNickname(nickname);
    startRound(nickname);
    launchGame();
  });

  elements.restartButton.addEventListener("click", () => {
    if (state.phase === "submitting") {
      return;
    }

    const nickname = getActiveNickname() || state.nickname;
    elements.nicknameInput.value = nickname;
    rememberNickname(nickname);
    startRound(nickname);
    launchGame();
  });

  elements.lobbyButton.addEventListener("click", () => {
    returnToLobby();
  });

  elements.refreshRankingButton.addEventListener("click", () => {
    fetchRankings();
  });

  elements.musicToggleButton.addEventListener("click", () => {
    toggleMusic();
  });

  elements.openGuideButton.addEventListener("click", () => {
    setLobbyMobilePanel("guide");
  });

  elements.openRankingButton.addEventListener("click", () => {
    setLobbyMobilePanel("ranking");
  });

  elements.guideBackButton.addEventListener("click", () => {
    setLobbyMobilePanel("none");
  });

  elements.rankingBackButton.addEventListener("click", () => {
    setLobbyMobilePanel("none");
  });

  bindHoldButton(elements.moveLeftButton, "ArrowLeft");
  bindHoldButton(elements.moveRightButton, "ArrowRight");

  elements.jumpButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handleMovementKey("Space", true);
  });
}

export async function boot() {
  if (booted) {
    return;
  }

  booted = true;
  initI18n();
  state.playerId = getOrCreatePlayerId();
  const savedNickname = getSavedNickname();
  if (savedNickname) {
    applyNickname(savedNickname);
  } else {
    const suggestedNickname = buildNumberedNickname(getPreferredPlayerNumber());
    elements.introNicknameInput.value = suggestedNickname;
  }
  initAudio();
  bindEvents();
  showIntroScreen();
  hideGameResult();
  syncResponsiveUi();
  setStartButtonState({
    label: t("boot.loading.button"),
    disabled: true
  });

  window.addEventListener("langchange", () => {
    renderRankingList(state.rankings);
    if (state.phase === "loading") {
      setStartButtonState({ label: t("boot.loading.button"), disabled: true });
      return;
    }

    if (state.phase === "ready") {
      setStartButtonState({ label: t("boot.ready.button"), disabled: false });
      setRankingStatus(state.rankings.length ? t("ranking.best") : t("ranking.empty"));
      return;
    }

    if (state.phase === "error") {
      setStartButtonState({ label: t("boot.error.button"), disabled: true });
      setRankingStatus(t("boot.error.status"));
    }
  });

  try {
    state.assets = await loadAssets();
    renderGuideImages(state.assets);
    try {
      await fetchRankings();
    } catch {
      state.rankings = [];
      renderRankingList(state.rankings);
      setRankingStatus(t("ranking.failed"));
    }
    if (!state.nickname) {
      const suggestedNickname = buildNumberedNickname(getPreferredPlayerNumber());
      elements.introNicknameInput.value = suggestedNickname;
      elements.nicknameInput.value = suggestedNickname;
    }
    startRankingPolling();
    state.phase = "ready";
    setStartButtonState({
      label: t("boot.ready.button"),
      disabled: false
    });
  } catch {
    state.phase = "error";
    setStartButtonState({
      label: t("boot.error.button"),
      disabled: true
    });
    setRankingStatus(t("boot.error.status"));
  }

  requestAnimationFrame(animate);
}
