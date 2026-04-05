export function createAppRuntimeHelpers({
  applyPlaytestState,
  buildGuestNickname,
  elements,
  fetchRankings,
  getCurrentContentSeasonId,
  getLang,
  getOrientationGateCopy,
  isPortraitTouchViewport,
  isTouchDevice,
  launcherApiGetter,
  normalizeName,
  playtestBridgeKey,
  playtestEnabled,
  playtestMessageSource,
  playtestStatusInterval,
  playtestStatusSource,
  rankingPollInterval,
  renderFrame,
  setLobbyMobilePanel,
  setOrientationGateState,
  setTouchControlsVisible,
  setTouchControlCooldowns,
  showLobbyScreen,
  snackRushSessionControllerGetter,
  spawnPlaytestItemByKey,
  startRound,
  state,
  t,
  updateGame
} = {}) {
  let lastFrameTime = 0;
  let rankingPollTimer = 0;
  let playtestStatusTimer = 0;

  function isPlaytestActive() {
    return playtestEnabled;
  }

  function getGuestNickname() {
    return buildGuestNickname(state.playerId, getLang());
  }

  function getMemberDisplayName(user = state.authUser) {
    return normalizeName(user?.displayName || "");
  }

  function getProfileDisplayName(user = state.authUser) {
    return getMemberDisplayName(user) || String(user?.email || "").trim() || t("auth.guestTitle");
  }

  function getActiveNickname() {
    return getMemberDisplayName() || normalizeName(state.nickname) || getGuestNickname();
  }

  function getPlaytestScreen() {
    if (!elements.gameScreen.hidden) {
      return "game";
    }

    if (!elements.lobbyScreen.hidden) {
      return "lobby";
    }

    return "intro";
  }

  function getPlaytestStatusSnapshot() {
    return {
      phase: state.phase,
      screen: getPlaytestScreen(),
      nickname: state.nickname || getGuestNickname(),
      score: Math.max(0, Math.floor(state.score || 0)),
      round: Math.max(1, Math.floor(state.round || 1)),
      timeLeft: Math.max(0, Math.ceil(state.timeLeft || 0)),
      health: Math.max(0, Math.floor(state.health || 0)),
      maxHealth: Math.max(1, Math.floor(state.maxHealth || 1)),
      backgroundKey: state.roundBackgroundKey || "",
      contentSeasonId: getCurrentContentSeasonId(),
      playtest: true
    };
  }

  function postPlaytestStatus() {
    if (!isPlaytestActive() || window.parent === window) {
      return;
    }

    window.parent.postMessage({
      source: playtestStatusSource,
      type: "playtest:status",
      payload: getPlaytestStatusSnapshot()
    }, window.location.origin);
  }

  function startPlaytestStatusLoop() {
    if (!isPlaytestActive() || playtestStatusTimer) {
      return;
    }

    postPlaytestStatus();
    playtestStatusTimer = window.setInterval(postPlaytestStatus, playtestStatusInterval);
  }

  function animate(currentTime) {
    if (!lastFrameTime) {
      lastFrameTime = currentTime;
    }

    const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.033);
    lastFrameTime = currentTime;

    updateGame(dt);
    setTouchControlCooldowns({
      slideRemaining: state.phase === "playing"
        ? Math.max(0, state.player.slideCooldownUntil - state.elapsed)
        : 0
    });
    renderFrame();
    requestAnimationFrame(animate);
  }

  function syncResponsiveUi() {
    const showingGame = !elements.gameScreen.hidden;
    const showingPrestart = showingGame && elements.gameScreen?.dataset.mode === "prestart";
    setTouchControlsVisible(showingGame && !showingPrestart && isTouchDevice());

    if (!isTouchDevice()) {
      setOrientationGateState({ visible: false });
      return;
    }

    if (showingGame) {
      setOrientationGateState({
        visible: isPortraitTouchViewport(),
        ...getOrientationGateCopy(showingPrestart ? "start" : "game")
      });
      return;
    }

    // Never block lobby interactions with the orientation gate.
    setOrientationGateState({ visible: false });
  }

  function refreshRankingsInBackground() {
    if (isPlaytestActive()) {
      return;
    }

    if (document.hidden || elements.lobbyScreen.hidden || state.phase === "loading" || state.phase === "submitting") {
      return;
    }

    fetchRankings({ background: true });
  }

  function startRankingPolling() {
    if (isPlaytestActive() || rankingPollTimer) {
      return;
    }

    rankingPollTimer = window.setInterval(refreshRankingsInBackground, rankingPollInterval);
  }

  function enterPlaytestLobby() {
    state.phase = "ready";
    setLobbyMobilePanel("none");
    launcherApiGetter()?.closeLobbyRewardMessagePrompt?.({ markAlerted: false });
    showLobbyScreen();
    launcherApiGetter()?.updateLobbyPlayerInfo?.();
    launcherApiGetter()?.syncMobileNavigationState?.();
    syncResponsiveUi();
    postPlaytestStatus();
  }

  function ensurePlaytestRoundStarted({ nickname = getActiveNickname() } = {}) {
    const resolvedNickname = normalizeName(nickname) || getActiveNickname() || getGuestNickname();

    if (state.phase !== "playing" && state.phase !== "submitting") {
      startRound(resolvedNickname);
      snackRushSessionControllerGetter()?.launchGame?.();
    }

    return resolvedNickname;
  }

  function applyPlaytestAdjustments({ scoreDelta = 0, timeDelta = 0, healthDelta = 0 } = {}) {
    const nextScore = Math.max(0, Math.floor((state.score || 0) + Number(scoreDelta || 0)));
    const nextTime = Math.max(1, Math.ceil((state.timeLeft || 0) + Number(timeDelta || 0)));
    const nextHealth = Math.max(1, Math.min(state.maxHealth || 1, Math.floor((state.health || 0) + Number(healthDelta || 0))));

    applyPlaytestState({
      score: nextScore,
      timeLeft: nextTime,
      health: nextHealth
    });
    postPlaytestStatus();
  }

  function handlePlaytestMessage(event) {
    if (!isPlaytestActive() || event.origin !== window.location.origin) {
      return;
    }

    const message = event.data;
    if (!message || message.source !== playtestMessageSource) {
      return;
    }

    switch (message.type) {
      case "playtest:status-request":
        postPlaytestStatus();
        return;
      case "playtest:go-lobby":
        enterPlaytestLobby();
        return;
      case "playtest:start":
        ensurePlaytestRoundStarted({ nickname: message.payload?.nickname });
        postPlaytestStatus();
        return;
      case "playtest:preset":
        ensurePlaytestRoundStarted({ nickname: message.payload?.nickname });
        applyPlaytestState({
          score: message.payload?.score,
          round: message.payload?.round,
          timeLeft: message.payload?.timeLeft,
          health: message.payload?.health,
          spawnTimer: message.payload?.spawnTimer
        });
        postPlaytestStatus();
        return;
      case "playtest:adjust":
        ensurePlaytestRoundStarted({ nickname: message.payload?.nickname });
        applyPlaytestAdjustments(message.payload || {});
        return;
      case "playtest:spawn":
        ensurePlaytestRoundStarted({ nickname: message.payload?.nickname });
        spawnPlaytestItemByKey(message.payload?.key, {
          x: Number.isFinite(message.payload?.x) ? message.payload.x : state.player.x,
          y: Number.isFinite(message.payload?.y) ? message.payload.y : -40
        });
        postPlaytestStatus();
        return;
      default:
        return;
    }
  }

  function installPlaytestBridge() {
    if (!isPlaytestActive()) {
      return;
    }

    window[playtestBridgeKey] = {
      getStatus() {
        return getPlaytestStatusSnapshot();
      },
      goLobby() {
        enterPlaytestLobby();
        return getPlaytestStatusSnapshot();
      },
      start(payload = {}) {
        ensurePlaytestRoundStarted({ nickname: payload.nickname });
        postPlaytestStatus();
        return getPlaytestStatusSnapshot();
      },
      preset(payload = {}) {
        ensurePlaytestRoundStarted({ nickname: payload.nickname });
        applyPlaytestState({
          score: payload.score,
          round: payload.round,
          timeLeft: payload.timeLeft,
          health: payload.health,
          spawnTimer: payload.spawnTimer
        });
        postPlaytestStatus();
        return getPlaytestStatusSnapshot();
      },
      adjust(payload = {}) {
        ensurePlaytestRoundStarted({ nickname: payload.nickname });
        applyPlaytestAdjustments(payload);
        return getPlaytestStatusSnapshot();
      },
      spawn(payload = {}) {
        ensurePlaytestRoundStarted({ nickname: payload.nickname });
        const spawned = spawnPlaytestItemByKey(payload.key, {
          x: Number.isFinite(payload.x) ? payload.x : state.player.x,
          y: Number.isFinite(payload.y) ? payload.y : -40
        });
        postPlaytestStatus();
        return {
          spawned,
          status: getPlaytestStatusSnapshot()
        };
      }
    };
  }

  function getCurrentRoundNickname() {
    return getActiveNickname() || state.nickname;
  }

  return {
    applyPlaytestAdjustments,
    animate,
    enterPlaytestLobby,
    ensurePlaytestRoundStarted,
    getActiveNickname,
    getCurrentRoundNickname,
    getGuestNickname,
    getMemberDisplayName,
    getPlaytestStatusSnapshot,
    getProfileDisplayName,
    handlePlaytestMessage,
    installPlaytestBridge,
    isPlaytestActive,
    postPlaytestStatus,
    refreshRankingsInBackground,
    startPlaytestStatusLoop,
    startRankingPolling,
    syncResponsiveUi
  };
}
