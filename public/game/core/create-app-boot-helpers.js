import { getRankingClosureNotice, isRankingClosed } from "../config/runtime.js";

export function createAppBootHelpers({
  animate,
  applyNickname,
  clearSavedNickname,
  elements,
  fetchRankings,
  getGuestNickname,
  getLang,
  getOrCreatePlayerId,
  hideGameResult,
  initAudio,
  initAuth,
  initI18n,
  installPlaytestBridge,
  introBackgroundByLang,
  isPlaytestActive,
  launcherApiGetter,
  loadAssets,
  renderGuideImages,
  renderMessages,
  renderRankingList,
  setAuthMode,
  setRankingStatus,
  setStartButtonState,
  showIntroScreen,
  showLobbyScreen,
  snackRushRuntimeGetter,
  startPlaytestStatusLoop,
  startPresenceTracking,
  startRankingPolling,
  state,
  syncResponsiveUi,
  t
}) {
  let introBackgroundAssetsPrimed = false;

  function getIntroBackgroundSrc(lang = getLang()) {
    return introBackgroundByLang[lang] || introBackgroundByLang.ko;
  }

  function primeIntroBackgroundAssets() {
    if (introBackgroundAssetsPrimed || typeof Image === "undefined") {
      return;
    }

    introBackgroundAssetsPrimed = true;
    Object.values(introBackgroundByLang).forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    });
  }

  function syncIntroBackground() {
    if (!elements.introBackgroundImage) {
      return;
    }

    const nextSrc = getIntroBackgroundSrc();
    if (elements.introBackgroundImage.getAttribute("src") !== nextSrc) {
      elements.introBackgroundImage.setAttribute("src", nextSrc);
    }
  }

  function syncSnackRushBootStatusUi() {
    snackRushRuntimeGetter()?.syncBootStatusUi?.({
      setRankingStatus,
      setStartButtonState
    });
  }

  function syncServiceNotice() {
    if (!elements.serviceNotice) {
      return;
    }

    const notice = getRankingClosureNotice();
    elements.serviceNotice.textContent = notice;
    elements.serviceNotice.hidden = !notice;
  }

  function bootLauncher() {
    launcherApiGetter()?.updateAuthUi?.();
    launcherApiGetter()?.syncMobileNavigationState?.();
    setAuthMode("login");
    launcherApiGetter()?.boot?.();
    launcherApiGetter()?.refreshShopState?.();
  }

  function bootIntro() {
    if (isPlaytestActive()) {
      showLobbyScreen();
      launcherApiGetter()?.updateLobbyPlayerInfo?.();
      setRankingStatus("Playtest mode: rankings are disabled.");
      renderRankingList([]);
      return;
    }

    showIntroScreen();
  }

  function bootSnackRush() {
    state.phase = "loading";
    hideGameResult();
    syncResponsiveUi();
    syncSnackRushBootStatusUi();
  }

  function bootSharedRuntime() {
    initI18n();
    primeIntroBackgroundAssets();
    syncIntroBackground();
    syncServiceNotice();
    state.playerId = getOrCreatePlayerId();
    clearSavedNickname();
    applyNickname(getGuestNickname());
  }

  function bootSharedServices() {
    if (!isPlaytestActive()) {
      startPresenceTracking({
        playerId: state.playerId,
        getNickname: () => state.nickname,
        getPhase: () => state.phase
      });
    }

    void initAuth((user) => launcherApiGetter()?.handleAuthStateChanged?.(user)).catch((error) => {
      state.authReady = true;
      launcherApiGetter()?.updateAuthUi?.();
      console.warn("Failed to initialize auth state.", error);
    });

    initAudio();
    installPlaytestBridge();
  }

  function syncSharedLanguageState({ authModalState, renderMessagesFallback }) {
    syncIntroBackground();
    syncServiceNotice();

    if (!state.authUser) {
      applyNickname(getGuestNickname());
    }

    launcherApiGetter()?.handleLanguageChange?.();
    launcherApiGetter()?.updateAuthUi?.();
    syncResponsiveUi();
    setAuthMode(authModalState.mode);

    if (!elements.profileModal.hidden) {
      launcherApiGetter()?.renderProfileFromState?.();
    }

    if (!elements.messagesModal.hidden) {
      renderMessages(renderMessagesFallback || []);
      launcherApiGetter()?.updateMessagesButtonLabel?.();
    }
  }

  function syncSnackRushLanguageState() {
    snackRushRuntimeGetter()?.syncLanguageState?.({
      setRankingStatus,
      setStartButtonState
    });
  }

  function registerLanguageChangeHandler({ activeGameBootPlan = null, authModalState, getMessageList }) {
    window.addEventListener("langchange", () => {
      syncSharedLanguageState({
        authModalState,
        renderMessagesFallback: getMessageList?.() || []
      });
      activeGameBootPlan?.handleLanguageChange?.();
    });
  }

  async function loadSnackRushBootResources() {
    state.assets = await loadAssets();
    renderGuideImages(state.assets);

    if (isPlaytestActive()) {
      state.rankings = [];
      renderRankingList(state.rankings);
      setRankingStatus("Playtest mode: rankings are disabled.");
      return;
    }

    try {
      await fetchRankings();
    } catch {
      state.rankings = [];
      renderRankingList(state.rankings);
      setRankingStatus(t("ranking.failed"));
    }

    if (!isRankingClosed()) {
      startRankingPolling();
    }
  }

  function finalizeSnackRushBootReady() {
    state.phase = "ready";
    syncSnackRushBootStatusUi();
  }

  function finalizeSnackRushBootError() {
    state.phase = "error";
    syncSnackRushBootStatusUi();
  }

  function createSnackRushBootPlan() {
    return {
      bootShell: bootSnackRush,
      finalizeError: finalizeSnackRushBootError,
      finalizeReady: finalizeSnackRushBootReady,
      handleLanguageChange: syncSnackRushLanguageState,
      loadResources: loadSnackRushBootResources
    };
  }

  function createCurrentGameBootPlan() {
    return createSnackRushBootPlan();
  }

  async function bootCurrentGame(activeGameBootPlan) {
    activeGameBootPlan?.bootShell?.();

    try {
      await activeGameBootPlan?.loadResources?.();
      activeGameBootPlan?.finalizeReady?.();
    } catch {
      activeGameBootPlan?.finalizeError?.();
    }
  }

  function startBootRuntimeLoops() {
    startPlaytestStatusLoop();
    requestAnimationFrame(animate);
  }

  return {
    bootCurrentGame,
    bootIntro,
    bootLauncher,
    bootSharedRuntime,
    bootSharedServices,
    createCurrentGameBootPlan,
    registerLanguageChangeHandler,
    startBootRuntimeLoops
  };
}
